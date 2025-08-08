const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');

settingsButton.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
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
  background: { type: 'color', value: '#222' },
  lastColor: '#222'
};

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('settings')) || defaultSettings;
  } catch (e) {
    return defaultSettings;
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
if (!settings.lastColor) settings.lastColor = defaultSettings.lastColor;
applyBackground(settings);

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
      applyBackground(settings);
      updateBackgroundControls();
    } catch {
      alert('Invalid JSON file');
    }
  };
  reader.readAsText(file);
});

