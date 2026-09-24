# 🍅 Pomodoro Timer

> 🚧 **Status: work in progress.** This project is still being built — some features and options described below are not fully finished yet, and more are planned.

A Pomodoro timer web app built with plain HTML, CSS and JavaScript (no frameworks or dependencies), with study statistics, goals and a customizable reward system.

## ✨ Features

- **Pomodoro timer** with 3 modes: Pomodoro, Short Break and Long Break
- **Automatic mode switching**: when a Pomodoro ends, it automatically moves to a break (short or long, depending on the configured interval)
- **Customizable settings** (⚙️ Settings): duration of each mode and how often a long break happens
- **Sound and browser notifications** when each session ends
- **Night mode** 🌙 in grayscale
- **Statistics** 📊: total study time, completed pomodoros, and a chart of the last 7 days
- **Goals**: a personal checklist of goals/objectives
- **Customizable rewards** 🏆: create your own rewards (e.g. "Funko Pop = 50 pomodoros") and track progress with a bar that fills up to 100%, with a notification when you reach it
- **Persistence**: everything is saved in the browser's `localStorage` (settings, stats, goals and rewards)

## 📂 Project structure

```
├── index.html   # Page structure
├── style.css    # Styles (pink/yellow theme + night mode)
├── script.js    # All the timer logic and features
└── img/         # Menu icons (spotify, calendar, awards...)
```

## 🚀 Usage

### Locally
Open `index.html` directly in your browser (double-click), or serve the folder with a local server (recommended — for example VS Code's *Live Server* extension) so browser notifications work correctly.

### Online
This project can be deployed for free on [GitHub Pages](https://pages.github.com/) or [Vercel](https://vercel.com/) by uploading the 3 files (`index.html`, `style.css`, `script.js`) and the `img/` folder.

## 🛠️ Tech stack

- HTML5
- CSS3 (Flexbox, Grid, color variables, `prefers-color-scheme`)
- JavaScript (ES6+), no external libraries
- `localStorage` for data persistence
- Web Audio API (notification sound) and Notification API (browser alerts)

## 🔜 Missing / planned

- Countdown isn't saved mid-session — if you close the tab while running, it resets to the full time on reload
- More polish planned for settings validation and overall styling consistency

## 📝 Notes

- The project needs no backend server or database: everything runs in the browser.
