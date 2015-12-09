/* Code by Glen Little */

var _isBackgroundPage = true;
var _reminderModule;

var BackgroundModule = function () {

  var alarmHandler = function (alarm) {
    log('ALARM: ' + alarm.name);
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

  function showErrors() {
    var msg = chrome.runtime.lastError;
    if (msg) {
      log(msg);
    }
  }
  function prepare() {

    startGettingLocation();

    if (_remindersEnabled) {
      _reminderModule = new ReminderModule();
    }

    chrome.alarms.clearAll();
    chrome.alarms.onAlarm.addListener(alarmHandler);
    chrome.runtime.onInstalled.addListener(installed);

    chrome.contextMenus.create({
      'id': 'openInTab',
      'title': getMessage('browserMenuOpen'),
      'contexts': ['browser_action']
    }, showErrors);
    //chrome.contextMenus.create({
    //  'id': 'paste',
    //  'title': 'Insert Badí Date',
    //  'contexts': ['editable']
    //}, showErrors);

    chrome.contextMenus.onClicked.addListener(function (info, tab) {
      switch (info.menuItemId) {
        //case 'paste':
        //  log(info, tab);
        //  chrome.tabs.executeScript(tab.id, {code: 'document.targetElement.value = "help"'}, showErrors);
        //  break;

        case 'openInTab':
          var url = chrome.extension.getURL('popup.html');
          chrome.tabs.query({ url: url }, function (foundTabs) {
            if (foundTabs[0]) {
              chrome.tabs.update(foundTabs[0].id, {
                active: true
              });
            } else {
              chrome.tabs.create({ url: url });
            }
            if (tracker) {
              // not working...
              tracker.sendEvent('openInTabContextMenu');
            }
          });

          break;
      }
    });

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
