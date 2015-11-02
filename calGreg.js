/* global getStorage */
/* global getMessage */
/* global di */
/* global chrome */
/* global $ */

var CalGreg = function (di, host) {
  var _yearShown = null;

  const hourSize = 3; // pixels


  //???
  if (typeof di === 'undefined') {
    host = window.top;
    _di = host._di;
  } else {
    host = window;
  }

  function preparePage() {
    attachHandlers();
  }

  function attachHandlers() {
  }

  function clickBd(ev) {
    //???
    var dayDiv = $(ev.target).closest('div.bd');
    var monthDiv = dayDiv.closest('div.bm');
    var day = getNum(dayDiv, 'bd');
    var month = getNum(monthDiv, 'bm');

    var gDate = holyDays.getGDate(_di.bYear, month, day, _di.bNow.eve);

    setFocusTime(gDate);
    refreshDateInfo();
    showInfo(_di);
  }

  function getNum(el, prefix) {
    //???
    var classes = el.attr('class').split(' ');
    var len = prefix.length;
    for (var i = 0; i < classes.length; i++) {
      var className = classes[i];
      if (className.length > len && className.substring(0, len) === prefix) {
        return +className.substring(len);
      }
    }
    return 0;
  }

  function showCalendar(newDi) {
    _di = newDi;

    if (_di.frag2Year !== _yearShown) {
      buildCalendar();
    }
    highlightTargetDay();
  }

  function highlightTargetDay() {
    //???
    //$('.bd.selected, .gd.selected, .bm.selected').removeClass('selected');
    //var sel = ('.bm{bMonth}, .bm{bMonth} .bd{bDay}, .g' + gDaySerial).filledWith(di);
    //$(sel).addClass('selected');
  }

  function buildCalendar() {

    // holyDays.prepareDateInfos(_di.bYear);
    var gYear = _di.frag2Year;
    _yearShown = gYear;

    var gMonth = _di.frag2Month;
    console.log(_yearShown + ' ' + gYear + ' ' + gMonth);

    var calendarDiv = $('#pageCalGreg .calendar');
    calendarDiv.html('');

    for (var m = 0; m < 12; m++) {
      buildMonth(gYear, m);
    }

    calendarDiv.scrollTop($('#m{0}'.filledWith(gMonth)).offset().top - calendarDiv.offset().top);

    //calendarDiv.animate({
    //  scrollTop: $('#m{0}'.filledWith(gMonth)).offset().top - calendarDiv.offset().top
    //}, 1000);
  }


  function buildMonth(gYear, gMonth) {
    var gDay = 1;
    var focusMonth = gMonth;
    var focusDate = new Date(gYear, gMonth, gDay);

    // move to saturday
    var gDate = new Date(focusDate.getTime());
    var dow = gDate.getDay();
    if (dow != 6) {
      gDate.setDate(gDate.getDate() - 1 - dow);
      gYear = gDate.getFullYear();
      gMonth = gDate.getMonth();
      gDay = gDate.getDate();
    }

    var weeks = [];
    var week = ['<tr>'];
    var days = [];
    var weekNum = 0;
    var inFinalWeek = false;
    var bMonthsInMonth = [];
    var bYear = 0;

    while (true) {
      var desiredDay = gDay;
      gDate = new Date(gYear, gMonth, gDay);
      gYear = gDate.getFullYear();
      gMonth = gDate.getMonth();
      gDay = gDate.getDate();
      dow = gDate.getDay();

      //console.log(gDate.toDateString() + ' ' + gDay + ' ' + dow);
      //debugger;
      if (gDate.getDate() != desiredDay && gMonth != focusMonth) {
        inFinalWeek = true;
      }
      if (dow == 6) {
        if (week.length > 1) {
          week.push('</tr>');
          weeks.push(week.join(''));
          if (inFinalWeek) {
            week = [];
            break;
          }
        }
        week = ['<tr>'];

        weekNum++;
        if (weekNum > 8) {
          break;  // temp failsafe for dev
        }
      }

      
      var thisDayInfo = getDateInfo(gDate);
      var tomorrowDayInfo = getDateInfo(new Date(gDate.getTime() + 864e5));

      var sunrise = thisDayInfo.frag2SunTimes.sunrise;
      var sunriseHr = (sunrise.getHours() + sunrise.getMinutes() / 60);

      var sunset = thisDayInfo.frag2SunTimes.sunset;
      var sunsetHr = (sunset.getHours() + sunset.getMinutes() / 60);
      var outside = gMonth != focusMonth;

      if (!outside) {
        if (tomorrowDayInfo.bDay == 1) {
          bMonthsInMonth.push((bYear == tomorrowDayInfo.bYear ? '' : tomorrowDayInfo.bYear + ' ') + tomorrowDayInfo.bMonthNameAr);
          bYear = tomorrowDayInfo.bYear;
        } else if (gDay == 1) {
          bMonthsInMonth.push((bYear == thisDayInfo.bYear ? '' : thisDayInfo.bYear + ' ') + thisDayInfo.bMonthNameAr);
          bYear = thisDayInfo.bYear;
        }
      }

      const hourFactor = 4;

      $.extend(thisDayInfo, {
        classesInner: [
          gMonth + '_' + gDay
        ].join(' '),
        mornSize: sunriseHr * hourFactor,
        aftSize: (sunsetHr - sunriseHr) * hourFactor,
        eveSize: (24 - sunsetHr) * hourFactor,
        tomorrowMonth: tomorrowDayInfo.bMonth,
        tomorrowDay: tomorrowDayInfo.bDay,
        monthName: tomorrowDayInfo.bDay == 1 ? tomorrowDayInfo.bMonthNameAr : (gDay == 1 ? thisDayInfo.bMonthNameAr : ''),
        isFirst: tomorrowDayInfo.bDay == 1 ? 'first' : ''
      });

      if (thisDayInfo.bMonth == 19) {
        $.extend(thisDayInfo, {
          sunriseDesc: sunrise.showTime(use24HourClock ? 24 : 0)
        });
      }

      if (!outside) {
        week.push(['<td class="{classes}"><div class="dayCell {classesInner}">'
          , '<div class="morn bMonth{bMonth} bDay{bDay}" style="height:{mornSize}px">'
             + '<span class=bDay>{bDay}</span>'
             + '<span class=gDay>{frag2Day}</span></div>'
          , '<div class=aft style="height:{aftSize}px">'
             + '<span class=sunrise>{sunriseDesc}</span>'
             + '<div>'
                + '<span class="monthName {isFirst}">{^monthName}</span>'
                + '<span class=sunset>{endingSunsetDesc}</span>'
             + '</div>'
          , '</div><div class="eve bMonth{tomorrowMonth} bDay{tomorrowDay}" style="height:{eveSize}px"></div>'
          , '</div></td>'].join('').filledWith(thisDayInfo))
      } else {
        week.push(['<td class="outside"><div>'
          , '<div class=morn>'
             + '<span class=gDay>{frag2Day}</span></div>'
          , '<div class=aft></div>'
          , '<div class=eve></div>'
          , '</div></td>'].join('').filledWith(thisDayInfo))
      }

      gDay++;
    }

    if (week.length) {
      week.push('</tr>');
      weeks.push(week.join(''));
    }

    var dayHeaders = [];
    for (var d = 0; d < 7; d++) {
      dayHeaders.push({
        gDayName: gWeekdayShort[d == 0 ? 6 : d - 1],
        mDayName: bWeekdayMeaning[d + 1],
        arDayName: bWeekdayNameAr[d + 1],
      });
    }

    // tried to use real caption, but gets messed on on some print pages
    var html = [
      '<table class=month id=m{0}><thead>'.filledWith(focusMonth),
      '<tr class=caption><th colspan=7>{0} {1} <span>({2})</span></tr>'.filledWith(gMonthLong[focusMonth], focusDate.getFullYear(), bMonthsInMonth.join(', ')),
      '<tr class=placeName><th colspan=7>{0}</th></tr>'.filledWith(localStorage.locationName),
      '<tr>{^0}</tr>'.filledWith('<th><div>{gDayName}</div><div class=weekDay>{arDayName}</div><div>{mDayName}</div></th>'.filledWithEach(dayHeaders)),
      '</thead><tbody>{^0}</tbody>'.filledWith(weeks.join('\n')),
      '</table>'
    ];

    $('#pageCalGreg .calendar').append(html.join('\n'));

  }

  preparePage();

  return {
    showCalendar: showCalendar,
    di: _di
  };
}
