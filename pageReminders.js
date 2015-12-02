/* global getMessage */

//"options_ui": {
//  "_page": "options.html",
//  "chrome_style":  true
//},


var PageReminders = function () {
  var _reminderPrefix = 'reminder_';

  var _reminderModulePort = {};
  var _reminders = [];

  var _page = $('#pageReminders');
  var _currentEditId = 0;


  function showReminders() {
    var listing = _page.find('.reminders');
    var html = [];
    var displayId = 1;
    log('show reminders');
    _reminders.sort(reminderSort);
    $.each(_reminders, function (i, r) {
      var lines = [];

      r.displayId = displayId;
      displayId++;

      r.delta = r.delta || -1;

      switch (r.trigger) {
        case 'sunset':
        case 'sunrise':
        case 'midnight':
        case 'noon':
          lines.push(getMessage('reminderList_time', r));
          break;

        case 'feast':
        case 'holyday':
          lines.push(getMessage('reminderList_holyday', r));
          break;

        case 'bday':
          lines.push(getMessage('reminderList_bday', r));
          break;

        case 'load':
          lines.push(getMessage('reminderList_onload', r));
          break;

        default:
          lines.push(JSON.stringify(r));
      }

      if (r.action) {
        lines.push(' ({0})'.filledWith(getMessage('reminderAction_' + r.action)));
      }

      html.push('<div id=r_{0}><button class=button data-id={0}>{3}</button>{0} - {^1} - {^2}</div>'.filledWith(
        r.displayId, getMessage('reminderTrigger_' + r.trigger), lines.join(''), getMessage('EditBtn')));
    });

    listing.html(html.join('\n'));

    showActiveAlarms();

    setAsCurrentDisplay(_currentEditId);
  }


  function showActiveAlarms() {

    //update heading
    _page.find('#remindersScheduled').html(getMessage('remindersScheduled', { time: new Date().showTime() }));

    // blank out the list
    var alarmList = _page.find('.alarms');
    alarmList.html('');

    chrome.alarms.getAll(function (alarms) {
      alarms.sort(function (a, b) {
        return a.scheduledTime < b.scheduledTime ? -1 : 1;
      });

      for (var i = 0; i < alarms.length; i++) {
        var alarm = alarms[i];
        if (alarm.name.startsWith(_reminderPrefix)) {
          var details = getStorage(alarm.name);
          if (!details) {
            log('No details for ' + alarm.name);
            continue;
          }

          var info = {
            scheduledTime: new Date(alarm.scheduledTime).showTime(),
            event: getMessage('reminderTrigger_' + details.trigger),
            pastFuture: details.delta == -1 ? getMessage('alarmShowingFuture') : getMessage('alarmShowingPast'),
            eventTime: showEventTime(details)
          };
          alarmList.append('<li>{0}</li>'.filledWith(getMessage('alarmListItem', info)));
        }
      }
    });
  }

  function editReminder(id) {
    var matchingReminders = $.grep(_reminders, function (r, i) {
      return r.displayId == id;
    });
    if (!matchingReminders.length) {
      return;
    }
    var reminder = matchingReminders[0];

    resetInputs();

    setAsCurrentDisplay(id);

    //log(reminder);

    _page.find('#btnReminderSave').show();

    reminder.delta = reminder.delta || -1;

    for (var prop in reminder) {
      if (reminder.hasOwnProperty(prop)) {
        // do id and class
        _page.find('#reminder_{0}, .reminder_{0}'.filledWith(prop)).val(reminder[prop]);
      }
    }

    var model = getAndShowModel();

    switch (model) {
      case 'time':

      case 'day':

      case 'other':

      default:

    }
  }

  function save(mode) {
    // mode: 1=normal; 2=new; 3=test
    if (!_page.find('form')[0].checkValidity()) {
      return;
    }

    if (!_currentEditId || mode == 2) {
      _currentEditId = _reminders.length;
      mode = 2;
      log('new reminder');
    }

    var r = buildReminder(_currentEditId);

    if (r.iftttKey) {
      // store this, for other reminders to use
      setStorage('iftttKey', r.iftttKey);
    }

    var saveToBackground = true;
    var resetAfter = true;

    switch (mode) {
      case 1: // normal
        // find and replace
        $.each(_reminders, function (i, el) {
          if (el.displayId === r.displayId) {
            _reminders[i] = r;
            return false; // done
          }
        });
        break;

      case 2: // create new
        // add to the list
        _reminders.push(r);
        break;

      case 3: // test
        _reminderModulePort.postMessage({
          code: "showTestAlarm",
          reminder: r
        });
        resetAfter = false;
        saveToBackground = false;
        break;
    }

    if (saveToBackground) {
      try {
        tracker.sendEvent('saveReminder', r.trigger, r.delta * r.num + ' ' + r.units);
      } catch (e) {
        log('Error', e);
      }
      _reminderModulePort.postMessage({ code: "saveAllReminders", reminders: _reminders });
    }
    if (resetAfter) {
      resetInputs();
    }
  }

  function buildReminder(id) {
    var r = {
      displayId: id
    };

    _page.find('*[id^="reminder_"]:visible, *[class*="reminder_"]:visible').each(function (i, el) {
      var input = $(el);
      var name = '';
      if (el.id.startsWith('reminder_')) {
        name = el.id;
      } else {
        var classes = $.grep(el.className.split(' '), function (n, g) {
          return n.startsWith('reminder_');
        });
        if (classes.length) {
          name = classes[0];
        }
      }
      var prop = name.split('_')[1];
      var value = input.val();
      if (input.data('type') == 'num') {
        value = +value;
      }
      r[prop] = value;

      if (input[0].tagName === 'SELECT') {
        r[prop + 'Display'] = input.find(':selected').text();
      }
      if (input[0].id === 'reminder_trigger') {
        var selectedOption = input.find(':selected');
        r.model = selectedOption.data('model') || selectedOption.closest('optgroup').data('model')
      }
    });

    r.deltaText = r.delta === -1 ? getMessage('alarmShowingBefore') : getMessage('alarmShowingAfter');

    switch (r.trigger) {
      case 'feast':
      case 'holyday':
      case 'bday':
        r.delta = -1;
    }
    //if (r.hasOwnProperty('alertAtHr')) {
    //  r.alertTime = getTimeStr(r.alertAtHr, r.alertAtMin);
    //}
    r.api = r.api || 'html';
    r.delta = r.delta || -1;

    //log(r);

    return r;
  }


  function getAndShowModel() {
    var selectedOption = _page.find('#reminder_trigger option:selected');
    var model = selectedOption.data('model') || selectedOption.closest('optgroup').data('model');
    _page.find('.reminderModel, .reminderEditInputs, .reminderAction').hide();

    _page.find('.reminderModel :input').each(function (i, input) { $(input).prop('disabled', true) });

    if (model) {
      var modelArea = _page.find('#model_{0}'.filledWith(model));
      modelArea.show().find(':input').each(function (i, input) { $(input).prop('disabled', false) });

      // disable all action inputs
      _page.find('.reminderAction').find(':input').each(function (i, input) { $(input).prop('disabled', true) });

      // show and enable the selected ones
      var action = $('#reminder_action').val();
      _page.find(`#reminderAction_${action}`).show().find(':input').each(function (i, input) { $(input).prop('disabled', false) });
      switch (action) {
        case 'ifttt':
          var id = $('.reminder_iftttKey');
          if (!id.val()) {
            id.val(getStorage('iftttKey', ''));
          }
          var eventName = $('.reminder_iftttEvent');
          if (!eventName.val()) {
            eventName.val(_page.find('#reminder_trigger').val());
          }
          break;
      }

      _page.find('.modelTriggerEcho').html(selectedOption.html());
      _page.find('.reminderEditInputs').show();
    }

    return model;
  }


  function getAndShowReminders() {
    log('sending msg');

    _reminderModulePort.postMessage({
      code: "getReminders"
    });
  }

  function setAsCurrentDisplay(id) {
    _currentEditId = id;
    _page.find('.reminders > div').removeClass('inEdit');
    _page.find('#r_' + id).addClass('inEdit');
  }

  function showEventTime(details) {
    switch (details.trigger) {
      case 'sunset':
      case 'sunrise':
      case 'midnight':
      case 'noon':
      case 'load':
        return new Date(details.eventTime).showTime();

      case 'feast':
      case 'holyday':
      case 'bday':
        var testInfo = {
          time: new Date(details.eventTime)
        };
        eventEventTime(testInfo);
        return getMessage('eventTime', testInfo);

      default:
        log('time for?', details);
    }

    return '';
  }

  function reminderSort(a, b) {
    return reminderOrder(a) < reminderOrder(b) ? -1 : 1;
  }

  function reminderOrder(r) {
    if (r.sortOrder) {
      return r.sortOrder;
    }
    var result;
    switch (r.trigger) {
      case 'sunrise':
        result = '01';
        break;

      case 'noon':
        result = '02';
        break;

      case 'sunset':
        result = '03';
        break;

      case 'midnight':
        result = '04';
        break;

      case 'holyday':
        result = '05';
        break;

      case 'feast':
        result = '06';
        break;

      case 'bday':
        result = '07';
        break;

      case 'load':
        result = '08';
        break;

      default:
        result = '99';
        break;
    }

    r.delta = r.delta || -1;

    result += r.delta < 0 ? 'A' : 'B';

    switch (r.units) {
      case 'seconds':
        result += 'A';
        break;

      case 'minutes':
        result += 'B';
        break;

      case 'hours':
        result += 'C';
        break;

      case 'days':
        result += 'D';
        break;
    }

    result += ('00000' + (r.delta < 0 ? 99999 - r.num : r.num)).slice(-5);

    r.sortOrder = result;
    //    log(result);
    return result;
  }


  function attachHandlers() {
    _page.on('submit', 'form', function (e) {
      //prevent the form from doing a real submit
      e.preventDefault();
      return false;
    });

    _page.find('#btnReloadOptions').on('click', function () {
      window.location.reload();
    });

    _page.find('#reminder_trigger').on('change', function () {
      getAndShowModel();
    });

    _page.find('#reminder_action').on('change', function () {
      getAndShowModel();
    });

    _page
      .on('click', '.reminders button', function (ev) {
        editReminder(+$(ev.target).data('id'));
      })
    .on('click', '#btnReminderSave', function () {
      save(1);
    })
    .on('click', '#btnReminderSaveNew', function () {
      save(2);
    })
    .on('click', '#btnReminderTest', function () {
      save(3);
    })
    .on('click', '#btnReminderCancel', function () {
      resetInputs();
    })
    .on('click', '#btnReminderDelete', function () {
      if (_currentEditId) {
        var deleted = false;
        $.each(_reminders, function (i, r) {
          if (r.displayId === _currentEditId) {
            _reminders.splice(i, 1);
            deleted = true;
            _currentEditId = 0;
            return false;
          }
        });
        if (deleted) {
          _reminderModulePort.postMessage({ code: "saveAllReminders", reminders: _reminders });
          resetInputs();
        }
      }
    });
  }

  function resetInputs() {
    _page.find('*:input').each(function (i, el) {
      var input = $(el);
      var defaultValue = input.data('default');
      if (typeof defaultValue !== 'undefined') {
        input.val(defaultValue);
      }
    });
    getAndShowModel();
    setAsCurrentDisplay(0);
  }

  function establishPortToBackground() {
    log('making port');
    _reminderModulePort = chrome.runtime.connect({ name: "reminderModule" });
    _reminderModulePort.onMessage.addListener(function (msg) {
      log('received:', msg);

      // these are return call in response to our matching request
      switch (msg.code) {
        case 'getReminders':
          _reminders = msg.reminders;
          showReminders();
          break;

        case 'alarmsUpdated':
          showActiveAlarms();
          break;

        case 'saveAllReminders':
          _reminders = msg.reminders;
          showReminders();
          break;

      }


    });
  }

  function startup() {
    establishPortToBackground();
    getAndShowReminders();
    attachHandlers();
    resetInputs();
  }

  startup();

  return {
    showReminders: showReminders

  }
}
