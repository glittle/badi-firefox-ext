/* global getStorage */
/* global getMessage */
/* global di */
/* global chrome */
/* global $ */

var Cal1 = function (di, host) {
  var _yearShown = null;

  if (typeof di === 'undefined') {
    host = window.top;
    di = host._di;
  } else {
    host = window;
  }


  function preparePage() {
    attachHandlers();
  }

  function attachHandlers() {
    $('#btnClose').on('click', function () {
      host.hideCal1();
    });
    $('#btnReload').on('click', function () {
      window.location.reload();
    });
    $('#btnPrint').on('click', function () {
      window.print();
    });
  }

  function showCalendar(newDi) {
    di = newDi;
    if (newDi.bYear !== _yearShown) {
      buildCalendar();
    }
    highlightTargetDay();
  }

  function highlightTargetDay() {
    $('.bd.selected').removeClass('selected');
    $('.bm{bMonth} .bd{bDay}'.filledWith(di)).addClass('selected');
  }

  function buildCalendar() {
    _yearShown = di.bYear;

    var html = [];
    for (var bm = 1; bm <= 19; bm++) {

      var monthGroup = [];

      // outer
      monthGroup.push('<div class="mGroup">'.filledWith(bm));

      var bMonthHtml = [];
      var gMonthHtml = [];

      bMonthHtml.push('<div class="bm bm{0}">'.filledWith(bm));
      bMonthHtml.push('<div class=bmName><i>{1}</i>{0}</div>'.filledWith(host.bMonthNameAr[bm], bm));


      gMonthHtml.push('<div class=gm>');
      gMonthHtml.push('<div class=gmInitial></div>');

      for (var bd = 1; bd <= 19; bd++) {

        var gd = holyDays.getGDate(di.bYear, bm, bd, false);
        var gDayOfMonth = gd.getDate();

        var dow = gd.getDay();

        bMonthHtml.push('<div class="bd bd{0} dow{1} mGroup{2}"><b>{0}</b></div>'.filledWith(bd, dow, bm));

        if (gDayOfMonth == 1) {
          var gMonthName = host.gMonthShort[gd.getMonth()];
          gMonthHtml.push('<div class="gd gd1 dow{1}"><i>{0}</i></div>'.filledWith(gMonthName, dow));
        } else {
          gMonthHtml.push('<div class="gd dow{1}{2}{3}"><b>{0}</b></div>'.filledWith(
            gDayOfMonth,
            dow,
            gDayOfMonth == 1 ? ' gd1' : '',
            gDayOfMonth % 2 ? ' gAlt' : ''));
        }
      }

      bMonthHtml.push('</div>');
      gMonthHtml.push('</div>');

      monthGroup.push(bMonthHtml.join(''));
      monthGroup.push(gMonthHtml.join(''));

      monthGroup.push('</div>');

      html.push(monthGroup.join('\n'));
    }

    $('#months').html(html.join('\n'));
  }

  return {
    preparePage: preparePage,
    showCalendar: showCalendar,
    di: di
  };
}

if (top != window) {
  $(function () {
    var cal1 = Cal1();
    cal1.preparePage();
    cal1.showCalendar();
  });
}