/* Code by Glen Little */

var _backgroundReminderEngine = {};
var popupUrl = chrome.extension.getURL('popup.html');

var BackgroundModule = function() {

    var alarmHandler = function(alarmName) {
        console.log('ALARM RUNNING: ', alarmName);
        //     console.trace()
        // debugger;
        if (alarmName.startsWith('refresh_')) {
            refreshDateInfoAndShow(true);
            _backgroundReminderEngine.setAlarmsForRestOfToday();
        } else if (alarmName.startsWith('alarm_')) {
            _backgroundReminderEngine.triggerAlarmNow(alarmName);
        }
    };

    function installed(info) {
        console.log('installed', info)
        if (info.reason == 'update') {
            setTimeout(function() {
                var newVersion = chrome.runtime.getManifest().version;
                var oldVersion = localStorage.updateVersion;
                if (newVersion != oldVersion) {
                    console.log(oldVersion + ' --> ' + newVersion);
                    localStorage.updateVersion = newVersion;
                    chrome.tabs.create({
                        url: getMessage(browserHostType + '_History') + '?{0}:{1}'.filledWith(
                            chrome.runtime.getManifest().version,
                            _languageCode)
                    });

                    setStorage('firstPopup', true);

                    try {
                        tracker.sendEvent('updated', getVersionInfo());
                    } catch (e) {
                        console.log(e);
                    }
                } else {
                    console.log(newVersion);
                }
            }, 1000);
        } else {
            console.log(info);
        }
    }

    //  function messageHandler(request, sender, sendResponse) {
    //    //log(request, sender, sendResponse);
    //    console.log('message received: ' + request.code);
    //  }

    function showErrors() {
        var msg = chrome.runtime.lastError;
        if (msg) {
            console.log(msg);
        }
    }

    function makeTab() {
        chrome.tabs.create({
            url: popupUrl
        }, function(newTab) {
            setStorage('tabId', newTab.id);
        });
    }

    function prepare() {
        startGettingLocation();

        console.log('background, notifications:', _notificationsEnabled);

        if (_notificationsEnabled) {
            _backgroundReminderEngine = new BackgroundReminderEngine(alarmHandler);
        }

        // if (browserHostType === browserType.Chrome) {
        browser.alarms.clearAll();
        chrome.alarms.clearAll();
        // window.browser.alarms.onAlarm.addListener(alarmHandler);
        chrome.alarms.onAlarm.addListener(function() { console.log('LISTEN 1') });
        browser.alarms.onAlarm.addListener(function() { console.log('LISTEN 2') });
        chrome.runtime.onInstalled.addListener(installed);
        // }

        // if (browserHostType === browserType.Firefox) {
        //   chrome.browserAction.onClicked.addListener(function () {
        //     var oldTabId = +getStorage('tabId', 0);
        //     if (oldTabId) {
        //       chrome.tabs.update(oldTabId, {
        //         active: true
        //       }, function (updatedTab) {
        //         if (!updatedTab) {
        //           makeTab();
        //         }
        //         if (chrome.runtime.lastError) {
        //           console.log(chrome.runtime.lastError.message);
        //         }
        //       });
        //     } else {
        //       makeTab();
        //     }

        //   });
        // }

        chrome.contextMenus.create({
            'id': 'openInTab',
            'title': getMessage('browserMenuOpen'),
            'contexts': ['browser_action']
        }, showErrors);
        //chrome.contextMenus.create({
        //  'id': 'paste',
        //  'title': 'Insert Bad? Date',
        //  'contexts': ['editable']
        //}, showErrors);

        chrome.contextMenus.onClicked.addListener(function(info, tab) {
            switch (info.menuItemId) {
                //case 'paste':
                //  console.log(info, tab);
                //  chrome.tabs.executeScript(tab.id, {code: 'document.targetElement.value = "help"'}, showErrors);
                //  break;

                case 'openInTab':
                    var afterUpdate = function(updatedTab) {
                        if (!updatedTab) {
                            makeTab();
                        }
                        if (chrome.runtime.lastError) {
                            console.log(chrome.runtime.lastError.message);
                        }
                    };

                    switch (browserHostType) {
                        case browserType.Chrome:
                        case browserType.Firefox:
                            chrome.tabs.query({
                                url: popupUrl
                            }, function(foundTabs) {
                                switch (foundTabs.length) {
                                    case 1:
                                        // resuse
                                        chrome.tabs.update(foundTabs[0].id, {
                                            active: true
                                        }, afterUpdate);
                                        break;

                                    case 0:
                                        makeTab();
                                        break;

                                    default:
                                        // bug in March 2016 - all tabs returned!

                                        var oldTabId = +getStorage('tabId', 0);
                                        if (oldTabId) {
                                            chrome.tabs.update(oldTabId, {
                                                active: true
                                            }, afterUpdate);
                                        } else {
                                            makeTab();
                                        }
                                        break;
                                }

                                // if (tracker) {
                                //   // not working?...
                                //   tracker.sendEvent('openInTabContextMenu');
                                // }
                            });

                            break;

                        default:
                            makeTab();

                            // if (tracker) {
                            //   // not working?...
                            //   tracker.sendEvent('openInTabContextMenu');
                            // }
                            break;
                    }

                    break;
            }
        });

        console.log('prepared background');

        //if (browserHostType === browserType.Firefox) {
        //    makeTab();
        //}
    }

    return {
        prepare: prepare,
        makeTab: makeTab
    };
};

var _backgroundModule = new BackgroundModule();

$(function() {
    _backgroundModule.prepare();
});