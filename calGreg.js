/* global getStorage */
/* global getMessage */
/* global di */
/* global chrome */
/* global $ */
var CalGreg = function (di, host) {
  var _yearShown = null;
  var _specialDays = {};
  var _scrollToMonth = -1;
  var _calendarDiv = $('#pageCalGreg .calendar');

  const hourFactor = 3.2;

  function preparePage() {
    attachHandlers();
  }

  function attachHandlers() {
    _calendarDiv.on('click', 'td.gd', function (ev) {
      var id = this.id.substring(2).split('_');
      var month = +id[0];
      var day = +id[1];

      var target = new Date(_yearShown, month, day);
      setFocusTime(target);
      refreshDateInfo();
      showInfo(_di);
    });
  }

  function showCalendar(newDi) {
    _di = newDi;

    //color swab
    //for (var i = 1; i <= 19; i++) {
    //  $('.calendar2').append('<div class=bMonth{0}>Test {0}</div>'.filledWith(i));
    //  if (i == 18) {
    //    $('.calendar2').append('<div class=bMonth{0}>Test {0}</div>'.filledWith(0));
    //  }
    //}

    if (newDi.frag2Year !== _yearShown) {
      buildCalendar();
    }
    highlightTargetDay(newDi);
  }

  function highlightTargetDay(di) {
    _calendarDiv.find('.morn.selected, .aft.selected, .eve.selected, .gd.selected').removeClass('selected');
    _calendarDiv.find('.morn.today, .aft.today, .eve.today, .gd.today').removeClass('today');
    var sel = ('.bMonth{bMonth}.bDay{bDay}, #gd{frag2Month}_{frag2Day}').filledWith(di);
    _calendarDiv.find(sel).addClass('selected');

    sel = ('.bMonth{bMonth}.bDay{bDay}, #gd{frag2Month}_{frag2Day}').filledWith(getDateInfo(new Date()));
    _calendarDiv.find(sel).addClass('today');

    if (_scrollToMonth != di.frag2Month) {
      console.log('scroll');
      scrollToMonth(di.frag2Month);
    }
  }

  function buildCalendar() {

    var gYear = _di.frag2Year;
    _yearShown = gYear;

    var gMonth = _di.frag2Month;
    //console.log(_yearShown + ' ' + gYear + ' ' + gMonth);

    _calendarDiv.html('');

    for (var m = 0; m < 12; m++) {
      buildMonth(gYear, m);
    }

    scrollToMonth(gMonth);
  }

  function scrollToMonth(gMonth) {
    _scrollToMonth = gMonth;
    var monthTop = _calendarDiv.find('#m{0}'.filledWith(gMonth)).position().top;
    var scrollContainer;
    if (_inTab) {
      $('body').scrollTop(monthTop + _calendarDiv.position().top);
    } else {
      _calendarDiv.scrollTop(_calendarDiv.scrollTop() + monthTop);
    }

    // - scrollContainer.offset().top

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
      var tomorrowDayInfo = getDateInfo(new Date(gDate.getFullYear(), gDate.getMonth(), 1 + gDate.getDate()));

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

      const total = hourFactor * 24;

      var mornSize = +(sunriseHr * hourFactor).toFixed(3);
      var eveSize = Math.max(0, +((24 - sunsetHr) * hourFactor).toFixed(3));
      var aftSize = total - eveSize - mornSize; //  +((sunsetHr - sunriseHr) * hourFactor).toFixed(3);

      $.extend(thisDayInfo, {
        classesInner: [
        ],
        classesOuter: [
          'gd'
        ],
        cellId: 'gd' + gMonth + '_' + gDay,
        mornSize: mornSize,
        aftSize: aftSize,
        eveSize: eveSize,
        tomorrowMonth: tomorrowDayInfo.bMonth,
        tomorrowDay: tomorrowDayInfo.bDay,
        monthName: tomorrowDayInfo.bDay == 1 ? tomorrowDayInfo.bMonthNameAr : (gDay == 1 ? thisDayInfo.bMonthNameAr : ''),
        isFirst: tomorrowDayInfo.bDay == 1 ? 'first' : ''
      });

      if (thisDayInfo.bMonth == 19) {
        $.extend(thisDayInfo, {
          sunriseDesc: '<span class=sunrise>{0}</span>'.filledWith(sunrise.showTime(use24HourClock ? 24 : 0))
        });
      }

      // add holy days
      if (!_specialDays[thisDayInfo.bYear]) {
        _specialDays[thisDayInfo.bYear] = holyDays.prepareDateInfos(thisDayInfo.bYear);
      }
      if (!_specialDays[tomorrowDayInfo.bYear]) {
        _specialDays[tomorrowDayInfo.bYear] = holyDays.prepareDateInfos(tomorrowDayInfo.bYear);
      }

      var holyDayInfo = $.grep(_specialDays[thisDayInfo.bYear], function (el, i) {
        return !outside && el.Type.substring(0, 1) == 'H' && el.BDateCode == thisDayInfo.bDateCode;
      });
      if (holyDayInfo.length) {
        thisDayInfo.holyDayAftStar = '<span class="hd{0}"></span>'.filledWith(holyDayInfo[0].Type);
        thisDayInfo.holyDayAftName = '<span class="hdName">{0}</span>'.filledWith(getMessage(holyDayInfo[0].NameEn));
        thisDayInfo.classesOuter.push('hdDay' + holyDayInfo[0].Type);
      }

      holyDayInfo = $.grep(_specialDays[tomorrowDayInfo.bYear], function (el, i) {
        return !outside && el.Type.substring(0, 1) == 'H' && el.BDateCode == tomorrowDayInfo.bDateCode;
      });
      if (holyDayInfo.length) {
        thisDayInfo.holyDayEveStar = '<span class="hd{0}"></span>'.filledWith(holyDayInfo[0].Type);
        thisDayInfo.classesOuter.push('hdEve' + holyDayInfo[0].Type);
      }

      thisDayInfo.classesInner = thisDayInfo.classesInner.join(' ');
      thisDayInfo.classesOuter = thisDayInfo.classesOuter.join(' ');

      if (!outside) {
        week.push(['<td class="{classesOuter}" id={cellId}><div class="dayCell {classesInner}">'
          , '<div class="morn bMonth{bMonth} bDay{bDay}" style="height:{mornSize}px">'
             + '<span class=bDay>{^holyDayAftStar}{bDay}</span>'
             + '<span class="gDay">{frag2Day}</span></div>'
          , '<div class="aft bMonth{bMonth} bDay{bDay}" style="height:{aftSize}px">'
             + '{^sunriseDesc}'
             + '{^holyDayAftName}'
             + '<div>'
                + '<span class="monthName {isFirst}">{^monthName}</span>'
                + '<span class=sunset>{endingSunsetDesc}</span>'
             + '</div>'
          , '</div><div class="eve bMonth{tomorrowMonth} bDay{tomorrowDay}" style="height:{eveSize}px">'
            + '<span class="bDay{hdEveClass}">{^holyDayEveStar}{tomorrowDay}</span>'
            + '</div>'
          , '</div></td>'].join('').filledWith(thisDayInfo))
      } else {
        thisDayInfo.outsideHeight = total.toFixed(3);
        week.push(['<td class="outside"><div style="{outsideHeight}px">'
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
        mDayName: bWeekdayMeaning[d + 1],//<div>{mDayName}</div>
        arDayName: bWeekdayNameAr[d + 1],
      });
    }

    // tried to use real caption, but gets messed on on some print pages
    var html = [
      '<table class=month id=m{0}><thead>'.filledWith(focusMonth),
      '<tr class=caption><th colspan=7>{0} {1} <span>({2})</span></tr>'.filledWith(gMonthLong[focusMonth], focusDate.getFullYear(), bMonthsInMonth.join(', ')),
      '<tr class=placeName><th colspan=7>{0}</th></tr>'.filledWith(localStorage.locationName),
      '<tr>{^0}</tr>'.filledWith('<th><div>{gDayName}</div><div class=weekDay>{arDayName}</div></th>'.filledWithEach(dayHeaders)),
      '</thead><tbody>{^0}</tbody>'.filledWith(weeks.join('\n')),
      '</table>'
    ];

    _calendarDiv.append(html.join('\n'));

  }

  preparePage();

  return {
    showCalendar: showCalendar,
    di: _di,
    scrollToMonth: scrollToMonth
  };
}
