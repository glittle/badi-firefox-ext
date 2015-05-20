/* global setStorage */
/* global di */
/* global chrome */

function prepare(){
  chrome.alarms.clearAll();
  localStorage.clear(); 

  registerHandlers();

  chrome.alarms.onAlarm.addListener(refreshDateInfoAndShow);
}

prepare();