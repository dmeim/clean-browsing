function createUiStore() {
  let editMode = $state(false);
  let settingsOpen = $state(false);
  let addWidgetOpen = $state(false);
  let widgetSettingsInstanceId = $state<string | null>(null);

  function toggleEditMode() {
    editMode = !editMode;
    if (!editMode) {
      addWidgetOpen = false;
      widgetSettingsInstanceId = null;
    }
  }

  function exitEditMode() {
    editMode = false;
    addWidgetOpen = false;
    widgetSettingsInstanceId = null;
  }

  function openWidgetSettings(instanceId: string) {
    widgetSettingsInstanceId = instanceId;
  }

  function closeWidgetSettings() {
    widgetSettingsInstanceId = null;
  }

  function openSettings() {
    settingsOpen = true;
  }

  function setSettingsOpen(next: boolean) {
    settingsOpen = next;
  }

  function openAddWidget() {
    addWidgetOpen = true;
  }

  function setAddWidgetOpen(next: boolean) {
    addWidgetOpen = next;
  }

  return {
    get editMode() {
      return editMode;
    },
    get settingsOpen() {
      return settingsOpen;
    },
    get addWidgetOpen() {
      return addWidgetOpen;
    },
    get widgetSettingsInstanceId() {
      return widgetSettingsInstanceId;
    },
    toggleEditMode,
    exitEditMode,
    openSettings,
    setSettingsOpen,
    openAddWidget,
    setAddWidgetOpen,
    openWidgetSettings,
    closeWidgetSettings,
  };
}

export const uiStore = createUiStore();
