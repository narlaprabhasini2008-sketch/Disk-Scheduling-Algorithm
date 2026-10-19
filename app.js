/* =============================================
   DiskOS — Disk Scheduling Algorithm Visualizer
   Main Application Logic
   ============================================= */

'use strict';

// ============================================================
// ALGORITHM DATA
// ============================================================
const ALGORITHMS = [
  {
    id: 'fcfs',
    name: 'FCFS',
    full: 'First Come First Serve',
    icon: '1️⃣',
    badge: 'badge-classic',
    badgeText: 'Classic',
    desc: 'Requests are serviced in the exact order they arrive in the queue. No reordering is done. The disk head moves to each requested cylinder in arrival sequence.',
    principle: 'Process each request in arrival order without any optimization for seek distance.',
    pros: ['No starvation — every request is guaranteed service', 'Simple to implement with O(n) time complexity', 'Fair to all requests regardless of position'],
    cons: ['Poor seek performance for random request patterns', 'High average seek time compared to other algorithms', 'Disk head may zigzag across cylinders repeatedly'],
    complexity: 'O(n)',
    starve: 'None'
  },
  {
    id: 'sstf',
    name: 'SSTF',
    full: 'Shortest Seek Time First',
    icon: '🎯',
    badge: 'badge-optimal',
    badgeText: 'Efficient',
    desc: 'At each step, the request closest to the current head position is selected and serviced next. This greedy approach minimizes individual seek distances.',
    principle: 'Greedily select the pending request with minimum absolute distance from current head position.',
    pros: ['Significantly lower average seek time than FCFS', 'Better throughput for clustered request patterns', 'Natural performance optimization without complexity'],
    cons: ['Starvation possible — far requests may wait indefinitely', 'Not fair — requests near head always win priority', 'May cause hold-and-wait situations for distant cylinders'],
    complexity: 'O(n²)',
    starve: 'Possible'
  },
  {
    id: 'scan',
    name: 'SCAN',
    full: 'Elevator Algorithm',
    icon: '🛗',
    badge: 'badge-fair',
    badgeText: 'Fair',
    desc: 'The disk head moves in one direction, services all requests it encounters, reaches the disk boundary (0 or maxCylinder), then reverses direction — just like an elevator.',
    principle: 'Move head in current direction to disk boundary, servicing all requests en route, then reverse direction.',
    pros: ['No starvation — all requests are serviced', 'Better throughput than FCFS in heavy loads', 'Predictable wait times for incoming requests'],
    cons: ['Requests just past the reversal point wait longest', 'Unnecessary movement to disk boundary even with no pending requests', 'Non-uniform wait time distribution'],
    complexity: 'O(n log n)',
    starve: 'None'
  },
  {
    id: 'cscan',
    name: 'C-SCAN',
    full: 'Circular SCAN',
    icon: '🔄',
    badge: 'badge-fair',
    badgeText: 'Uniform',
    desc: 'Like SCAN, but after reaching the end (max cylinder), the head jumps back to cylinder 0 without servicing any requests on the return trip, then sweeps forward again.',
    principle: 'Sweep head from min to max, service requests, then jump back to min (no service on return) and repeat.',
    pros: ['More uniform wait time distribution than SCAN', 'No starvation — all requests are serviced', 'Predictable maximum wait time for new requests'],
    cons: ['Longer seek distance due to jump back to cylinder 0', 'Still travels to boundaries even with sparse requests', 'Jump-back distance adds to total seek time'],
    complexity: 'O(n log n)',
    starve: 'None'
  },
  {
    id: 'look',
    name: 'LOOK',
    full: 'LOOK Algorithm',
    icon: '👁️',
    badge: 'badge-optimal',
    badgeText: 'Better',
    desc: 'An optimized version of SCAN. The head moves to the last pending request in the current direction instead of going all the way to the disk boundary, then reverses.',
    principle: 'Like SCAN but head reverses at the last pending request, not the disk boundary. Avoids unnecessary movement.',
    pros: ['More efficient than SCAN — avoids unnecessary boundary travel', 'No starvation guaranteed', 'Better performance for sparse request distributions'],
    cons: ['Requests just past the last pending request in each direction still wait longer', 'Slightly more complex to implement than SCAN', 'Not as uniform as C-LOOK for wait times'],
    complexity: 'O(n log n)',
    starve: 'None'
  },
  {
    id: 'clook',
    name: 'C-LOOK',
    full: 'Circular LOOK',
    icon: '🔁',
    badge: 'badge-optimal',
    badgeText: 'Best',
    desc: 'An optimized version of C-SCAN. After servicing the last request in the forward direction, the head jumps to the lowest pending request (not cylinder 0) and sweeps forward again.',
    principle: 'Like C-SCAN but head jumps to the smallest pending request instead of cylinder 0. Optimal for most workloads.',
    pros: ['Most efficient variant — minimal unnecessary movement', 'Better uniform wait time than LOOK', 'No starvation — all requests are serviced'],
    cons: ['Slightly more complex state management', 'Jump from max request to min request still counts as seek distance', 'Performance depends heavily on request distribution'],
    complexity: 'O(n log n)',
    starve: 'None'
  },
];

// ============================================================
// ALGORITHM IMPLEMENTATIONS
// ============================================================

function computeFCFS(head, requests) {
  const order = [head, ...requests];
  return buildResult(order, 'FCFS');
}

function computeSSTF(head, requests) {
  const pending = [...requests];
  const order = [head];
  let current = head;
  while (pending.length > 0) {
    let minDist = Infinity, minIdx = 0;
    for (let i = 0; i < pending.length; i++) {
      const d = Math.abs(pending[i] - current);
      if (d < minDist) { minDist = d; minIdx = i; }
    }
    current = pending[minIdx];
    order.push(current);
    pending.splice(minIdx, 1);
  }
  return buildResult(order, 'SSTF');
}

function computeSCAN(head, requests, direction, minCyl, maxCyl) {
  const sorted = [...requests].sort((a, b) => a - b);
  const left = sorted.filter(r => r <= head).reverse();
  const right = sorted.filter(r => r > head);

  let order = [head];
  if (direction === 'right') {
    // Service right, then go to maxCyl, then service left
    for (const r of right) order.push(r);
    if (right.length === 0 || right[right.length - 1] !== maxCyl) order.push(maxCyl);
    for (const r of left) order.push(r);
  } else {
    // Service left, then go to minCyl, then service right
    for (const r of left) order.push(r);
    if (left.length === 0 || left[left.length - 1] !== minCyl) order.push(minCyl);
    for (const r of right.reverse()) order.push(r);
  }
  return buildResult(order, 'SCAN');
}

function computeCSCAN(head, requests, direction, minCyl, maxCyl) {
  const sorted = [...requests].sort((a, b) => a - b);
  const left = sorted.filter(r => r < head);
  const right = sorted.filter(r => r >= head);

  let order = [head];
  // C-SCAN always goes to maxCyl first, then jumps to minCyl
  for (const r of right) order.push(r);
  if (right.length === 0 || right[right.length - 1] !== maxCyl) order.push(maxCyl);
  order.push(minCyl); // Jump (no service)
  for (const r of left) order.push(r);

  return buildResult(order, 'C-SCAN', { jumpIdx: right.length + (right[right.length-1] !== maxCyl ? 2 : 1) });
}

function computeLOOK(head, requests, direction) {
  const sorted = [...requests].sort((a, b) => a - b);
  const left = sorted.filter(r => r <= head).reverse();
  const right = sorted.filter(r => r > head);

  let order = [head];
  if (direction === 'right') {
    for (const r of right) order.push(r);
    for (const r of left) order.push(r);
  } else {
    for (const r of left) order.push(r);
    for (const r of right.reverse()) order.push(r);
  }
  return buildResult(order, 'LOOK');
}

function computeCLOOK(head, requests, direction) {
  const sorted = [...requests].sort((a, b) => a - b);
  const left = sorted.filter(r => r < head);
  const right = sorted.filter(r => r >= head);

  let order = [head];
  // Service requests >= head first, then jump to lowest pending, then service remaining
  for (const r of right) order.push(r);
  if (left.length > 0) {
    // Jump to min request (not cylinder 0)
    for (const r of left) order.push(r);
  }
  return buildResult(order, 'C-LOOK');
}

function buildResult(order, name, extra = {}) {
  let total = 0;
  const steps = [];
  for (let i = 1; i < order.length; i++) {
    const dist = Math.abs(order[i] - order[i - 1]);
    total += dist;
    steps.push({ from: order[i-1], to: order[i], dist });
  }
  const requests = order.length - 1;
  return {
    name,
    order,
    steps,
    total,
    avg: requests > 0 ? (total / requests).toFixed(2) : 0,
    ...extra
  };
}

function runAlgorithm(id, head, requests, direction, minCyl, maxCyl) {
  switch (id) {
    case 'fcfs':  return computeFCFS(head, requests);
    case 'sstf':  return computeSSTF(head, requests);
    case 'scan':  return computeSCAN(head, requests, direction, minCyl, maxCyl);
    case 'cscan': return computeCSCAN(head, requests, direction, minCyl, maxCyl);
    case 'look':  return computeLOOK(head, requests, direction);
    case 'clook': return computeCLOOK(head, requests, direction);
    default: return computeFCFS(head, requests);
  }
}

// ============================================================
// CANVAS VISUALIZATION
// ============================================================
const canvas = document.getElementById('diskCanvas');
const ctx = canvas.getContext('2d');

let simResult = null;
let animStep = 0;
let animProgress = 0;
let animRunning = false;
let animPaused = false;
let animRAF = null;
let simParams = null;
let animSpeed = 3;

function getAnimDuration() {
  const speeds = { 1: 1200, 2: 800, 3: 500, 4: 280, 5: 120 };
  return speeds[animSpeed] || 500;
}

function drawDisk(result, params, step, progress) {
  if (!result || !params) return;

  const W = canvas.width;
  const H = canvas.height;
  const PAD_LEFT = 60;
  const PAD_RIGHT = 24;
  const PAD_TOP = 48;
  const PAD_BOT = 40;

  const { minCyl, maxCyl } = params;
  const range = maxCyl - minCyl;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, W, H);

  // Grid lines and cylinder labels
  const cylinders = [];
  const step20 = Math.max(1, Math.round(range / 10));
  for (let c = minCyl; c <= maxCyl; c += step20) cylinders.push(c);
  if (cylinders[cylinders.length - 1] !== maxCyl) cylinders.push(maxCyl);

  // Also add request cylinders to labels
  const reqCyls = new Set(result.order);
  reqCyls.forEach(c => { if (!cylinders.includes(c)) cylinders.push(c); });
  cylinders.sort((a, b) => a - b);

  function cylX(c) {
    return PAD_LEFT + ((c - minCyl) / range) * (W - PAD_LEFT - PAD_RIGHT);
  }

  // Draw vertical grid lines
  for (const c of cylinders) {
    const x = cylX(c);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, PAD_TOP - 10);
    ctx.lineTo(x, H - PAD_BOT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(c, x, H - PAD_BOT + 18);
  }

  // Cylinder axis line
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD_LEFT, H - PAD_BOT);
  ctx.lineTo(W - PAD_RIGHT, H - PAD_BOT);
  ctx.stroke();

  // Y positions for each point in order
  const totalPoints = result.order.length;
  const rowH = (H - PAD_TOP - PAD_BOT) / Math.max(totalPoints - 1, 1);

  function ptY(idx) { return PAD_TOP + idx * rowH; }

  // Draw completed path lines
  for (let i = 0; i < Math.min(step, totalPoints - 1); i++) {
    const x1 = cylX(result.order[i]);
    const x2 = cylX(result.order[i + 1]);
    const y1 = ptY(i);
    const y2 = ptY(i + 1);

    // Check if this is a C-SCAN jump
    const isJump = result.jumpIdx && i + 1 === result.jumpIdx - 1;

    ctx.strokeStyle = isJump ? '#F59E0B' : '#2563EB';
    ctx.lineWidth = 2.5;
    ctx.setLineDash(isJump ? [6, 4] : []);
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Draw current animated segment
  if (step < totalPoints - 1 && progress > 0) {
    const x1 = cylX(result.order[step]);
    const x2 = cylX(result.order[step + 1]);
    const y1 = ptY(step);
    const y2 = ptY(step + 1);
    const cx = x1 + (x2 - x1) * progress;
    const cy = y1 + (y2 - y1) * progress;

    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Draw dots for each order position
  for (let i = 0; i < totalPoints; i++) {
    const x = cylX(result.order[i]);
    const y = ptY(i);
    const isDone = i < step;
    const isCurrent = i === step;
    const isHead = i === 0;
    const isRequest = !isHead;

    if (isDone) {
      // Serviced dot
      ctx.fillStyle = '#22C55E';
      ctx.strokeStyle = '#16A34A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Checkmark
      ctx.fillStyle = 'white';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', x, y);
      ctx.textBaseline = 'alphabetic';
    } else if (isCurrent) {
      // Active head
      const pulseR = 12 + Math.sin(Date.now() / 250) * 2;
      ctx.fillStyle = 'rgba(37,99,235,0.12)';
      ctx.beginPath();
      ctx.arc(x, y, pulseR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2563EB';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(37,99,235,0.4)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Pending dot
      ctx.fillStyle = isHead ? '#2563EB' : '#CBD5E1';
      ctx.strokeStyle = isHead ? '#1D4ED8' : '#94A3B8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Cylinder number label
    const labelX = x + (x > W / 2 ? -14 : 14);
    ctx.fillStyle = isCurrent ? '#2563EB' : isDone ? '#16A34A' : '#475569';
    ctx.font = `${isCurrent ? 'bold 12px' : '11px'} JetBrains Mono, monospace`;
    ctx.textAlign = x > W / 2 ? 'right' : 'left';
    ctx.fillText(result.order[i], labelX, y + 4);

    // Row index label
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`#${i}`, PAD_LEFT - 8, y + 4);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function startAnimation() {
  if (animRAF) cancelAnimationFrame(animRAF);
  animRunning = true;
  animPaused = false;
  animStep = 0;
  animProgress = 0;

  let lastTime = null;
  const duration = getAnimDuration();

  function tick(timestamp) {
    if (!animRunning) return;
    if (animPaused) { animRAF = requestAnimationFrame(tick); return; }
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    animProgress += dt / duration;

    if (animProgress >= 1) {
      animProgress = 0;
      animStep++;
      if (animStep >= simResult.order.length - 1) {
        animStep = simResult.order.length - 1;
        animProgress = 1;
        animRunning = false;
        updatePlayPauseBtn(false);
      }
    }

    drawDisk(simResult, simParams, animStep, animProgress);
    updateInfoBar();

    if (animRunning) animRAF = requestAnimationFrame(tick);
    else drawDisk(simResult, simParams, animStep, 1);
  }

  animRAF = requestAnimationFrame(tick);
  updatePlayPauseBtn(true);
}

function togglePlayPause() {
  if (!simResult) return;
  if (!animRunning && animStep >= simResult.order.length - 1) {
    restartAnimation();
    return;
  }
  animPaused = !animPaused;
  if (!animPaused && !animRunning) {
    animRunning = true;
    startAnimation();
  }
  updatePlayPauseBtn(!animPaused);
}

function restartAnimation() {
  if (!simResult) return;
  startAnimation();
}

function stepAnimation() {
  if (!simResult) return;
  animPaused = true;
  animRunning = false;
  if (animRAF) cancelAnimationFrame(animRAF);
  if (animStep < simResult.order.length - 1) {
    animStep++;
    animProgress = 1;
  }
  drawDisk(simResult, simParams, animStep, 1);
  updateInfoBar();
  updatePlayPauseBtn(false);
}

function updatePlayPauseBtn(isPlaying) {
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const btn = document.getElementById('playPauseBtn');
  if (isPlaying && !animPaused) {
    playIcon.style.display = 'none';
    pauseIcon.style.display = '';
    btn.classList.add('active');
  } else {
    playIcon.style.display = '';
    pauseIcon.style.display = 'none';
    btn.classList.remove('active');
  }
}

function updateInfoBar() {
  if (!simResult) return;
  const idx = Math.min(animStep, simResult.order.length - 1);
  document.getElementById('infoCurrentCyl').textContent = simResult.order[idx];
  document.getElementById('infoStep').textContent = `${idx} / ${simResult.order.length - 1}`;
  let seekSoFar = 0;
  for (let i = 0; i < idx; i++) seekSoFar += simResult.steps[i]?.dist || 0;
  document.getElementById('infoSeek').textContent = seekSoFar;
  document.getElementById('infoRemaining').textContent = simResult.order.length - 1 - idx;
}

// ============================================================
// INPUT VALIDATION
// ============================================================
function parseRequests(str) {
  const parts = str.split(',').map(s => s.trim()).filter(s => s.length > 0);
  const nums = parts.map(Number);
  if (nums.some(isNaN)) return null;
  return nums;
}

function validateInputs() {
  let valid = true;

  const queueStr = document.getElementById('requestQueue').value;
  const requests = parseRequests(queueStr);
  const queueErr = document.getElementById('queueError');
  const queueInput = document.getElementById('requestQueue');
  if (!requests || requests.length === 0) {
    queueErr.textContent = 'Please enter valid comma-separated cylinder numbers.';
    queueInput.classList.add('error');
    valid = false;
  } else {
    queueErr.textContent = '';
    queueInput.classList.remove('error');
  }

  const headVal = parseInt(document.getElementById('headPosition').value);
  const headErr = document.getElementById('headError');
  const headInput = document.getElementById('headPosition');
  if (isNaN(headVal) || headVal < 0) {
    headErr.textContent = 'Initial head position must be a non-negative integer.';
    headInput.classList.add('error');
    valid = false;
  } else {
    headErr.textContent = '';
    headInput.classList.remove('error');
  }

  const minCyl = parseInt(document.getElementById('minCylinder').value);
  const maxCyl = parseInt(document.getElementById('maxCylinder').value);
  const cylErr = document.getElementById('cylError');
  const maxInput = document.getElementById('maxCylinder');
  if (isNaN(maxCyl) || maxCyl <= minCyl) {
    cylErr.textContent = 'Max cylinder must be greater than min cylinder.';
    maxInput.classList.add('error');
    valid = false;
  } else {
    cylErr.textContent = '';
    maxInput.classList.remove('error');
  }

  if (valid && requests) {
    const outOfRange = requests.filter(r => r < minCyl || r > maxCyl);
    if (outOfRange.length > 0) {
      queueErr.textContent = `Cylinders out of range [${minCyl}, ${maxCyl}]: ${outOfRange.join(', ')}`;
      queueInput.classList.add('error');
      valid = false;
    }
  }

  return valid ? { requests, head: headVal, minCyl, maxCyl } : null;
}

// ============================================================
// RUN SIMULATION
// ============================================================
function runSimulation(algoIdOverride) {
  const params = validateInputs();
  if (!params) return;

  const algoId = algoIdOverride || document.getElementById('algorithm').value;
  const direction = document.getElementById('direction').value;
  animSpeed = parseInt(document.getElementById('speedControl').value);

  simParams = { ...params, direction };
  simResult = runAlgorithm(algoId, params.head, params.requests, direction, params.minCyl, params.maxCyl);

  // Show stats
  const statsPanel = document.getElementById('statsPanel');
  statsPanel.style.display = 'block';
  document.getElementById('statAlgo').textContent = simResult.name;
  document.getElementById('statTotal').textContent = simResult.total;
  document.getElementById('statAvg').textContent = simResult.avg;
  document.getElementById('statReqs').textContent = params.requests.length;
  document.getElementById('statOrder').textContent = simResult.order.join(' → ');

  // Show canvas controls
  document.getElementById('canvasControls').style.display = 'flex';
  document.getElementById('canvasPlaceholder').style.display = 'none';
  document.getElementById('cylInfoBar').style.display = 'grid';

  // Resize canvas to parent
  const container = canvas.parentElement;
  canvas.width = container.offsetWidth || 700;
  canvas.height = Math.max(300, Math.min(500, (simResult.order.length * 44) + 100));

  startAnimation();
}

function resetSimulation() {
  if (animRAF) cancelAnimationFrame(animRAF);
  simResult = null;
  simParams = null;
  animRunning = false;
  animPaused = false;
  animStep = 0;
  animProgress = 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById('statsPanel').style.display = 'none';
  document.getElementById('canvasControls').style.display = 'none';
  document.getElementById('canvasPlaceholder').style.display = 'flex';
  document.getElementById('cylInfoBar').style.display = 'none';
  updatePlayPauseBtn(false);

  // Clear errors
  ['queueError', 'headError', 'cylError'].forEach(id => document.getElementById(id).textContent = '');
  ['requestQueue', 'headPosition', 'maxCylinder'].forEach(id => document.getElementById(id).classList.remove('error'));
}

function loadExample() {
  document.getElementById('requestQueue').value = '98, 183, 37, 122, 14, 124, 65, 67';
  document.getElementById('headPosition').value = '53';
  document.getElementById('minCylinder').value = '0';
  document.getElementById('maxCylinder').value = '199';
  document.getElementById('direction').value = 'right';
}

// ============================================================
// COMPARISON
// ============================================================
function compareAll() {
  const params = validateInputs();
  if (!params) {
    document.getElementById('compare').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const direction = document.getElementById('direction').value;
  const algoIds = ['fcfs', 'sstf', 'scan', 'cscan', 'look', 'clook'];
  const results = algoIds.map(id =>
    runAlgorithm(id, params.head, params.requests, direction, params.minCyl, params.maxCyl)
  );

  const maxTotal = Math.max(...results.map(r => r.total));
  const minTotal = Math.min(...results.map(r => r.total));

  const layout = document.getElementById('compareLayout');
  layout.innerHTML = `
    <div class="compare-header-row">
      <div>
        <div class="compare-title">All Algorithms — Total Seek Distance</div>
        <div class="compare-note">Head = ${params.head} | Queue: ${params.requests.join(', ')} | Range: [${params.minCyl}, ${params.maxCyl}]</div>
      </div>
    </div>
    <div class="compare-grid" id="compareGrid"></div>
  `;

  const grid = document.getElementById('compareGrid');
  results.sort((a, b) => a.total - b.total);

  results.forEach((r, i) => {
    const isBest = r.total === minTotal;
    const pct = maxTotal > 0 ? (r.total / maxTotal) * 100 : 100;
    const row = document.createElement('div');
    row.className = `compare-row${isBest ? ' best' : ''}`;
    row.innerHTML = `
      <div class="cmp-algo-name">
        ${r.name}${isBest ? '<span class="best-badge">✓ Best</span>' : ''}
      </div>
      <div class="cmp-bar-wrap">
        <div class="cmp-bar-bg">
          <div class="cmp-bar-fill${isBest ? ' best-fill' : ''}" style="width: 0%" data-pct="${pct}"></div>
        </div>
      </div>
      <div class="cmp-val">${r.total}</div>
    `;
    grid.appendChild(row);

    // Animate bar
    setTimeout(() => {
      const bar = row.querySelector('.cmp-bar-fill');
      bar.style.width = pct + '%';
    }, 50 + i * 80);
  });

  document.getElementById('compare').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// ALGORITHM CARDS
// ============================================================
function renderAlgoCards() {
  const grid = document.getElementById('algo-grid');
  ALGORITHMS.forEach((algo, i) => {
    const card = document.createElement('div');
    card.className = 'algo-card';
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <div class="algo-card-header">
        <div class="algo-icon">${algo.icon}</div>
        <div class="algo-title-wrap">
          <div class="algo-name">${algo.name}</div>
          <div class="algo-short">${algo.full}</div>
        </div>
        <span class="algo-badge ${algo.badge}">${algo.badgeText}</span>
      </div>
      <p class="algo-desc">${algo.desc}</p>
      <div class="algo-principle"><strong>Principle:</strong> ${algo.principle}</div>
      <div class="algo-pros-cons">
        <div class="algo-pros">
          <strong>✓ Pros</strong>
          <ul>${algo.pros.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="algo-cons">
          <strong>✗ Cons</strong>
          <ul>${algo.cons.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="algo-card-footer">
        <button class="btn btn-primary" style="flex:1; justify-content:center;" onclick="tryAlgorithm('${algo.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Try Algorithm
        </button>
        <button class="btn btn-outline" onclick="openAlgoModal('${algo.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Details
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function tryAlgorithm(id) {
  document.getElementById('algorithm').value = id;
  document.getElementById('simulator').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => runSimulation(id), 600);
}

// ============================================================
// MODAL
// ============================================================
function openAlgoModal(id) {
  const algo = ALGORITHMS.find(a => a.id === id);
  if (!algo) return;
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-algo-icon">${algo.icon}</div>
    <div class="modal-algo-name">${algo.name}</div>
    <div class="modal-algo-full">${algo.full}</div>
    <div class="modal-section">
      <h4>Description</h4>
      <p>${algo.desc}</p>
    </div>
    <div class="modal-section">
      <h4>Working Principle</h4>
      <p>${algo.principle}</p>
    </div>
    <div class="modal-section">
      <h4>Advantages</h4>
      <ul style="margin-left:20px; color:#475569; font-size:0.9rem; line-height:1.8;">
        ${algo.pros.map(p => `<li style="color:#16A34A;">${p}</li>`).join('')}
      </ul>
    </div>
    <div class="modal-section">
      <h4>Disadvantages</h4>
      <ul style="margin-left:20px; color:#475569; font-size:0.9rem; line-height:1.8;">
        ${algo.cons.map(c => `<li style="color:#DC2626;">${c}</li>`).join('')}
      </ul>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:14px;">
        <div style="font-size:0.72rem;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Time Complexity</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:1rem;font-weight:700;color:#0F172A;">${algo.complexity}</div>
      </div>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:14px;">
        <div style="font-size:0.72rem;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Starvation Risk</div>
        <div style="font-size:1rem;font-weight:700;color:${algo.starve === 'None' ? '#16A34A' : '#DC2626'};">${algo.starve}</div>
      </div>
    </div>
    <div style="margin-top:20px;">
      <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="tryAlgorithm('${algo.id}'); closeAlgoModal();">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Try ${algo.name} in Simulator
      </button>
    </div>
  `;
  document.getElementById('algoModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAlgoModal() {
  document.getElementById('algoModal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModal(e) {
  if (e.target === document.getElementById('algoModal')) closeAlgoModal();
}

// ============================================================
// LEARN TABS
// ============================================================
function switchTab(btn, tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
}

// ============================================================
// HEADER SCROLL
// ============================================================
function setupHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Active nav link
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  });

  // Hamburger
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('nav').classList.toggle('open');
  });

  // Close nav on link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => document.getElementById('nav').classList.remove('open'));
  });
}

// ============================================================
// SPEED CONTROL
// ============================================================
document.getElementById('speedControl').addEventListener('input', function () {
  animSpeed = parseInt(this.value);
});

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAlgoModal();
  if (e.key === ' ' && simResult && !e.target.matches('input, select, textarea')) {
    e.preventDefault();
    togglePlayPause();
  }
  if (e.key === 'ArrowRight' && simResult && !e.target.matches('input, select, textarea')) {
    stepAnimation();
  }
});

// ============================================================
// INTERSECTION OBSERVER for animations
// ============================================================
function setupAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.algo-card, .feature-card, .learn-card, .formula-card, .exam-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderAlgoCards();
  setupHeader();
  setupAnimations();

  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Canvas resize on window resize
  window.addEventListener('resize', () => {
    if (simResult && simParams) {
      const container = canvas.parentElement;
      canvas.width = container.offsetWidth || 700;
      drawDisk(simResult, simParams, animStep, animProgress);
    }
  });
});
