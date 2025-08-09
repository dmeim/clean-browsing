// Calculator Widget - Built from scratch
registerWidget('calculator', {
  name: 'Calculator',
  render: renderCalculatorWidget,
  openConfig: openCalculatorConfig
});

function renderCalculatorWidget(widget, index) {
  const container = createWidgetContainer(widget, index, 'calculator-widget');
  
  // Color classes based on settings
  const operatorColor = widget.settings.colorOperators !== false ? ' colored' : '';
  const equalsColor = widget.settings.colorEquals !== false ? ' colored' : '';
  const clearColor = widget.settings.colorClear !== false ? ' colored' : '';
  
  // Button style class
  const buttonStyle = widget.settings.roundButtons !== false ? ' round-buttons' : ' rounded-buttons';
  container.classList.add(buttonStyle.trim());
  
  // Layout class
  if (widget.settings.horizontalLayout) {
    container.classList.add('horizontal-layout');
  }
  
  container.innerHTML = `
    <div class="calc-display">
      <div class="calc-text">${widget.settings.display || '0'}</div>
    </div>
    <div class="calc-buttons">
      <button class="calc-btn calc-clear${clearColor}" data-key="clear">C</button>
      <button class="calc-btn calc-backspace${clearColor}" data-key="backspace">⌫</button>
      <button class="calc-btn calc-operator${operatorColor}" data-key="/">/</button>
      <button class="calc-btn calc-operator${operatorColor}" data-key="*">×</button>
      
      <button class="calc-btn calc-number" data-key="7">7</button>
      <button class="calc-btn calc-number" data-key="8">8</button>
      <button class="calc-btn calc-number" data-key="9">9</button>
      <button class="calc-btn calc-operator${operatorColor}" data-key="-">-</button>
      
      <button class="calc-btn calc-number" data-key="4">4</button>
      <button class="calc-btn calc-number" data-key="5">5</button>
      <button class="calc-btn calc-number" data-key="6">6</button>
      <button class="calc-btn calc-operator${operatorColor}" data-key="+">+</button>
      
      <button class="calc-btn calc-number" data-key="1">1</button>
      <button class="calc-btn calc-number" data-key="2">2</button>
      <button class="calc-btn calc-number" data-key="3">3</button>
      <button class="calc-btn calc-equals${equalsColor}" data-key="=">=</button>
      
      <button class="calc-btn calc-number calc-zero" data-key="0">0</button>
      <button class="calc-btn calc-number" data-key=".">.</button>
    </div>
  `;
  
  setupCalculatorLogic(container, widget, index);
  setupJiggleModeControls(container, widget, index);
  applyWidgetAppearance(container, widget);
  
  widgetGrid.appendChild(container);
}

function setupCalculatorLogic(container, widget, index) {
  const display = container.querySelector('.calc-text');
  const buttons = container.querySelectorAll('.calc-btn');
  
  let currentInput = widget.settings.display || '0';
  let operator = null;
  let previousValue = null;
  let waitingForInput = false;
  
  const updateDisplay = (value) => {
    currentInput = String(value);
    display.textContent = currentInput;
    widget.settings.display = currentInput;
    saveSettings(settings);
  };
  
  const calculate = (prev, current, op) => {
    const prevNum = parseFloat(prev);
    const currentNum = parseFloat(current);
    
    switch(op) {
      case '+': return prevNum + currentNum;
      case '-': return prevNum - currentNum;
      case '*': return prevNum * currentNum;
      case '/': return currentNum !== 0 ? prevNum / currentNum : 0;
      default: return currentNum;
    }
  };
  
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.key;
      
      if (button.classList.contains('calc-number')) {
        if (waitingForInput || currentInput === '0') {
          if (key === '.' && currentInput === '0') {
            currentInput = '0.';
          } else {
            currentInput = key;
          }
          waitingForInput = false;
        } else {
          if (key === '.' && currentInput.includes('.')) {
            return; // Don't add multiple decimal points
          }
          currentInput += key;
        }
        updateDisplay(currentInput);
        
      } else if (button.classList.contains('calc-operator')) {
        if (previousValue !== null && !waitingForInput) {
          const result = calculate(previousValue, currentInput, operator);
          updateDisplay(result);
          currentInput = String(result);
        }
        
        previousValue = currentInput;
        operator = key;
        waitingForInput = true;
        
      } else if (button.classList.contains('calc-equals')) {
        if (previousValue !== null && operator !== null) {
          const result = calculate(previousValue, currentInput, operator);
          updateDisplay(result);
          previousValue = null;
          operator = null;
          waitingForInput = true;
        }
        
      } else if (button.classList.contains('calc-clear')) {
        currentInput = '0';
        previousValue = null;
        operator = null;
        waitingForInput = false;
        updateDisplay(currentInput);
        
      } else if (button.classList.contains('calc-backspace')) {
        if (currentInput.length > 1) {
          currentInput = currentInput.slice(0, -1);
        } else {
          currentInput = '0';
        }
        updateDisplay(currentInput);
      }
    });
  });
  
  // Keyboard support
  if (widget.settings.keyboardSupport !== false) {
    container.addEventListener('keydown', (e) => {
      const key = e.key;
      let targetButton = null;
      
      if ('0123456789.'.includes(key)) {
        targetButton = container.querySelector(`[data-key="${key}"]`);
      } else if ('+-*/'.includes(key)) {
        targetButton = container.querySelector(`[data-key="${key}"]`);
      } else if (key === 'Enter' || key === '=') {
        targetButton = container.querySelector('[data-key="="]');
      } else if (key === 'Escape') {
        targetButton = container.querySelector('[data-key="clear"]');
      } else if (key === 'Backspace') {
        targetButton = container.querySelector('[data-key="backspace"]');
      }
      
      if (targetButton) {
        e.preventDefault();
        targetButton.click();
      }
    });
    
    container.setAttribute('tabindex', '0');
  }
}

function openCalculatorConfig(widget = null, index = null) {
  const isEdit = widget !== null;
  const targetContainer = isEdit ? document.getElementById('widget-settings-tab') : widgetList;
  const settings = widget ? widget.settings : {
    keyboardSupport: true,
    colorOperators: true,
    colorEquals: true,
    colorClear: true,
    roundButtons: true,
    display: '0'
  };
  
  const configHtml = `
    <h3>${isEdit ? 'Edit Calculator Widget' : 'Calculator Widget'}</h3>
    <div class="input-group checkbox-group">
      <label><input type="checkbox" id="calc-keyboard" ${settings.keyboardSupport ? 'checked' : ''}> Enable keyboard support</label>
    </div>
    <div class="input-group checkbox-group">
      <label><input type="checkbox" id="calc-horizontal-layout" ${settings.horizontalLayout ? 'checked' : ''}> Horizontal layout (display on top, buttons in 6x3 grid)</label>
    </div>
    <div class="input-group checkbox-group">
      <label><input type="checkbox" id="calc-round-buttons" ${settings.roundButtons !== false ? 'checked' : ''}> Round buttons (unchecked = rounded rectangle)</label>
    </div>
    <div class="input-group checkbox-group">
      <label><input type="checkbox" id="calc-color-operators" ${settings.colorOperators !== false ? 'checked' : ''}> Color operator buttons</label>
    </div>
    <div class="input-group checkbox-group">
      <label><input type="checkbox" id="calc-color-equals" ${settings.colorEquals !== false ? 'checked' : ''}> Color equals button</label>
    </div>
    <div class="input-group checkbox-group">
      <label><input type="checkbox" id="calc-color-clear" ${settings.colorClear !== false ? 'checked' : ''}> Color clear/backspace buttons</label>
    </div>
    <div class="widget-config-buttons">
      <button id="calculator-save">${isEdit ? 'Save' : 'Add'}</button>
      <button id="calculator-cancel">${isEdit ? 'Exit' : 'Cancel'}</button>
    </div>
  `;
  
  targetContainer.innerHTML = configHtml;
  
  setupWidgetConfigButtons(isEdit, 'calculator', index, addCalculatorWidget, () => {
    return {
      keyboardSupport: document.getElementById('calc-keyboard').checked,
      horizontalLayout: document.getElementById('calc-horizontal-layout').checked,
      roundButtons: document.getElementById('calc-round-buttons').checked,
      colorOperators: document.getElementById('calc-color-operators').checked,
      colorEquals: document.getElementById('calc-color-equals').checked,
      colorClear: document.getElementById('calc-color-clear').checked,
      display: '0'
    };
  });
}

function addCalculatorWidget(options) {
  const newWidget = {
    type: 'calculator',
    x: 0,
    y: 0,
    w: 4,
    h: 6,
    settings: options
  };
  
  settings.widgets.push(newWidget);
  saveAndRender();
}