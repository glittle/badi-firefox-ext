var _remindersEnabled = false;

//"options_ui": {
//  "page": "options.html",
//  "chrome_style":  true
//},

//chrome.notifications.getPermissionLevel(function (level) {
//  // ensure flag is off if user has disabled them
//  if (level !== 'granted') {
//    _remindersEnabled = false;
//  }
//});


var ReminderModule = function () {

  var _reminderInfoShown = null;
  var _storedAlarms = {};
  var _reminders = [];

  function loadSamples() {
    _reminders = [
      {
        trigger: 'sunset',
        before: 10,
        units: 'minutes',
        title: 'Sunset in 10 minutes'
      },
      {
        trigger: 'noon',
        before: 10 + (40 / 60),
        units: 'hours',
        title: 'Reminder'
      },
      {
        trigger: 'now',
        before: -3, // negative is after
        units: 'seconds',
        title: 'Yeah!',
        message: 'Reminders are active...'
      },
      {
        trigger: 'feast',
        before: 1.5, // days
        alertTime: '2350',
        title: 'Feast soon!'
      },
      {
        trigger: 'holyday',
        before: 2, // days
        alertTime: '0300',
        title: 'Holy Day soon!'
      }
    ];
  }

  var adjustTime = function (d, reminder) {
    var ms = 0;
    switch (reminder.units) {
      case 'seconds':
        ms = reminder.before * 1000;
        break;

      case 'minutes':
        ms = reminder.before * 1000 * 60;
        break;

      case 'hours':
        ms = reminder.before * 1000 * 60 * 60;
        break;

      case 'days':
        ms = reminder.before * 1000 * 60 * 60 * 24;
        break;
    }

    d.setTime(d.getTime() - ms);
  }

  var storeAlarmReminder = function (reminder) {
    // store, and give back key to get it later
    for (var nextKey = 0; ; nextKey++) {
      if (!_storedAlarms[nextKey]) {
        _storedAlarms[nextKey] = reminder;
        return nextKey;
      }
    }
  }

  var addAlarm = function (eventTime, reminderTemplate) {
    var alarmInfo = {};
    // copy to new object
    for (var key in reminderTemplate) {
      if (reminderTemplate.hasOwnProperty(key)) {
        alarmInfo[key] = reminderTemplate[key];
      }
    }
    alarmInfo.eventTime = eventTime.getTime();
    var triggerTime = new Date(alarmInfo.eventTime);
    adjustTime(triggerTime, alarmInfo);

    // only activate if it will go off between now and next midnight
    var now = new Date();
    if (now.format('YYYY-M-DD') == triggerTime.format('YYYY-M-DD') && triggerTime > now) {
      alarmInfo.triggerTime = triggerTime.getTime();
      chrome.alarms.create('reminder_' + storeAlarmReminder(alarmInfo), { when: alarmInfo.triggerTime });
    }
  }

  var addAlarmFor = {
    'now': function (reminder) {
      console.log('add now');
      var eventTime = new Date();
      addAlarm(eventTime, reminder);
    },
    'sunset': function (reminder) {
      console.log('add sunset');
      var eventTime = _di.frag2SunTimes.sunset;
      addAlarm(eventTime, reminder);
    },
    'sunrise': function (reminder) {
      console.log('add sunrise');
      var eventTime = _di.frag2SunTimes.sunrise;
      addAlarm(eventTime, reminder);
    },
    'noon': function (reminder) {
      console.log('add noon');
      var eventTime = _di.frag2;
      addAlarm(eventTime, reminder);
    },
    'feast': function (reminder) {
      console.log('add feast (delta from noon/sunset) - to do');
      var events = getEvents('M', reminder.before);
    },
    'holyday': function (reminder) {
      console.log('add holyday (delta from noon/sunset) - to do');
    },
    'dayOfWeek': function (reminder) {
      console.log('add day of week (delta from noon/sunset) - to do');
    },
    'dayOfBMonth': function (reminder) {
      console.log('add day of Badi month (delta from noon/sunset) - to do');
    },
    'dayOfGMonth': function (reminder) {
      console.log('add day of Gregorian month (delta from noon) - to do');
    }
  };

  function getEvents() {
    var testNoon = new Date();
    testNoon.setHours(12, 0, 0, 0);


    if (!_specialDays[tomorrowDayInfo.bYear]) {
      _specialDays[tomorrowDayInfo.bYear] = holyDays.prepareDateInfos(tomorrowDayInfo.bYear);
    }

    var holyDayInfo = $.grep(_specialDays[thisDayInfo.bYear], function (el, i) {
      return !outside && el.Type.substring(0, 1) == 'H' && el.BDateCode == thisDayInfo.bDateCode;
    });
  }

  function doReminder(alarmName) {
    if (!alarmName.startsWith('reminder_')) {
      console.log('unexpected reminder alarm: ' + alarmName);
      return;
    }

    var id = +alarmName.split('_')[1];
    var alarmInfo = _storedAlarms[id];
    if (!alarmInfo) {
      console.log('no info for ' + alarmName);
      return;
    }

    console.log(alarmInfo);

    var notificationId = alarmInfo.trigger + alarmInfo.eventTime; // unique id; if used again, will replace
    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'badi19a-128.png',
      title: alarmInfo.title || 'Reminder',
      message: alarmInfo.message,
      priority: 0,
      eventTime: alarmInfo.eventTime
    });
  }

  function activateForToday() {
        activateAlarms();
  }

  function activateAlarms() {
    if (!_remindersEnabled) return;

    for (var i = 0; i < _reminders.length; i++) {
      var reminder = _reminders[i];
      addAlarmFor[reminder.trigger](reminder);
    }

    chrome.storage.sync.set({
      reminders: _reminders
    }, function () {
      console.log(chrome.runtime.lastError);
    });
  }

  function addReminder() {

  }

  //function showPage() {
  //  // may be called twice... only show if changed
  //  //if (_reminders == _reminderInfoShown) {
  //  //  return;
  //  //}

  //  //_reminderInfoShown = _reminders;

  //  var page = $('#pageReminders');
  //  var listing = page.find('.reminders');
  //  listing.html('<div>{trigger}... {before} {units}</div>'.filledWithEach(_reminders));

  //  var alarmList = page.find('.alarms');
  //  alarmList.html('');

  //  chrome.alarms.getAll(function (alarms) {
  //    for (var i = 0; i < alarms.length; i++) {
  //      var alarm = alarms[i];
  //      alarmList.append('<div>{0} {1}</div>'.filledWith(alarm.name, new Date(alarm.scheduledTime)));
  //    }
  //  });

  //}

  function loadReminders() {
    console.log('loading');
    chrome.storage.sync.get({
      reminders: []
    }, function (items) {
      console.log('loaded');
      if (items.reminders) {
        console.log('loaded from storage');
        _reminders = items.reminders;
      }
      if (!items.reminders || !items.reminders.length) {
        console.log('loading samples');
        loadSamples();
      }
    });
  }

  if (_remindersEnabled) {
    loadReminders();
  }

  return {
    activateForToday: activateForToday,
    doReminder: doReminder,
    _loadSamples: loadSamples,
    _storedAlarms: _storedAlarms
  }
}

// var _reminderModule = new ReminderModule();