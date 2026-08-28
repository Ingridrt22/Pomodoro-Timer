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
const statsBtn = document.getElementById('statsBtn');
const settingsBtn = controlButtons[2];
const awardsBtn = document.getElementById('awardsBtn');

// Modal de Settings
const settingsModal = document.getElementById('settingsModal');
const pomodoroInput = document.getElementById('pomodoroInput');
const shortBreakInput = document.getElementById('shortBreakInput');
const longBreakInput = document.getElementById('longBreakInput');
const intervalInput = document.getElementById('intervalInput');
const saveSettingsBtn = document.getElementById('saveSettings');
const cancelSettingsBtn = document.getElementById('cancelSettings');

// Modal d'Estadístiques (gràfic + objectius)
const statsModal = document.getElementById('statsModal');
const statsPomodorosEl = document.getElementById('statsPomodoros');
const statsTotalTimeEl = document.getElementById('statsTotalTime');
const statsChart = document.getElementById('statsChart');
const goalInput = document.getElementById('goalInput');
const addGoalBtn = document.getElementById('addGoalBtn');
const goalsList = document.getElementById('goalsList');
const rewardNameInput = document.getElementById('rewardNameInput');
const rewardTargetInput = document.getElementById('rewardTargetInput');
const addRewardBtn = document.getElementById('addRewardBtn');
const closeStatsBtn = document.getElementById('closeStats');

// Modal de Premis
const awardsModal = document.getElementById('awardsModal');
const rewardsList = document.getElementById('rewardsList');
const closeAwardsBtn = document.getElementById('closeAwards');
const tabRewardsBtn = document.getElementById('tabRewardsBtn');
const tabCreateBtn = document.getElementById('tabCreateBtn');
const rewardsPanel = document.getElementById('rewardsPanel');
const createRewardPanel = document.getElementById('createRewardPanel');

// --- Durada de cada mode, en segons (configurables des de Settings) ---
let DURATIONS = [25 * 60, 5 * 60, 15 * 60];
let LONG_BREAK_INTERVAL = 4; // cada quants pomodoros toca Long Break

// --- Estat del temporitzador ---
let currentModeIndex = 0;
let remainingSeconds = DURATIONS[currentModeIndex];
let timerInterval = null;
let isRunning = false;
let pomodorosCompleted = 0; // cada 4 pomodoros toca Long Break

// --- Estadístiques d'estudi ---
let totalMinutesStudied = 0;
let dailyMinutes = {}; // { 'AAAA-MM-DD': minuts }
let goals = []; // [{ id, text, done }]
let customRewards = []; // [{ id, name, target, notified }] -- premis creats per l'usuari

// --- LocalStorage: recordar preferències entre sessions ---
const STORAGE_KEY = 'pomodoroSettings';

function saveStateToStorage() {
    const state = {
        DURATIONS,
        LONG_BREAK_INTERVAL,
        pomodorosCompleted,
        darkMode: document.body.classList.contains('dark-mode'),
        totalMinutesStudied,
        dailyMinutes,
        goals,
        customRewards,
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
        if (typeof state.totalMinutesStudied === 'number') {
            totalMinutesStudied = state.totalMinutesStudied;
        }
        if (state.dailyMinutes && typeof state.dailyMinutes === 'object') {
            dailyMinutes = state.dailyMinutes;
        }
        if (Array.isArray(state.goals)) {
            goals = state.goals;
        }
        if (Array.isArray(state.customRewards)) {
            customRewards = state.customRewards;
        }
        if (state.darkMode) {
            document.body.classList.add('dark-mode');
            nightModeBtn.classList.add('active');
        }
    } catch (err) {
        console.error('No s\'ha pogut llegir el localStorage:', err);
    }
}

// --- So i notificació quan s'acaba una sessió ---
function playBeep() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.6);
    } catch (err) {
        console.error('No s\'ha pogut reproduir el so:', err);
    }
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function notifySessionEnd(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', { body: message });
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
        playBeep();
        notifySessionEnd(
            currentModeIndex === 0
                ? 'Pomodoro acabat! Toca un descans.'
                : 'Descans acabat! Toca tornar a la feina.'
        );
        handleSessionEnd();
    }
}

// Decideix quin és el següent mode quan un compte arriba a 0
function handleSessionEnd() {
    if (currentModeIndex === 0) {
        // Acaba de passar un Pomodoro
        pomodorosCompleted++;

        const minutesEarned = DURATIONS[0] / 60;
        totalMinutesStudied += minutesEarned;
        const today = new Date().toISOString().slice(0, 10);
        dailyMinutes[today] = (dailyMinutes[today] || 0) + minutesEarned;

        saveStateToStorage();
        checkRewardsUnlocked();
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
        requestNotificationPermission();
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

// --- Estadístiques: gràfic dels últims 7 dies ---
function renderChart() {
    statsChart.innerHTML = '';

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }

    const values = days.map((day) => dailyMinutes[day] || 0);
    const maxValue = Math.max(...values, 1);

    days.forEach((day, idx) => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'chartDay';

        const bar = document.createElement('div');
        bar.className = 'chartBar';
        bar.style.height = `${(values[idx] / maxValue) * 100}%`;
        bar.title = `${values[idx]} min`;

        const label = document.createElement('span');
        label.className = 'chartDayLabel';
        label.textContent = new Date(day + 'T00:00:00').toLocaleDateString('ca-ES', { weekday: 'short' }).slice(0, 2);

        dayDiv.appendChild(bar);
        dayDiv.appendChild(label);
        statsChart.appendChild(dayDiv);
    });
}

// --- Estadístiques: objectius ---
function renderGoals() {
    goalsList.innerHTML = '';

    goals.forEach((goal) => {
        const li = document.createElement('li');
        li.className = 'goalItem' + (goal.done ? ' done' : '');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = goal.done;
        checkbox.addEventListener('change', () => toggleGoal(goal.id));

        const span = document.createElement('span');
        span.textContent = goal.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'deleteGoal';
        deleteBtn.innerHTML = '&#10005;';
        deleteBtn.addEventListener('click', () => deleteGoal(goal.id));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        goalsList.appendChild(li);
    });
}

function addGoal() {
    const text = goalInput.value.trim();
    if (!text) return;

    goals.push({ id: Date.now().toString(), text, done: false });
    goalInput.value = '';
    saveStateToStorage();
    renderGoals();
}

function toggleGoal(id) {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    goal.done = !goal.done;
    saveStateToStorage();
    renderGoals();
}

function deleteGoal(id) {
    goals = goals.filter((g) => g.id !== id);
    saveStateToStorage();
    renderGoals();
}

function openStats() {
    statsPomodorosEl.textContent = pomodorosCompleted;
    const hours = Math.floor(totalMinutesStudied / 60);
    const mins = Math.round(totalMinutesStudied % 60);
    statsTotalTimeEl.textContent = `${hours}h ${mins}m`;
    renderChart();
    renderGoals();
    statsModal.classList.remove('ocult');
}

function closeStats() {
    statsModal.classList.add('ocult');
}

statsBtn.addEventListener('click', openStats);
closeStatsBtn.addEventListener('click', closeStats);
addGoalBtn.addEventListener('click', addGoal);
goalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addGoal();
});

// --- Premis personalitzats ---
function addReward() {
    const name = rewardNameInput.value.trim();
    const target = parseInt(rewardTargetInput.value);
    if (!name || !target || target < 1) return;

    customRewards.push({ id: Date.now().toString(), name, target, notified: false });
    rewardNameInput.value = '';
    rewardTargetInput.value = '';
    saveStateToStorage();
    renderRewards();
    showRewardsTab();
}

function deleteReward(id) {
    customRewards = customRewards.filter((r) => r.id !== id);
    saveStateToStorage();
    renderRewards();
}

// Comprova si algun premi acaba d'assolir-se i llança la notificació
function checkRewardsUnlocked() {
    let changed = false;
    customRewards.forEach((reward) => {
        if (!reward.notified && pomodorosCompleted >= reward.target) {
            reward.notified = true;
            changed = true;
            playBeep();
            notifySessionEnd(`🎉 Has aconseguit el premi: ${reward.name}!`);
        }
    });
    if (changed) saveStateToStorage();
}

function renderRewards() {
    rewardsList.innerHTML = '';

    if (customRewards.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'Encara no has creat cap premi. Prem "+ Crear premi".';
        rewardsList.appendChild(empty);
        return;
    }

    customRewards.forEach((reward) => {
        const achieved = pomodorosCompleted >= reward.target;
        const percent = Math.min(100, Math.round((pomodorosCompleted / reward.target) * 100));

        const li = document.createElement('li');
        li.className = 'rewardItem' + (achieved ? ' achieved' : '');

        const header = document.createElement('div');
        header.className = 'rewardItem-header';

        const name = document.createElement('span');
        name.className = 'rewardItem-name';
        name.textContent = (achieved ? '🎁 ' : '') + reward.name;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'deleteReward';
        deleteBtn.innerHTML = '&#10005;';
        deleteBtn.addEventListener('click', () => deleteReward(reward.id));

        header.appendChild(name);
        header.appendChild(deleteBtn);

        const track = document.createElement('div');
        track.className = 'rewardProgressTrack';
        const fill = document.createElement('div');
        fill.className = 'rewardProgressFill';
        fill.style.width = `${percent}%`;
        track.appendChild(fill);

        const label = document.createElement('div');
        label.className = 'rewardProgressLabel';
        label.textContent = `${Math.min(pomodorosCompleted, reward.target)}/${reward.target} pomodors · ${percent}%`;

        li.appendChild(header);
        li.appendChild(track);
        li.appendChild(label);
        rewardsList.appendChild(li);
    });
}

function showRewardsTab() {
    tabRewardsBtn.classList.add('active');
    tabCreateBtn.classList.remove('active');
    rewardsPanel.classList.remove('ocult');
    createRewardPanel.classList.add('ocult');
}

function showCreateTab() {
    tabCreateBtn.classList.add('active');
    tabRewardsBtn.classList.remove('active');
    createRewardPanel.classList.remove('ocult');
    rewardsPanel.classList.add('ocult');
}

function openAwards() {
    renderRewards();
    showRewardsTab();
    awardsModal.classList.remove('ocult');
}

function closeAwards() {
    awardsModal.classList.add('ocult');
}

tabRewardsBtn.addEventListener('click', showRewardsTab);
tabCreateBtn.addEventListener('click', showCreateTab);

addRewardBtn.addEventListener('click', addReward);
rewardNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addReward();
});
rewardTargetInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addReward();
});

awardsBtn.addEventListener('click', openAwards);
closeAwardsBtn.addEventListener('click', closeAwards);

// Tancar qualsevol modal clicant fora del contingut, o amb Escape
const allModals = [settingsModal, statsModal, awardsModal];

allModals.forEach((modal) => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('ocult');
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        allModals.forEach((modal) => modal.classList.add('ocult'));
    }
});

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