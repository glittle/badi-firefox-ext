/* Code by Glen Little */

function prepare() {
    chrome.alarms.clearAll();

    registerHandlers();

    chrome.alarms.onAlarm.addListener(refreshDateInfoAndShow);

    chrome.runtime.onInstalled.addListener(installed);
}

prepare();