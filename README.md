# DiskOS — Disk Scheduling Algorithm Visualizer

> An interactive educational website for visualizing disk scheduling algorithms.
> Built as a **2nd Year CSE Operating Systems Project**.

---

## 📁 Project Structure

```
Disk scheduling Algorithm OS/
├── index.html      → Main website (all sections)
├── style.css       → White theme styling
├── app.js          → Algorithm logic + canvas animation
├── hdd.jpg         → HDD illustration (hero section)
└── README.md       → This file
```

---

## 🚀 How to Run in VS Code

### ✅ Method 1 — Live Server Extension (Recommended)

1. Open **VS Code**
2. Open the project folder:
   - `File` → `Open Folder` → select `Disk scheduling Algorithm OS`
3. Install the **Live Server** extension:
   - Go to Extensions (`Ctrl + Shift + X`)
   - Search: `Live Server` by **Ritwick Dey**
   - Click **Install**
4. Right-click `index.html` in the Explorer panel
5. Select **"Open with Live Server"**
6. Browser opens automatically at:
   ```
   http://127.0.0.1:5500
   ```

> Live Server auto-refreshes whenever you save a file.

---

### ✅ Method 2 — Python HTTP Server (No extensions needed)

1. Open the **VS Code Terminal** (`Ctrl + backtick`)
2. Run:
   ```bash
   python -m http.server 3000
   ```
3. Open your browser and go to:
   ```
   http://localhost:3000
   ```

> Works if Python is installed. Check with: `python --version`

---

### ✅ Method 3 — Just Double-Click (Simplest)

1. Open the project folder in File Explorer
2. Double-click `index.html`
3. It opens directly in your default browser

---

## 🎯 Features

| Feature | Description |
|--------|-------------|
| 6 Algorithms | FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK |
| Animated Simulator | Canvas-based real-time head movement |
| Play / Pause / Step | Full animation controls |
| Speed Control | 1x to 5x animation speed |
| Compare All | Side-by-side seek distance bar chart |
| Learn Section | Concepts, Formulas, When to Use, Exam Tips |
| Input Validation | Clear error messages for invalid inputs |
| Responsive Design | Works on desktop, tablet, and mobile |

---

## 📐 Algorithms Implemented

| # | Algorithm | Full Name | Starvation |
|---|-----------|-----------|------------|
| 1 | FCFS | First Come First Serve | None |
| 2 | SSTF | Shortest Seek Time First | Possible |
| 3 | SCAN | Elevator Algorithm | None |
| 4 | C-SCAN | Circular SCAN | None |
| 5 | LOOK | LOOK Algorithm | None |
| 6 | C-LOOK | Circular LOOK | None |

---

## 🖱️ How to Use the Simulator

1. Enter a **disk request queue** (comma-separated cylinder numbers)
   - Default: `98, 183, 37, 122, 14, 124, 65, 67`
2. Set the **initial head position** (default: `53`)
3. Set **min/max cylinder** range (default: `0` to `199`)
4. Choose **initial direction** (Left or Right)
5. Select an **algorithm** from the dropdown
6. Click **Run Simulation** and watch the animation
7. Use **Play / Pause / Step** buttons to control playback
8. Click **Compare All** to see all algorithms ranked by seek distance

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause animation |
| Right Arrow | Step forward one move |
| Esc | Close algorithm detail modal |

---

## 🛠️ Tech Stack

- **HTML5** — Structure and semantic markup
- **CSS3** — White theme, animations, responsive grid
- **Vanilla JavaScript** — Algorithm logic, canvas rendering
- **HTML5 Canvas** — Real-time seek path animation
- **Google Fonts** — Inter + JetBrains Mono

No frameworks. No dependencies. No build step required.

---

## 📊 Example Output (FCFS)

```
Head Position : 53
Request Queue : 98, 183, 37, 122, 14, 124, 65, 67

Service Order : 53 → 98 → 183 → 37 → 122 → 14 → 124 → 65 → 67
Total Seek    : 640 cylinders
Average Seek  : 80.00 cylinders
```

---

## 👩‍💻 Project Info

- **Course:** Operating Systems Lab
- **Year:** 2nd Year B.Tech CSE
- **Type:** Interactive Educational Web Tool
- **Client-side only** — No server or database needed
