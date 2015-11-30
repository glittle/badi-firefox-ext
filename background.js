/* Code by Glen Little */

var _isBackgroundPage = true;
var _reminderModule;

var BackgroundModule = function () {

  var alarmHandler = function (alarm) {
    if (alarm.name.startsWith('refresh')) {
      refreshDateInfoAndShow();
      _reminderModule.activateForToday();
    }
    else if (alarm.name.startsWith('reminder_')) {
      _reminderModule.triggerAlarmNow(alarm.name);
    }
  };

  function installed(info) {
    if (info.reason == 'update') {
      setTimeout(function () {
        var newVersion = chrome.runtime.getManifest().version_name;
        var oldVersion = localStorage.updateVersion;
        if (newVersion != oldVersion) {
          log(oldVersion + ' --> ' + newVersion);
          localStorage.updateVersion = newVersion;
          chrome.tabs.create({
            url: 'https://sites.google.com/site/badicalendartools/home/chrome-extension/history?'
              + '{0}:{1}'.filledWith(
              chrome.runtime.getManifest().version_name,
              _languageCode)
          });

          setStorage('firstPopup', true);

          try {
            tracker.sendEvent('updated', getVersionInfo());
          } catch (e) {
            log(e);
          }
        } else {
          log(newVersion);
        }
      }, 1000);
    } else {
      log(info);
    }
  }

  //  function messageHandler(request, sender, sendResponse) {
  //    //log(request, sender, sendResponse);
  //    log('message received: ' + request.code);
  //  }


  function prepare() {

    startGettingLocation();

    if (_remindersEnabled) {
      _reminderModule = new ReminderModule();
    }

    chrome.alarms.clearAll();
    chrome.alarms.onAlarm.addListener(alarmHandler);
    chrome.runtime.onInstalled.addListener(installed);

    log('prepared background');
  }

  return {
    prepare: prepare
  };
}

var _backgroundModule = new BackgroundModule();

$(function () {
  _backgroundModule.prepare();
});
