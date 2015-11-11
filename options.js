var Options = function () {

  function showReminders() {
    var page = $('#pageReminders');
    var listing = page.find('.reminders');

    var html = [];
    $.each(_reminders, function (i, r) {
      var lines = [];
      switch (r.trigger) {
        case 'sunset':
        case 'sunrise':
        case 'noon':
          lines.push('{0} {1} {2} {3}'.filledWith(r.before, r.units, r.before < 0 ? 'before' : 'after', r.trigger))

          break;

        case 'feast':
        case 'holyday':
          lines.push('{0} {1} {2} {3}'.filledWith(r.before, r.units, 'before', r.trigger))

          break;

        case 'now':
          lines.push('{0} {1} after initial load'.filledWith(0 - r.before, r.units))
          break;
      }
      html.push('<div>' + lines.join('') + '</div>');
    });

    listing.html(html.join('\n'));

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
    chrome.storage.sync.get({
      reminders: []
    }, function (items) {
      if (items.reminders) {
        _reminders = items.reminders;
      }
      showReminders();
    });
  }

  function attachHandlers() {
    $('#btnReloadOptions').on('click', function () {
      window.location.reload();
    });
  }

  function startup() {
    localizeHtml();
    loadReminders();
    attachHandlers();
  }

  return {
    startup: startup
  }
}

var _options = new Options();
$(function () {
  _options.startup();
})