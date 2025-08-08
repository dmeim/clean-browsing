const settingsButton = document.getElementById('settings-button');
const settingsPanel = document.getElementById('settings-panel');

settingsButton.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

const defaultSettings = {
  background: { type: 'color', value: '#222' }
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
applyBackground(settings);

// background controls
const colorPicker = document.getElementById('bg-color-picker');
const imagePicker = document.getElementById('bg-image-picker');

if (settings.background.type === 'color') {
  colorPicker.value = settings.background.value;
}

colorPicker.addEventListener('input', (e) => {
  settings.background = { type: 'color', value: e.target.value };
  applyBackground(settings);
  saveSettings(settings);
});

imagePicker.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    settings.background = { type: 'image', value: reader.result };
    applyBackground(settings);
    saveSettings(settings);
  };
  reader.readAsDataURL(file);
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
    } catch {
      alert('Invalid JSON file');
    }
  };
  reader.readAsText(file);
});

