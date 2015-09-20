/* Code by Glen Little */
/* global setStorage */
/* global di */
/* global chrome */

//function installed(info) {
//    if (info.reason == 'update') {
//        alert('Updated!');
//    };
//}

function prepare() {
    chrome.alarms.clearAll();
    // localStorage.clear(); 

    registerHandlers();

    chrome.alarms.onAlarm.addListener(refreshDateInfoAndShow);

    // chrome.runtime.onInstalled.addListener(installed);
}

prepare();