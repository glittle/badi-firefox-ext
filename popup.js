/* global getStorage */
/* global getMessage */
/* global di */
/* global chrome */
/* global $ */
var samplesDiv = $('#samples');
var _showingInfo = false;
var _changingBDate = false;
var _currentPageNum = 0;
var _cal1 = null;
var _enableSampleKeys = true;

samplesDiv.on('click', 'button', copySample);
$('.btnChangeDay').on('click', changeDay);
$('.btnChangeYear').on('click', changeYear);
$('.bDatePickerInputs input, .bYearPicker').on('change paste keydown keypress', changeToBDate);
$('.bKullishayPicker, .bVahidPicker, .bYearInVahidPicker').on('change paste keydown keypress', changeInVahid);

$('#btnEveOrDay').on('click', toggleEveOrDay);
$('#datePicker').on('change', jumpToDate);
$('#btnRetry').on('click', function () {
  $('#btnRetry').addClass('active');
  registerHandlers();
  setTimeout(function () {
    $('#btnRetry').removeClass('active');
  }, 1000);
});
$('#datePicker').on('keydown', function (ev) {
  ev.stopPropagation();
});
$('.pagePicker').on('click', 'button', changePage);
$(document).on('keydown', keyPressed);
$('#btnCal1').on('click', showCal1);
$('.iconArea a').click(function () {
  chrome.tabs.create({ active: true, url: this.href });
});

chrome.alarms.onAlarm.addListener(function () {
  showInfo(_di);
});

$('#sampleTitle').html(getMessage('pressToCopy'));

var sampleNum = 0;

function showInfo(di) {
  _showingInfo = true;

  var makeObj = function (key) {
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
  $('#gDay').html(getMessage('gTopDayDisplay', di));

  $('#dayDetails').html('<dl>' + '<dt>{^name}</dt><dd>{^value}</dd>'.filledWithEach(dayDetails) + '</dl>');

  $('#explain').html(explain1);
  $('#explain2').html(explain2);

  $('#gDate').html(getMessage('gregorianDateDisplay', di));
  $('#gDateDesc').html('({^currentRelationToSunset})'.filledWith(di));

  if (!_changingBDate) {
    $('.bYearPicker').val(di.bYear);
    $('#bMonthPicker').val(di.bMonth);
    $('#bDayPicker').val(di.bDay);
    $('.bKullishayPicker').val(di.bKullishay);
    $('.bVahidPicker').val(di.bVahid);
    $('.bYearInVahidPicker').val(di.bYearInVahid);
  }

  $('#datePicker').val(di.currentDateString);

  $('#special1').hide();
  $('#special2').hide();
  if (di.special1) {
    $('#special1').html(di.special1).show();
    $('#day').addClass('withSpecial');
    if (di.special2) {
      $('#special2').html(' - ' + di.special2).show();
    }
  } else {
    $('#day').removeClass('withSpecial');
  }
  $('#upcoming').html(di.upcomingHtml);

  addSamples(di);

  var manifest = chrome.runtime.getManifest();
  $('#version').text(getMessage('version', manifest.version_name));
  $('body')
    .addClass(manifest.current_locale)
    .addClass(manifest.current_locale.slice(0, 2));

  $('button.today').toggleClass('notToday', di.stamp !== getStorage('originalStamp'));

  updateStatic(di);

  if (!getStorage('locationKnown', false)) {
    setTimeout(function () {
      showLocation();
    }, 1000);
  }

  _showingInfo = false;
}

function changePage(ev, delta) {
  if (ev) {
    var btn = $(ev.target);
    var id = btn.data('page');
    showPage(id);
  }
  else {
    var pageButtons = $('.pagePicker button');
    var lastPageNum = pageButtons.length - 1;
    num = _currentPageNum;

    switch (delta) {
      case -1:
        if (num > 0) {
          num -= 1;
        } else {
          num = lastPageNum;
        }
        break;
      case 1:
        if (num < lastPageNum) {
          num += 1;
        } else {
          num = 0;
        }
        break;
    }
    _currentPageNum = num;

    showPage(pageButtons.eq(num).data('page'));
  }
}

function showPage(id) {
  var pages = $('.page');
  var btns = $('.pagePicker button');

  pages.hide();
  pages.filter('#' + id).show();

  var forNormalDisplay = '#upcoming, #upcomingTitle, .midSection, .explains, .normal';
  switch (id) {
    case 'pageCal1':
      $(forNormalDisplay).hide();
      $('#yearPicker').show();
      _enableSampleKeys = false;
      break;

    case 'pageLists':
      $(forNormalDisplay).hide();
      $('.midSection').show();
      $('#yearPicker').hide();
      _enableSampleKeys = false;
      break;

    case 'pageDay':
      $(forNormalDisplay).show();
      $('#yearPicker').hide();
      _enableSampleKeys = true;
      break;
  }

  btns.removeClass('showing');
  btns.filter('*[data-page="{0}"]'.filledWith(id)).addClass('showing');
}

function changeInVahid(ev) {
  if (_showingInfo) {
    return;
  }

  ev.cancelBubble = true;
  ev.stopPropagation();
  if (ev.type == 'keydown') {
    return; // wait for keypress
  }

  var bKullishay = $('.bKullishayPicker').val();
  if (bKullishay === '') return;
  bKullishay = +bKullishay;

  var bVahid = $('.bVahidPicker').val();
  if (bVahid === '') return;
  bVahid = +bVahid;

  var bYearInVahid = $('.bYearInVahidPicker').val();
  if (bYearInVahid === '') return;
  bYearInVahid = +bYearInVahid;

  // fix to our supported range
  if (bYearInVahid < 1) {
    bYearInVahid = 19;
    bVahid--;
  }
  if (bYearInVahid > 19) {
    bYearInVahid = 1;
    bVahid++;
  }

  if (bVahid < 1) {
    bVahid = 19;
    bKullishay--;
  }
  if (bVahid > 19) {
    bVahid = 1;
    bKullishay++;
  }

  if (bKullishay < 1) {
    bKullishay = 1;
  }
  if (bKullishay > 3) {
    bKullishay = 3;
  }

  var year = Math.min(1000, 19 * 19 * (bKullishay - 1) + 19 * (bVahid - 1) + bYearInVahid);
  changeYear(null, null, year);
}

function changeToBDate(ev) {
  if (_showingInfo) {
    return;
  }
  ev.cancelBubble = true;
  ev.stopPropagation();
  if (ev.type == 'keydown') {
    return; // wait for keypress
  }

  var input = $(ev.target);
  var bYear = input.hasClass('bYearPicker') ? input.val() : $('.bYearPicker').val(); // we have 2... use this one
  if (bYear === '') return;
  bYear = +bYear;
  // fix to our supported range
  if (bYear < 1) bYear = 1;
  if (bYear > 1000) bYear = 1000;

  var bMonth = $('#bMonthPicker').val(); // month and day will be fixed by getGDate
  if (bMonth === '') return;

  var bDay = $('#bDayPicker').val();
  if (bDay === '') return;

  try {
    var gDate = holyDays.getGDate(+bYear, +bMonth, +bDay, true);

    _targetDate = gDate;

    refreshDateInfo();

    //    _changingBDate = true;
    showInfo(_di);
    _changingBDate = false;

  } catch (error) {
    console.log(error);
  }

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
  if (ev.altKey || ev.ctrlKey) {
    return;
  }
  var key = String.fromCharCode(ev.which) || '';
  switch (ev.which) {
    case 18:
      return; // 08 (ALT) causes a crashes

    case 37: //left
      if (ev.shiftKey) {
        changeYear(null, -1);
      } else {
        changeDay(null, -1);
      }
      ev.preventDefault();
      return;
    case 39: //right
      if (ev.shiftKey) {
        changeYear(null, 1);
      } else {
        changeDay(null, 1);
      }
      ev.preventDefault();
      return;

    case 38: //up
      toggleEveOrDay(false);
      ev.preventDefault();
      return;
    case 40: //down
      toggleEveOrDay(true);
      ev.preventDefault();
      return;

    case 33: //pgup
      changePage(null, -1);
      ev.preventDefault();
      return;
    case 34: //pgdn
      changePage(null, 1);
      ev.preventDefault();
      return;

    case 36: //home
      changeDay(null, 0);
      ev.preventDefault();
      return;

    default:
      if (_enableSampleKeys) {
        try {
          var sample = $('#key' + key);
          if (sample.length) {
            sample.trigger('click'); // effective if a used letter is typed
            ev.preventDefault();
          }
        } catch (ex) {
          // ignore jquery error
        }
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
    window.close();
  }, 1000);
}
function toggleEveOrDay(toEve) {
  _targetDate = getCurrentTime();
  toEve = typeof toEve === 'boolean' ? toEve : !_di.bNow.eve;
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

function changeYear(ev, delta, targetYear) {
  delta = ev ? +$(ev.target).data('delta') : +delta;

  var year = targetYear ? targetYear : _di.bYear + delta;
  var gDate = holyDays.getGDate(year, _di.bMonth, _di.bDay, true);
  _targetDate = gDate;

  refreshDateInfo();
  showInfo(_di);
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

function fillStatic() {
  var nameList = [];
  for (var i = 1; i < bMonthNameAr.length; i++) {
    nameList.push({
      num: i,
      arabic: bMonthNameAr[i],
      meaning: bMonthMeaning[i]
    });
  }
  $('#monthListBody').html('<tr class="dayListNum{num} monthListNum{num}"><td>{num}</td><td>{arabic}</td><td>{meaning}</td></tr>'.filledWithEach(nameList));

  nameList = [];
  for (i = 1; i < bWeekdayNameAr.length; i++) {
    var gDay = i < 2 ? 5 + i : i - 2;
    var eveDay = gDay == 0 ? 6 : gDay - 1;
    nameList.push({
      num: i,
      arabic: bWeekdayNameAr[i],
      meaning: bWeekdayMeaning[i],
      equiv: gWeekdayShort[eveDay] + '/' + gWeekdayLong[gDay]
    });
  }
  $('#weekdayListBody').html('<tr class=weekdayListNum{num}><td>{num}</td><td>{arabic}</td><td>{meaning}</td><td>{equiv}</td></tr>'.filledWithEach(nameList));

  nameList = [];
  for (i = 1; i < bYearInVahidNameAr.length; i++) {
    nameList.push({
      num: i,
      arabic: bYearInVahidNameAr[i],
      meaning: bYearInVahidMeaning[i]
    });
  }
  $('#yearListBody').html('<tr class=yearListNum{num}><td>{num}</td><td>{arabic}</td><td>{meaning}</td></tr>'.filledWithEach(nameList));
}
function updateStatic(di) {
  $('#lists table tr.selected').removeClass('selected');
  $('#lists table tr.selectedDay').removeClass('selectedDay');
  $('.yearListNum{bYearInVahid}, .monthListNum{bMonth}'.filledWith(di)).addClass('selected');
  if (di.bMonth !== 0) {
    $('.dayListNum{bDay}, .weekdayListNum{bWeekday}'.filledWith(di)).addClass('selectedDay');
  } else {
    // ayyam-i-ha
    $('.weekdayListNum{bWeekday}'.filledWith(di)).addClass('selectedDay');
  }
  if (_cal1) {
    _cal1.showCalendar(di);
  }
}

function showShortcutKeys() {
  if (chrome.commands) {
    chrome.commands.getAll(function (cmd) {
      for (var i = 0; i < cmd.length; i++) {
        var a = cmd[i];
        if (a.shortcut) {
          $('#shortcutKeys').text(a.shortcut);
        };
      };
    });
  }
}

function showLocation() {
  $('#place').html(localStorage.locationName);
  $('#locationErrorHolder').toggle(!getStorage('locationKnown', false));
}

function hideCal1() {
  $('#iFrameCal1').hide();
}

function showCal1() {
  var iframe = $('#iFrameCal1');
  if (iframe.is(':visible')) {
    iframe.hide();
  }
  else {
    if (!iframe.attr('src')) {
      iframe.attr('src', 'cal1.html').fadeIn();
    }
    else {
      iframe.show();
    }
  }
}

$(function () {
  showPage('pageDay');

  refreshDateInfo();
  showInfo(_di);
  localizeHtml();

  showLocation();

  setTimeout(function () {
    fillStatic();
    updateStatic(_di);

    showShortcutKeys();

    localizeHtml('#pageLists');

    setTimeout(function () {
      _cal1 = Cal1(_di);
      _cal1.showCalendar(_di);
    }, 100);
  }, 100);
});
