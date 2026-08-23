// --- Referències als elements de l'HTML ---
const timeDisplay = document.getElementById('time');

// Botó combinat Start/Pause i botó de Reset (sempre visible, sota l'altre)
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');

// Els 3 botons de mode: Pomodoro, Short Break, Long Break
const optionButtons = document.querySelectorAll('#options button');

// Botons de #controls: night-mode, chart, settings (en aquest ordre)
const controlButtons = document.querySelectorAll('#controls button');
const nightModeBtn = document.getElementById('nightModeBtn');
const settingsBtn = controlButtons[2];

// Modal de Settings
const settingsModal = document.getElementById('settingsModal');
const pomodoroInput = document.getElementById('pomodoroInput');
const shortBreakInput = document.getElementById('shortBreakInput');
const longBreakInput = document.getElementById('longBreakInput');
const intervalInput = document.getElementById('intervalInput');
const saveSettingsBtn = document.getElementById('saveSettings');
const cancelSettingsBtn = document.getElementById('cancelSettings');

// --- Durada de cada mode, en segons (configurables des de Settings) ---
let DURATIONS = [25 * 60, 5 * 60, 15 * 60];
let LONG_BREAK_INTERVAL = 4; // cada quants pomodoros toca Long Break

// --- Estat del temporitzador ---
let currentModeIndex = 0;
let remainingSeconds = DURATIONS[currentModeIndex];
let timerInterval = null;
let isRunning = false;
let pomodorosCompleted = 0; // cada 4 pomodoros toca Long Break

// --- LocalStorage: recordar preferències entre sessions ---
const STORAGE_KEY = 'pomodoroSettings';

function saveStateToStorage() {
    const state = {
        DURATIONS,
        LONG_BREAK_INTERVAL,
        pomodorosCompleted,
        darkMode: document.body.classList.contains('dark-mode'),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadStateFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const state = JSON.parse(saved);
        if (Array.isArray(state.DURATIONS) && state.DURATIONS.length === 3) {
            DURATIONS = state.DURATIONS;
        }
        if (typeof state.LONG_BREAK_INTERVAL === 'number') {
            LONG_BREAK_INTERVAL = state.LONG_BREAK_INTERVAL;
        }
        if (typeof state.pomodorosCompleted === 'number') {
            pomodorosCompleted = state.pomodorosCompleted;
        }
        if (state.darkMode) {
            document.body.classList.add('dark-mode');
            nightModeBtn.classList.add('active');
        }
    } catch (err) {
        console.error('No s\'ha pogut llegir el localStorage:', err);
    }
}

// --- Funcions auxiliars ---
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateDisplay() {
    timeDisplay.textContent = formatTime(remainingSeconds);
}

function tick() {
    if (remainingSeconds > 0) {
        remainingSeconds--;
        updateDisplay();
    } else {
        clearInterval(timerInterval);
        isRunning = false;
        handleSessionEnd();
    }
}

// Decideix quin és el següent mode quan un compte arriba a 0
function handleSessionEnd() {
    if (currentModeIndex === 0) {
        // Acaba de passar un Pomodoro
        pomodorosCompleted++;
        saveStateToStorage();
        const nextMode = (pomodorosCompleted % LONG_BREAK_INTERVAL === 0) ? 2 : 1;
        switchMode(nextMode);
    } else {
        // Acaba de passar un descans (curt o llarg) -> tornem a Pomodoro
        switchMode(0);
    }
}

// --- Accions principals ---
function toggleStartPause() {
    if (isRunning) {
        // Pausa
        clearInterval(timerInterval);
        isRunning = false;
        startPauseBtn.innerHTML = '&#9654;';
    } else {
        // Arrenca o reprèn
        isRunning = true;
        timerInterval = setInterval(tick, 1000);
        startPauseBtn.innerHTML = '&#9208;';
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    remainingSeconds = DURATIONS[currentModeIndex];
    updateDisplay();
    startPauseBtn.innerHTML = '&#9654;';
}

function switchMode(index) {
    currentModeIndex = index;
    resetTimer();

    optionButtons.forEach((btn) => btn.classList.remove('active'));
    optionButtons[index].classList.add('active');
}

// --- Settings ---
function openSettings() {
    pomodoroInput.value = DURATIONS[0] / 60;
    shortBreakInput.value = DURATIONS[1] / 60;
    longBreakInput.value = DURATIONS[2] / 60;
    intervalInput.value = LONG_BREAK_INTERVAL;
    settingsModal.classList.remove('ocult');
}

function closeSettings() {
    settingsModal.classList.add('ocult');
}

function saveSettings() {
    const pomodoroMin = Math.max(1, parseInt(pomodoroInput.value) || 25);
    const shortMin = Math.max(1, parseInt(shortBreakInput.value) || 5);
    const longMin = Math.max(1, parseInt(longBreakInput.value) || 15);
    const interval = Math.max(1, parseInt(intervalInput.value) || 4);

    DURATIONS = [pomodoroMin * 60, shortMin * 60, longMin * 60];
    LONG_BREAK_INTERVAL = interval;
    saveStateToStorage();

    resetTimer(); // aplica la nova durada al mode actual
    closeSettings();
}

settingsBtn.addEventListener('click', openSettings);

// --- Mode Nit ---
nightModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    nightModeBtn.classList.toggle('active');
    saveStateToStorage();
});
saveSettingsBtn.addEventListener('click', saveSettings);
cancelSettingsBtn.addEventListener('click', closeSettings);

// --- Listeners ---
startPauseBtn.addEventListener('click', toggleStartPause);
resetBtn.addEventListener('click', resetTimer);

optionButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => switchMode(idx));
});

// --- Estat inicial ---
loadStateFromStorage();
remainingSeconds = DURATIONS[currentModeIndex];
updateDisplay();
optionButtons[currentModeIndex].classList.add('active');