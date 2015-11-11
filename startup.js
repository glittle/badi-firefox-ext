/* Code by Glen Little */

function prepare() {
  chrome.alarms.clearAll();
  registerHandlers();
  chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name.startsWith('refresh')) {
      refreshDateInfoAndShow();
    }
    else if (alarm.name.startsWith('reminder')) {
      //_reminderModule.doReminder(alarm.name);
    }
  });
  chrome.runtime.onInstalled.addListener(installed);
}

prepare();