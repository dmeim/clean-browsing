const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');
const closeSettingsButton = document.getElementById('close-settings');
const widgetGrid = document.getElementById('widget-grid');

settingsPanel.classList.add('hidden');

settingsButton.addEventListener('click', () => {
  settingsButton.classList.add('hidden');
  settingsPanel.classList.remove('hidden');
});

closeSettingsButton.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsPanel.classList.add('hidden');
  settingsButton.classList.remove('hidden');
});

// tab handling
const tabButtons = document.querySelectorAll('.settings-tabs button');
const tabContents = document.querySelectorAll('.tab-content');
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(`${btn.dataset.tab}-tab`).classList.remove('hidden');
  });
});

const defaultSettings = {
  background: { type: 'color', value: '#222222' },
  lastColor: '#222222',
  grid: { columns: 4, rows: 4 },
  widgets: [
    {
      type: 'clock',
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      settings: {
        showSeconds: true,
        flashing: false,
        locale: 'auto',
        use24h: false,
        daylightSavings: true
      }
    }
  ]
};

function normalizeColor(color) {
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  return color;
}

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('settings')) || { ...defaultSettings };
    if (s.background && s.background.type === 'color') {
      s.background.value = normalizeColor(s.background.value);
    }
    s.lastColor = normalizeColor(s.lastColor || defaultSettings.lastColor);
    s.widgets = (s.widgets || defaultSettings.widgets).map(w => ({
      ...w,
      x: w.x || 0,
      y: w.y || 0,
      w: w.w || 1,
      h: w.h || 1,
    }));
    s.grid = s.grid || { ...defaultSettings.grid };
    return s;
  } catch (e) {
    return { ...defaultSettings };
  }
}

function saveSettings(s) {
  localStorage.setItem('settings', JSON.stringify(s));
}

function applyBackground(s) {
  if (s.background.type === 'color') {
    document.body.style.background = s.background.value;
  } else if (s.background.type === 'image') {
    document.body.style.background = `url(${s.background.value}) center/cover no-repeat`;
  }
}

let settings = loadSettings();
applyBackground(settings);

function applyGridSettings() {
  widgetGrid.style.setProperty('--cols', settings.grid.columns);
  widgetGrid.style.setProperty('--rows', settings.grid.rows);
  widgetGrid.style.gridTemplateColumns = `repeat(${settings.grid.columns}, 1fr)`;
  widgetGrid.style.gridTemplateRows = `repeat(${settings.grid.rows}, minmax(100px, 1fr))`;
}

applyGridSettings();

function updateBackgroundControls() {
  if (settings.background.type === 'image') {
    colorPicker.value = settings.lastColor || defaultSettings.lastColor;
    removeImageBtn.classList.remove('hidden');
  } else {
    colorPicker.value = settings.background.value;
    removeImageBtn.classList.add('hidden');
  }
}

// background controls
const colorPicker = document.getElementById('bg-color-picker');
const imagePicker = document.getElementById('bg-image-picker');
const removeImageBtn = document.getElementById('remove-bg-image');

updateBackgroundControls();

colorPicker.addEventListener('input', (e) => {
  settings.background = { type: 'color', value: e.target.value };
  settings.lastColor = e.target.value;
  applyBackground(settings);
  saveSettings(settings);
  updateBackgroundControls();
});

imagePicker.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    settings.background = { type: 'image', value: reader.result };
    applyBackground(settings);
    saveSettings(settings);
    updateBackgroundControls();
  };
  reader.readAsDataURL(file);
});

removeImageBtn.addEventListener('click', () => {
  settings.background = { type: 'color', value: settings.lastColor || defaultSettings.lastColor };
  applyBackground(settings);
  saveSettings(settings);
  imagePicker.value = '';
  updateBackgroundControls();
});

// layout controls
const gridColumnsInput = document.getElementById('grid-columns');
const gridRowsInput = document.getElementById('grid-rows');

gridColumnsInput.value = settings.grid.columns;
gridRowsInput.value = settings.grid.rows;

gridColumnsInput.addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  settings.grid.columns = val > 0 ? val : 1;
  applyGridSettings();
  saveSettings(settings);
  if (typeof renderWidgets === 'function') renderWidgets();
});

gridRowsInput.addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  settings.grid.rows = val > 0 ? val : 1;
  applyGridSettings();
  saveSettings(settings);
  if (typeof renderWidgets === 'function') renderWidgets();
});

// export / import
const exportBtn = document.getElementById('export-btn');
const exportType = document.getElementById('export-type');
const importBtn = document.getElementById('import-btn');
const importType = document.getElementById('import-type');
const importFile = document.getElementById('import-file');

exportBtn.addEventListener('click', () => {
  const data = JSON.stringify(settings);
  if (exportType.value === 'text') {
    prompt('Copy your settings JSON:', data);
  } else {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }
});

importBtn.addEventListener('click', () => {
  if (importType.value === 'text') {
    const data = prompt('Paste settings JSON:');
    if (!data) return;
    try {
      settings = JSON.parse(data);
      saveSettings(settings);
      settings = loadSettings();
      applyBackground(settings);
      updateBackgroundControls();
    } catch {
      alert('Invalid JSON');
    }
  } else {
    importFile.click();
  }
});

importFile.addEventListener('change', () => {
  const file = importFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      settings = JSON.parse(reader.result);
      saveSettings(settings);
      settings = loadSettings();
      applyBackground(settings);
      updateBackgroundControls();
    } catch {
      alert('Invalid JSON file');
    }
  };
  reader.readAsText(file);
});

