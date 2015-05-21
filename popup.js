/* global getMessage */
/* global di */
/* global chrome */
/* global $ */
var samplesDiv = $('#samples');

samplesDiv.on('click', 'button', copySample);
$('.btnChangeDay').on('click', changeDay);
$('#btnEveOrDay').on('click', toggleEveOrDay);
$('#datePicker').on('change', jumpToDate);
$('#btnRefeshLocation').on('click', function () {
  registerHandlers();
});
$('#datePicker').on('keydown', function (ev) {
  ev.stopPropagation();
});
$(document).on('keydown', keyPressed);

$('.iconArea a').click(function () {
  chrome.tabs.create({ active: true, url: this.href });
});

chrome.alarms.onAlarm.addListener(function () {
  showInfo(_di);
});

$('#sampleTitle').html(getMessage('pressToCopy'));

var sampleNum = 0;

function showInfo(di) {
  var makeObj = function(key) {
    return { name: getMessage(key), value: getMessage(key + 'Format', di) };
  };
  var dayDetails = [
     makeObj('DayOfWeek')
   , makeObj('DayOfMonth')
   , { name: getMessage('Month'), value: getMessage(di.bMonth ? 'MonthFormatNormal' : "MonthFormatAyyam", di) }
   , makeObj('YearOfVahid')
   , makeObj('Vahid')
   , makeObj('Kullishay')
   , makeObj('YearOfEra')
  ];

  var explain1 = getMessage('shoghiExample', di);

  var explain2 = getMessage('example2', di);

  $('#day').html(getMessage('bTopDayDisplay', di));
  $('#sunset').html(di.nearestSunset);
  $('#place').html(localStorage.locationName);
  $('#gDay').html(getMessage('gTopDayDisplay', di));

  $('#dayDetails').html('<dl>' + '<dt>{^name}</dt><dd>{^value}</dd>'.filledWithEach(dayDetails) + '</dl>');

  $('#explain').html(explain1);
  $('#explain2').html(explain2);

  $('#gDate').html(getMessage('gregorianDateDisplay', di));
  $('#gDateDesc').html('({^currentRelationToSunset})'.filledWith(di));

  $('#datePicker').val(di.currentDateString);

  $('#special1').hide();
  $('#special2').hide();
  if (di.special1) {
    $('#special1').html(di.special1).show();
    if (di.special2) {
      $('#special2').html(di.special2).show();
    }
    else {
      $('#special2').hide();
    }
  }
  $('#upcoming').html(di.upcomingHtml);

  addSamples(di);

  var manifest = chrome.runtime.getManifest();
  $('#version').text(getMessage('version', manifest.version_name));
  $('body')
    .addClass(manifest.current_locale)
    .addClass(manifest.current_locale.slice(0, 2));

  $('button.today').toggleClass('notToday', di.stamp !== getStorage('originalStamp'));
}

function addSamples(di) {

  // prepare samples
  clearSamples();

  var showFootnote = false;
  var msg;
  var notInMessagesJson = '_$$$_';

  for (var sampleGroupNum = 1; ; sampleGroupNum++) {
    var test = 'sampleGroup{0}_1'.filledWith(sampleGroupNum);
    msg = getMessage(test, null, notInMessagesJson);
    if (msg === notInMessagesJson) {
      break;
    }
    if (sampleGroupNum === 2) {
      showFootnote = true;
    }

    for (var sampleNum = 1; ; sampleNum++) {
      var key = 'sampleGroup{0}_{1}'.filledWith(sampleGroupNum, sampleNum);
      msg = getMessage(key, di, notInMessagesJson);
      if (msg === notInMessagesJson) {
        break;
      }

      addSample(msg, sampleGroupNum);
    }
  }

  $('#sampleFootnote').toggle(showFootnote);
}

function keyPressed(ev) {
  var key = String.fromCharCode(ev.which) || '';
  switch (ev.which) {
    case 18:
      return; // 08 (ALT) causes a crashes

    case 37:
      changeDay(null, -1);
      ev.preventDefault();
      return;
    case 39:
      changeDay(null, 1);
      ev.preventDefault();
      return;

    case 38:
      toggleEveOrDay(false);
      ev.preventDefault();
      return;
    case 40:
      toggleEveOrDay(true);
      ev.preventDefault();
      return;

    default:
      try {
        var sample = $('#key' + key);
        if (sample.length) {
          sample.trigger('click'); // effective if a used letter is typed
          ev.preventDefault();
        }
      } catch (ex) {
        // ignore jquery error
      }
      return;
  }
}

function addSample(info, group) {
  sampleNum++;
  var letter = String.fromCharCode(64 + sampleNum);

  var sample = {
    value: '',
    currentTime: false,
    letter: letter,
    tooltip: getMessage('pressKeyOrClick', letter)
  };

  if (typeof info === 'string') {
    sample.value = info;
  } else {
    $.extend(sample, info);
  }
  sample.currentNote = sample.currentTime ? ' *' : '';
  samplesDiv.find('#sampleList' + group)
    .append(('<div><button title="{tooltip}"'
    + ' type=button data-letter={letter} id="key{letter}">{letter}{currentNote}</button>'
    + ' <span>{^value}</span></div>').filledWith(sample));
}

function clearSamples() {
  sampleNum = 0;
  samplesDiv.find('#sampleList1').text('');
  samplesDiv.find('#sampleList2').text('');
}

function copySample(ev) {
  var btn = $(ev.target);
  var div = btn.closest('div');
  var text = div.find('span').text();
  $('#sampleCopy').val(text).focus().select();
  document.execCommand('copy');

  div.addClass('copied');
  btn.text(getMessage('copied'));
  setTimeout(function () {
    div.removeClass('copied');
    btn.text(btn.data('letter'));
  }, 1000);
}
function toggleEveOrDay(toEve) {
  _targetDate = getCurrentTime();
  toEve = typeof toEve === 'boolean' ? toEve : !di.bNow.eve;
  if (toEve) {
    _targetDate.setHours(23, 59, 0, 0);
  } else {
    _targetDate.setHours(12, 0, 0, 0);
  }
  refreshDateInfo();
  showInfo(_di);
}

function jumpToDate(ev) {
  var date = moment($(ev.target).val()).toDate();
  if (!isNaN(date)) {
    _targetDate = date;

    refreshDateInfo();
    showInfo(_di);
  }
}

function changeDay(ev, delta) {
  delta = ev ? +$(ev.target).data('delta') : +delta;
  if (delta === 0) {
    _targetDate = null;
  } else {
    _targetDate = getCurrentTime();
    // console.log(delta + ' ' + di.bNow.eve);  

    _targetDate.setDate(_targetDate.getDate() + delta);
  }

  _targetDate = getCurrentTime();

  refreshDateInfo();

  if (_di.bNow.eve) {
    _targetDate.setHours(23, 59, 0, 0);
  } else {
    _targetDate.setHours(12, 0, 0, 0);
  }

  showInfo(_di);

}

refreshDateInfo();
showInfo(_di);
localizeHtml();
