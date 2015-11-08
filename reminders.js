var Reminders = function () {
  // at midnight or startup, set alarms for this day

  var _reminderInfoShown = null;
  var _storedAlarms = {};
  var _reminders = [];

  function loadSamples() {
    _reminders = [
      {
        trigger: 'sunset',
        before: 10,
        units: 'minutes',
        message: 'Hi there'
      },
      {
        trigger: 'feast',
        before: 1.5,
        units: 'days',
        message: 'Feast soon!'
      },
      {
        trigger: 'noon',
        before: 10 + (40 / 60),
        units: 'hours',
        message: 'Noon is a ways away'
      },
      {
        trigger: 'now',
        before: -3,
        units: 'seconds',
        title: 'Yeah!',
        message: 'Reminders are active...'
      },
      {
        trigger: 'holyday',
        before: 2,
        units: 'days',
        message: 'Holy Day soon!'
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
    alarmInfo.triggerTime = triggerTime.getTime();
    chrome.alarms.create('reminder_' + storeAlarmReminder(alarmInfo), { when: alarmInfo.triggerTime });
  }

  var addAlarmFor = {
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
    'now': function (reminder) {
      console.log('add now');
      var eventTime = new Date();
      addAlarm(eventTime, reminder);
    },
    'feast': function (reminder) {
      console.log('add feast - to do');
    },
    'holyday': function (reminder) {
      console.log('add holyday - to do');
    }
  };


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
    chrome.notifications.getPermissionLevel(function (level) {
      if (level === 'granted') {
        activateAlarms();
      } else {
        console.log('permission not granted for notifications');
      }
    });
  }

  function activateAlarms() {
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

  function showPage() {
    // may be called twice... only show if changed
    //if (_reminders == _reminderInfoShown) {
    //  return;
    //}

    //_reminderInfoShown = _reminders;

    var page = $('#pageReminders');
    var listing = page.find('.reminders');
    listing.html('<div>{trigger}... {before} {units}</div>'.filledWithEach(_reminders));

    var alarmList = page.find('.alarms');
    alarmList.html('');

    chrome.alarms.getAll(function (alarms) {
      for (var i = 0; i < alarms.length; i++) {
        var alarm = alarms[i];
        alarmList.append('<div>{0} {1}</div>'.filledWith(alarm.name, new Date(alarm.scheduledTime)));
      }
    });

  }

  function loadReminders() {
    console.log('loading');
    chrome.storage.sync.get('reminders', function (items) {
      console.log('loaded');
      if (items.reminders) {
        console.log('loaded from storage');
        _reminders = items.reminders;
      }
      if (!items.reminders || !items.reminders.length)
      {
        console.log('loading samples');
        loadSamples();
      }
    });
  }

  loadReminders();

  return {
    showPage: showPage,
    activateForToday: activateForToday,
    doReminder: doReminder,
    loadSamples: loadSamples,
    _storedAlarms: _storedAlarms
  }
}

var _reminders = new Reminders();