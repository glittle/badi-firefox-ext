/* Code by Glen Little */
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
var _enableDayKeys = true;
var _pageHitTimeout = null;
var tracker = null;
var _currentPageId = null;
var _initialStartupDone = false;

samplesDiv.on('click', 'button', copySample);
$('.btnChangeDay').on('click', changeDay);
$('.btnChangeYear').on('click', changeYear);

$('.btnJumpTo').on('click', moveDays);
$('.jumpTo').val(getStorage('jumpTo', '90'));

$('.bDatePickerInputs input, .bYearPicker').on('change paste keydown keypress', changeToBDate);
$('.bKullishayPicker, .bVahidPicker, .bYearInVahidPicker').on('change paste keydown keypress', changeInVahid);

$('#btnEveOrDay').on('click', toggleEveOrDay);
$('#datePicker').on('change', jumpToDate);
$('#eventStart').on('change', function () {
  setStorage('eventStart', $(this).val());

  _lastSpecialDaysYear = null;
  BuildSpecialDaysTable(_di);
  $('.eventTime').effect("highlight", 1000);
});
$('.includeThis').on('change, click', SetFiltersForSpecialDaysTable);

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
$('.selectPages').on('click', 'button', changePage);
$(document).on('keydown', keyPressed);
//$('#btnCal1').on('click', showCal1);
$('.iconArea a').click(function () {
  chrome.tabs.create({ active: true, url: this.href });
});

chrome.alarms.onAlarm.addListener(function () {
  showInfo(_di);
});

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
  //$('#gDayWithSunset').html(getMessage('gTopDayDisplay', di) + ' - ' + getMessage(di.bNow.eve ? 'startingSunsetDesc' : 'endingSunsetDesc', di));

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

  if (_initialStartupDone) {
    updateStatic(di);
    BuildSpecialDaysTable(di);
  }

  if (getStorage('locationNameKnown', false)) {
    showLocation();
  } else {
    startGetLocationName();
  }

  setFocusTime(di.currentTime);

  _showingInfo = false;
}

function changePage(ev, delta) {

  // opens in a regular tab
  // var url = 'chrome-extension://' + getMessage('@@extension_id') + '/popup.html';
  // chrome.tabs.create({url: url});

  if (ev) {
    var btn = $(ev.target);
    var id = btn.data('page');
    showPage(id);
  }
  else {
    var pageButtons = $('.selectPages button');
    var lastPageNum = pageButtons.length - 1;
    var num = _currentPageNum;

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
  id = id || _currentPageId || 'pageDay';
  var pages = $('.page');
  var btns = $('.selectPages button');

  pages.css({ visible: 'hidden' }); // reduce flicker?

  var other = '.vahidInputs'; // don't fit on any page... likely need to remove it
  var pageDay = '#gDay, #showUpcoming, .explains, .normal, #show, .iconArea, #special';
  var pageEvents = '#yearSelector, .iconArea, #specialDaysTitle';
  var pageCal1 = '#yearSelector, .JumpDays, #show, #gDay';
  var pageLists = '#gDay, #show, .iconArea, #special';
  var pageFast = '#yearSelector, .iconArea';

  $([other, pageDay, pageEvents, pageCal1, pageLists, pageFast].join(',')).hide();

  _currentPageId = id;
  $('body').attr('data-pageid', id);
  switch (id) {
    case 'pageDay':
      $(pageDay).show();
      _enableSampleKeys = true;
      _enableDayKeys = true;
      break;

    case 'pageEvents':
      $(pageEvents).show();
      _enableSampleKeys = false;
      _enableDayKeys = false;
      break;

    case 'pageCal1':
      $(pageCal1).show();
      _enableSampleKeys = false;
      _enableDayKeys = true;
      break;

    case 'pageLists':
      $(pageLists).show();
      _enableSampleKeys = false;
      _enableDayKeys = true;
      break;

    case 'pageFast':
      $(pageFast).show();
      _enableSampleKeys = false;
      _enableDayKeys = false;
      break;
  }

  btns.removeClass('showing');
  btns.filter('*[data-page="{0}"]'.filledWith(id)).addClass('showing');

  pages.hide();
  pages.filter('#' + id).show();
  pages.css({ visible: 'visible' });

  if (id == 'pageDay') {
    adjustHeight();
  }

  setStorage('focusPage', id);

  clearTimeout(_pageHitTimeout);
  // delay a bit, to ensure we are not just moving past this page
  if (tracker) {
    _pageHitTimeout = setTimeout(function () {
      tracker.sendAppView(id);
    }, 500);
  }
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

  var maxKullishay = 3;

  // fix to our supported range
  if (bYearInVahid < 1) {
    bVahid--;
    if (bVahid < 1) {
      bKullishay--;
      if (bKullishay < 1) {
        bKullishay = 1;
      }
      else {
        bVahid = 19;
        bYearInVahid = 19;
      }
    }
    else {
      bYearInVahid = 19;
    }
  }
  if (bYearInVahid > 19) {
    bVahid++;
    if (bVahid > 19) {
      bKullishay++;
      if (bKullishay > maxKullishay) {
        bKullishay = maxKullishay;
      }
      else {
        bVahid = 1;
        bYearInVahid = 1;
      }
    }
    else {
      bYearInVahid = 1;
    }
  }

  if (bVahid < 1) {
    bKullishay--;
    if (bKullishay < 1) {
      bKullishay = 1;
    }
    else {
      bVahid = 19;
    }
  }
  if (bVahid > 19) {
    bKullishay++;
    if (bKullishay > maxKullishay) {
      bKullishay = maxKullishay;
    }
    else {
      bVahid = 1;
    }
  }

  if (bKullishay < 1) {
    bKullishay = 1;
  }
  if (bKullishay > maxKullishay) {
    bKullishay = maxKullishay;
  }

  tracker.sendEvent('changeInVahid', bKullishay + '-' + bVahid + '-' + bYearInVahid);

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

  tracker.sendEvent('changeToBDate', bYear + '.' + bMonth + '.' + bDay);

  try {
    var gDate = holyDays.getGDate(+bYear, +bMonth, +bDay, true);

    setFocusTime(gDate);

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

  for (var sampleGroupNum = 1; sampleGroupNum < 9; sampleGroupNum++) {
    var test = 'sampleGroup{0}_1'.filledWith(sampleGroupNum);
    msg = getMessage(test, null, notInMessagesJson);
    if (msg === notInMessagesJson) {
      continue;
    }
    if (sampleGroupNum === 2) {
      showFootnote = true;
    }

    for (var sampleNum = 1; sampleNum < 99; sampleNum++) {
      var key = 'sampleGroup{0}_{1}'.filledWith(sampleGroupNum, sampleNum);
      msg = getMessage(key, di, notInMessagesJson);
      if (msg === notInMessagesJson) {
        continue;
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
        if (_enableDayKeys) {
          changeDay(null, -1);
        }
      }
      ev.preventDefault();
      return;
    case 39: //right
      if (ev.shiftKey) {
        changeYear(null, 1);
      } else {
        if (_enableDayKeys) {
          changeDay(null, 1);
        }
      }
      ev.preventDefault();
      return;

    case 38: //up
      if (_enableDayKeys) {
        toggleEveOrDay(false);
        ev.preventDefault();
      }
      return;
    case 40: //down
      if (_enableDayKeys) {
        toggleEveOrDay(true);
        ev.preventDefault();
      }
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

      if (_currentPageId == 'pageEvents') {
        // don't require ALT...
        try {
          $('input[accessKey=' + key + ']', '#pageEvents').click();
          $('select[accessKey=' + key + ']', '#pageEvents').click();
        } catch (e) {
          // key may have odd symbol in it
        }
      }

      var pageNum = +key;
      var validPagePicker = key == pageNum;

      if (!validPagePicker && (key >= 'a' && key <= 'i')) {
        pageNum = key.charCodeAt(0) - 96;
        validPagePicker = true;
      }

      if (validPagePicker) {
        var pageButtons = $('.selectPages button');
        if (pageNum > 0 && pageNum <= pageButtons.length) {
          _currentPageNum = pageNum - 1;
          showPage(pageButtons.eq(_currentPageNum).data('page'));
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
  var letter = btn.text();
  tracker.sendEvent('sample', letter);

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
  setFocusTime(getFocusTime());
  toEve = typeof toEve === 'boolean' ? toEve : !_di.bNow.eve;
  if (toEve) {
    _focusTime.setHours(23, 59, 0, 0);
  } else {
    _focusTime.setHours(12, 0, 0, 0);
  }

  tracker.sendEvent('toggleEveDay', toEve ? 'Eve' : 'Day');

  refreshDateInfo();
  showInfo(_di);
}

function moveDays(ev) {
  var input = $('input.jumpTo');
  var days = +input.val();
  if (!days) {
    days = 0;
    input.val(days);
  } else {
    var min = +input.attr('min');
    if (days < min) {
      days = min;
      input.val(days);
    }
    else {
      var max = +input.attr('max');
      if (days > max) {
        days = max;
        input.val(days);
      }
    }
  }
  setStorage('jumpTo', days);
  tracker.sendEvent('jumpDays', days);

  if (!days) {
    return;
  }
  var target = new Date(_di.currentTime);
  target.setTime(target.getTime() + days * 86400000);
  setFocusTime(target);
  refreshDateInfo();
  showInfo(_di);
}

function jumpToDate(ev) {
  var date = moment($(ev.target).val()).toDate();
  if (!isNaN(date)) {
    setFocusTime(date);

    refreshDateInfo();
    showInfo(_di);
  }
}

function changeYear(ev, delta, targetYear) {
  delta = ev ? +$(ev.target).data('delta') : +delta;


  var year = targetYear ? targetYear : _di.bYear + delta;
  var gDate = holyDays.getGDate(year, _di.bMonth, _di.bDay, true);
  setFocusTime(gDate);

  tracker.sendEvent('changeYear', delta);

  refreshDateInfo();
  showInfo(_di);
}

function changeDay(ev, delta) {

  delta = ev ? +$(ev.target).data('delta') : +delta;
  if (delta === 0) {
    // reset to real time
    setFocusTime(new Date());
  } else {
    var time = getFocusTime();
    time.setDate(time.getDate() + delta);
    setFocusTime(time);
  }

  if (tracker) {
    tracker.sendEvent('changeDay', delta);
  }

  refreshDateInfo();

  if (_di.bNow.eve) {
    _focusTime.setHours(23, 59, 0, 0);
  } else {
    _focusTime.setHours(12, 0, 0, 0);
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

function fillEventStart() {
  // fill ddl
  var startTime = new Date(2000, 5, 5, 0, 0, 0, 0); // random day
  var startTimes = [];
  for (var h = 1800; h <= 2000; h += 100) {
    for (var m = 0; m <= 30; m += 30) {
      startTime.setHours(h / 100, m);
      startTimes.push({ v: h + m, t: startTime.showTime(use24HourClock ? 24 : 0) });
      if (h === 2000) {
        break; // to end at 8pm
      }
    }
  }
  $('#eventStart')
    .html('<option value={v}>{t}</option>'.filledWithEach(startTimes))
    .val(getStorage('eventStart') || '1930');
}

function updateStatic(di) {
  $('#pageLists table tr.selected').removeClass('selected');
  $('#pageLists table tr.selectedDay').removeClass('selectedDay');
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

function SetFiltersForSpecialDaysTable(ev) {
  var includeFeasts = $('#includeFeasts').prop('checked');
  var includeHolyDays = $('#includeHolyDays').prop('checked');

  if (!includeFeasts && !includeHolyDays && ev) {
    // both turned off?  turn on the other one
    var clicked = $(ev.target).closest('input').attr('id');
    $(clicked == 'includeFeasts' ? '#includeHolyDays' : '#includeFeasts').prop('checked', true);

    includeFeasts = $('#includeFeasts').prop('checked');
    includeHolyDays = $('#includeHolyDays').prop('checked');
  }


  setStorage('includeFeasts', includeFeasts);
  setStorage('includeHolyDays', includeHolyDays);
  $('#specialListsTable')
    .toggleClass('Feasts', includeFeasts)
    .toggleClass('HolyDays', includeHolyDays);
}
var _lastSpecialDaysYear = 0;

function BuildSpecialDaysTable(di) {
  var year = di.bNow.y;
  if (_lastSpecialDaysYear === year) {
    return;
  }
  _lastSpecialDaysYear = year;
  var dayInfos = holyDays.prepareDateInfos(year);

  SetFiltersForSpecialDaysTable();

  dayInfos.forEach(function (dayInfo, i) {
    if (dayInfo.Type == 'Today') {
      // an old version... remove Today from list
      dayInfos.splice(i, 1);
      i--;
    }
  });

  //var todayShown = false;
  //todayShown = true; // decided not to include 'today' in the listing
  //dayInfos.forEach(function (dayInfo, i) {
  //  if (!todayShown) {
  //    var targetDi = getDateInfo(dayInfo.GDate, true);
  //    if (targetDi.currentTime > di.currentTime) {
  //      dayInfos.splice(i, 0, {
  //        GDate: di.currentTime,
  //        di: di,
  //        Time: digitPad2(di.currentTime.getHours()) + digitPad2(di.currentTime.getMinutes()),
  //        A: getMessage('currentDay'),
  //        Type: 'Today',
  //        BMonthDay: {
  //          d: di.bNow.d,
  //          m: di.bNow.m,
  //        }
  //      });
  //      i++;
  //      todayShown = true;
  //    }
  //  }

  //});

  var defaultEventStart = $('#eventStart').val();
  dayInfos.forEach(function (dayInfo, i) {
    var targetDi = getDateInfo(dayInfo.GDate, true);

    dayInfo.di = targetDi;
    dayInfo.D = targetDi.bMonthNameAr + ' ' + targetDi.bDay;
    dayInfo.G = getMessage('evePartOfDay', targetDi);
    dayInfo.Sunset = getMessage('startingSunsetDesc', targetDi);

    var targetTime = dayInfo.Time || defaultEventStart;

    if (dayInfo.Type === 'M') {
      dayInfo.A = getMessage('FeastOf').filledWith(targetDi.bMonthMeaning);
    }
    if (dayInfo.Type.slice(0, 1) === 'H') {
      dayInfo.A = getMessage(dayInfo.NameEn);
    }
    if (dayInfo.Type === 'HS') {
      dayInfo.NoWork = getMessage('mainPartOfDay', targetDi);
    }
    if (dayInfo.Special && dayInfo.Special.slice(0, 5) === 'AYYAM') {
      dayInfo.A = getMessage(dayInfo.NameEn);
    }

    if (dayInfo.Type === 'Fast') {
      var sunrise = targetDi.frag2SunTimes.sunrise;
      dayInfo.Sunrise = sunrise ? sunrise.showTime(use24HourClock ? 24 : 0) : '?';
      dayInfo.FastDay = getMessage('mainPartOfDay', targetDi);
      if (targetDi.frag2Weekday == 6) {
        dayInfo.RowClass = 'FastSat';
      }
    }

    if (targetTime == 'SS2') {
      var date = new Date(dayInfo.di.frag1SunTimes.sunset.getTime());
      date.setHours(date.getHours() + 2);
      // about 2 hours after sunset
      var minutes = date.getMinutes();
      minutes = minutes > 30 ? 30 : 0; // start 1/2 hour before
      date.setMinutes(minutes);
      dayInfo.Event = { time: date };
    }
    else if (targetTime) {
      var adjustDTtoST = 0;
      if (targetTime.slice(-1) == 'S') {
        targetTime = targetTime.slice(0, 4);
        adjustDTtoST = targetDi.frag1.inStandardTime() ? 0 : 1;
      }
      date = new Date(dayInfo.di.frag1.getTime());
      var timeHour = +targetTime.slice(0, 2);
      var timeMin = targetTime.slice(-2);
      date.setHours(timeHour + adjustDTtoST);
      date.setMinutes(timeMin);


      if (targetDi.frag1SunTimes.sunset.getTime() < date.getTime()) {
        //dayInfo.isEve = " *";
      } else {
        date.setHours(date.getHours() + 24);
      }

      dayInfo.Event = { time: date };

      dayInfo.StartTime = dayInfo.Event.time.showTime(use24HourClock ? 24 : 0);
      eventEventTime(dayInfo.Event);
      dayInfo.EventTime = getMessage('eventTime', dayInfo.Event);
    }

    if (dayInfo.Time) {
      if (dayInfo.Type != 'Today') {
        dayInfo.ST = getMessage('specialTime_' + dayInfo.Time);
        dayInfo.STClass = ' SpecialTime';
      }
    } else {
      dayInfo.DefaultTimeClass = ' Default';
    }

    dayInfo.date = getMessage('upcomingDateFormat', targetDi);

    if (dayInfo.Type.substring(0, 1) == 'H') {
      dayInfo.TypeShort = ' H';
    }
  });

  var rowTemplate = [];
  rowTemplate.push('<tr class="{Type}{TypeShort}{DefaultTimeClass}{STClass}">');
  rowTemplate.push('<td>{D}</td>');
  rowTemplate.push('<td class=name {STColSpan}>{A}</td>');
  rowTemplate.push('<td class=forHD>{NoWork}</td>');
  rowTemplate.push('<td class=eventTime><div class="forHD time">{ST} {SpecialTime}</div>{EventTime}{isEve}</td>');
  rowTemplate.push('<td>{G}</td>');
  rowTemplate.push('</tr>');

  $('#specialListBody').html(rowTemplate.join('').filledWithEach(dayInfos.filter(function (el) { return el.Type != 'Fast' })));

  $('#specialDaysTitle').html(getMessage('specialDaysTitle', di));


  var fastRowTemplate = [];
  fastRowTemplate.push('<tr class="{RowClass}">');
  fastRowTemplate.push('<td>{D}</td>');
  fastRowTemplate.push('<td class=centered>{Sunrise}</td>');
  fastRowTemplate.push('<td class=centered>{Sunset}</td>');
  fastRowTemplate.push('<td>{FastDay}</td>');
  fastRowTemplate.push('</tr>');

  $('#fastListBody')
    .html(fastRowTemplate.join('')
    .filledWithEach(dayInfos.filter(function (el) { return el.Type == 'Fast' })));

  $('#fastDaysTitle').html(getMessage('fastDaysTitle', di));
}

function eventEventTime(obj) {
  var eventTime = obj.time;

  obj.eventYear = eventTime.getFullYear();
  obj.eventMonth = eventTime.getMonth(); // 0 based
  obj.eventDay = eventTime.getDate();
  obj.eventWeekday = eventTime.getDay();

  obj.eventMonthLong = gMonthLong[obj.eventMonth];
  obj.eventMonthShort = gMonthShort[obj.eventMonth];
  obj.eventWeekdayLong = gWeekdayLong[obj.eventWeekday];
  obj.eventWeekdayShort = gWeekdayShort[obj.eventWeekday];

  obj.eventTime = eventTime.showTime(use24HourClock ? 24 : 0)
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
  $('.place').html(localStorage.locationName);
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

function adjustHeight() {
  // try to ensure that the tabs are not longer than page1 content
  var content = $('.mainMiddle');
  var contentHeight = content.height();
  var tabsHeight = $('.selectPages').prop('scrollHeight');
  if (tabsHeight > contentHeight) {
    content.css("min-height", (5 + tabsHeight) + 'px');
  }
}

function prepareDefaults() {
  var feasts = getStorage('includeFeasts');
  var holyDays = getStorage('includeHolyDays');

  if (typeof (feasts) === 'undefined' && typeof (holyDays) === 'undefined') {
    feasts = false;
    holyDays = true;
  }

  $('#includeFeasts').prop('checked', feasts || false);
  $('#includeHolyDays').prop('checked', holyDays || false);
}

function recallFocus() {
  var storedAsOf = getStorage('focusTimeAsOf');
  if (!storedAsOf) {
    return;
  }
  var focusTimeAsOf = new Date(storedAsOf);

  var now = new Date();
  if (now - focusTimeAsOf < settings.rememberFocusTimeMinutes * 60000) {

    var focusPage = getStorage('focusPage');
    if (focusPage) {
      _currentPageId = focusPage;
    }

    var stored = getStorage('focusTime');
    if (stored) {
      var time = new Date(stored);

      if (now.toDateString() != time.toDateString()) {

        console.log('reuse focus time: ' + time);

        setFocusTime(time);

        setTimeout(function () {
          $('#day,#gDay').effect("highlight", 4000);
        }, 150);
      }
    }
  }
}

$(function () {
  recallFocus();

  showPage();

  refreshDateInfo();

  localizeHtml();

  showInfo(_di);

  showShortcutKeys();

  setTimeout(function () {

    _initialStartupDone = true;

    prepareDefaults();

    fillEventStart();

    fillStatic();

    BuildSpecialDaysTable(_di);

    updateStatic(_di);

    localizeHtml('#pageLists');

    _initialDi = $.extend(true, {}, _di);

    _cal1 = Cal1(_di);
    _cal1.showCalendar(_di);

    $('body').show();
    adjustHeight();

    prepareAnalytics();

  }, _currentPageId == 'pageDay' ? 1000 : 0);

  if (_currentPageId == 'pageDay') {
    $('body').show();
    adjustHeight();
  }
});
