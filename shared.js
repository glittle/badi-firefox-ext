/* Code by Glen Little */
/* global HolyDays */
/* global moment */
var _locationLat = localStorage.lat;
var _locationLong = localStorage.long;
var _targetDate = null;
var holyDays = HolyDays();
var knownDateInfos = {};
var _di = {};
var _initialDi;

// see messages.json for translations and local names
var bYearInVahidNameAr = ",Alif,Bá’,Ab,Dál,Báb,Váv,Abad,Jád,Bahá',Ḥubb,Bahháj,Javáb,Aḥad,Vahháb,Vidád,Badí‘,Bahí,Abhá,Váḥid".split(',');
var bMonthNameAr = "Ayyám-i-Há,Bahá,Jalál,Jamál,`Azamat,Núr,Rahmat,Kalimát,Kamál,Asmá’,`Izzat,Mashíyyat,`Ilm,Qudrat,Qawl,Masá'il,Sharaf,Sultán,Mulk,`Alá’".split(',');
var bWeekdayNameAr = ",Jalál,Jamál,Kamál,Fiḍál,‘Idál,Istijlál,Istiqlál".split(','); // from Saturday

var bYearInVahidMeaning = getMessage("bYearInVahidMeaning").split(',');
var bMonthMeaning = getMessage("bMonthMeaning").split(',');
var bWeekdayMeaning = getMessage("bWeekdayMeaning").split(',');

var gWeekdayLong = getMessage("gWeekdayLong").split(',');
var gWeekdayShort = getMessage("gWeekdayShort").split(',');
var gMonthLong = getMessage("gMonthLong").split(',');
var gMonthShort = getMessage("gMonthShort").split(',');

var ordinal = getMessage('ordinal').split(',');
var ordinalNames = getMessage('ordinalNames').split(',');
var elements = getMessage('elements').split(',');

var use24HourClock = getMessage('use24HourClock') == 'true';

function refreshDateInfo() {
  return _di = getDateInfo(getCurrentTime());
}


function getDateInfo(currentTime, skipUpcoming) {
  // hard code limits
  var minDate = new Date(1844, 2, 21, 0, 0, 0, 0);
  if (currentTime < minDate) {
    currentTime = minDate;
  } else {
    var maxDate = new Date(2844, 2, 20, 0, 0, 0, 0);
    if (currentTime > maxDate) {
      currentTime = maxDate;
    }
  }

  var known = knownDateInfos[currentTime];
  if (known) {
    return known;
  }

  var bNow = holyDays.getBDate(currentTime);
  // split the Baha'i day to be "Eve" - sunset to midnight; 
  // and "Morn" - from midnight through to sunset
  var frag1Noon = new Date(currentTime.getTime());
  frag1Noon.setHours(12, 0, 0, 0);
  if (!bNow.eve) {
    // if not already frag1, make it so
    frag1Noon.setDate(frag1Noon.getDate() - 1);
  }
  var frag2Noon = new Date(frag1Noon.getTime());
  frag2Noon.setDate(frag2Noon.getDate() + 1);

  var frag1SunTimes = sunCalculator.getTimes(frag1Noon, _locationLat, _locationLong);
  var frag2SunTimes = sunCalculator.getTimes(frag2Noon, _locationLat, _locationLong);

  var di = { // date info
    frag1: frag1Noon,
    frag1Year: frag1Noon.getFullYear(),
    frag1Month: frag1Noon.getMonth(),
    frag1Day: frag1Noon.getDate(),
    frag1Weekday: frag1Noon.getDay(),

    frag2: frag2Noon,
    frag2Year: frag2Noon.getFullYear(),
    frag2Month: frag2Noon.getMonth(), // 0 based
    frag2Day: frag2Noon.getDate(),
    frag2Weekday: frag2Noon.getDay(),

    currentYear: currentTime.getFullYear(),
    currentMonth: currentTime.getMonth(), // 0 based
    currentMonth1: 1 + currentTime.getMonth(),
    currentDay: currentTime.getDate(),
    currentDay00: digitPad2(currentTime.getDate()),
    currentWeekday: currentTime.getDay(),
    currentTime: currentTime,

    startingSunsetDesc12: frag1SunTimes.sunset.showTime(),
    startingSunsetDesc24: frag1SunTimes.sunset.showTime(24),
    endingSunsetDesc12: frag2SunTimes.sunset.showTime(),
    endingSunsetDesc24: frag2SunTimes.sunset.showTime(24),
    frag1SunTimes: frag1SunTimes,
    frag2SunTimes: frag2SunTimes,

    bNow: bNow,
    bDay: bNow.d,
    bWeekday: 1 + (frag2Noon.getDay() + 1) % 7,
    bMonth: bNow.m,
    bYear: bNow.y,
    bVahid: Math.floor(1 + (bNow.y - 1) / 19),

    bDayNameAr: bMonthNameAr[bNow.d],
    bDayMeaning: bMonthMeaning[bNow.d],
    bMonthNameAr: bMonthNameAr[bNow.m],
    bMonthMeaning: bMonthMeaning[bNow.m],

    bEraLong: getMessage('eraLong'),
    bEraAbbrev: getMessage('eraAbbrev'),
    bEraShort: getMessage('eraShort')
  };

  di.bKullishay = Math.floor(1 + (di.bVahid - 1) / 19);
  di.bVahid = di.bVahid - (di.bKullishay - 1) * 19;
  di.bYearInVahid = di.bYear - (di.bVahid - 1) * 19 - (di.bKullishay - 1) * 19 * 19;
  di.bYearInVahidNameAr = bYearInVahidNameAr[di.bYearInVahid];
  di.bYearInVahidMeaning = bYearInVahidMeaning[di.bYearInVahid];
  di.bWeekdayNameAr = bWeekdayNameAr[di.bWeekday];
  di.bWeekdayMeaning = bWeekdayMeaning[di.bWeekday];

  di.element = elements[getElementNum(bNow.m) - 1];

  di.bDayOrdinal = di.bDay + getOrdinal(di.bDay);
  di.bVahidOrdinal = di.bVahid + getOrdinal(di.bVahid);
  di.bKullishayOrdinal = di.bKullishay + getOrdinal(di.bKullishay);
  di.bDayOrdinalName = getOrdinalName(di.bDay);
  di.bVahidOrdinalName = getOrdinalName(di.bVahid);
  di.bKullishayOrdinalName = getOrdinalName(di.bKullishay);

  di.bDay00 = digitPad2(di.bDay);
  di.frag1Day00 = digitPad2(di.frag1Day);
  di.currentMonth01 = digitPad2(di.currentMonth1);
  di.frag2Day00 = digitPad2(di.frag2Day);
  di.bMonth00 = digitPad2(di.bMonth);
  di.bYearInVahid00 = digitPad2(di.bYearInVahid);
  di.bVahid00 = digitPad2(di.bVahid);

  di.startingSunsetDesc = use24HourClock ? di.startingSunsetDesc24 : di.startingSunsetDesc12;
  di.endingSunsetDesc = use24HourClock ? di.endingSunsetDesc24 : di.endingSunsetDesc12;

  di.frag1MonthLong = gMonthLong[di.frag1Month];
  di.frag1MonthShort = gMonthShort[di.frag1Month];
  di.frag1WeekdayLong = gWeekdayLong[di.frag1Weekday];
  di.frag1WeekdayShort = gWeekdayShort[di.frag1Weekday];

  di.frag2MonthLong = gMonthLong[di.frag2Month];
  di.frag2MonthShort = gMonthShort[di.frag2Month];
  di.frag2WeekdayLong = gWeekdayLong[di.frag2Weekday];
  di.frag2WeekdayShort = gWeekdayShort[di.frag2Weekday];

  di.currentMonthLong = gMonthLong[di.currentMonth];
  di.currentMonthShort = gMonthShort[di.currentMonth];
  di.currentWeekdayLong = gWeekdayLong[di.currentWeekday];
  di.currentWeekdayShort = gWeekdayShort[di.currentWeekday];
  di.currentDateString = moment(di.currentTime).format('YYYY-MM-DD');


  di.currentRelationToSunset = getMessage(bNow.eve ? 'afterSunset' : 'beforeSunset');
  var thisMoment = new Date().getTime();
  di.dayStarted = getMessage(thisMoment > di.frag1SunTimes.sunset.getTime() ? 'dayStartedPast' : 'dayStartedFuture');
  di.dayEnded = getMessage(thisMoment > di.frag2SunTimes.sunset.getTime() ? 'dayEndedPast' : 'dayEndedFuture');
  di.dayStartedLower = di.dayStarted.toLocaleLowerCase();
  di.dayEndedLower = di.dayEnded.toLocaleLowerCase();

  di.bMonthDayYear = getMessage('gMonthDayYear', di);

  if (di.frag1Year != di.frag2Year) {
    // Dec 31/Jan 1
    // Dec 31, 2015/Jan 1, 2015
    di.gCombined = getMessage('gCombined_3', di);
    di.gCombinedY = getMessage('gCombinedY_3', di);
  } else
    if (di.frag1Month != di.frag2Month) {
      // Mar 31/Apr 1
      // Mar 31/Apr 1, 2015
      di.gCombined = getMessage('gCombined_2', di);
      di.gCombinedY = getMessage('gCombinedY_2', di);
    } else {
      // Jul 12/13
      // Jul 12/13, 2015
      di.gCombined = getMessage('gCombined_1', di);
      di.gCombinedY = getMessage('gCombinedY_1', di);
    }
  di.nearestSunset = getMessage(bNow.eve ? "nearestSunsetEve" : "nearestSunsetDay", di);

  di.stamp = JSON.stringify(di.bNow);// used to compare to other dates and for developer reference 
  di.stampDay = '{y}.{m}.{d}'.filledWith(di.bNow); // ignore eve/day

  if (!skipUpcoming) {
    getUpcoming(di);
  }

  knownDateInfos[currentTime] = di;

  return di;
}

function getElementNum(monthNum) {
  // the Bab's designations, found in 'https://books.google.ca/books?id=XTfoaK15t64C&pg=PA394&lpg=PA394&dq=get+of+the+heart+nader+bab&source=bl&ots=vyF-pWLAr8&sig=ruiuoE48sGWWgaB_AFKcSfkHvqw&hl=en&sa=X&ei=hbp0VfGwIon6oQSTk4Mg&ved=0CDAQ6AEwAw#v=snippet&q=%22air%20of%20eternity%22&f=false'

  //  1, 2, 3
  //  4, 5, 6, 7
  //  8, 9,10,11,12,13
  // 14,15,16,17,18,19
  if (monthNum >= 4 && monthNum <= 7) {
    return 2;
  } else if (monthNum >= 8 && monthNum <= 13) {
    return 3;
  } else if (monthNum >= 14 && monthNum <= 19) {
    return 4;
  }
  return 1;
}

function showIcon(dateInfo) {
  var tipLines = [];
  tipLines.push(getMessage('formatIconToolTip', dateInfo));

  if (dateInfo.special1) {
    tipLines.push(dateInfo.special1);
    if (dateInfo.special2) {
      tipLines.push(dateInfo.special2);
    }
  }

  tipLines.push(dateInfo.nearestSunset);
  tipLines.push('');
  tipLines.push(getMessage('formatIconClick'));

  chrome.browserAction.setTitle({ title: tipLines.join('\n') });
  chrome.browserAction.setIcon({
    imageData: draw(dateInfo.bMonthNameAr, dateInfo.bDay, 'center')
  });
  //  chrome.browserAction.setBadgeBackgroundColor({color: bNow.eve ? '#ddd' : '#aaa'});
}

function draw(line1, line2, line2Alignment) {
  var canvas = document.createElement('canvas');
  canvas.width = 19;
  canvas.height = 19;

  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  //context.strokeRect(0, 0, canvas.width, canvas.height);

  context.font = "9px Tahoma";
  context.fillText(line1, 0, 7);

  context.font = "11px Tahoma";
  context.textAlign = line2Alignment;
  var x = 0;
  switch (line2Alignment) {
    case 'center':
      x = 10;
      break;
    case 'end':
      x = 19;
      break;
  }
  context.fillText(line2, x, 19);

  return context.getImageData(0, 0, 19, 19);
}

function registerHandlers() {
  // geo
  var positionOptions = {
    enableHighAccuracy: false,
    maximumAge: Infinity,
    timeout: 10000
  };
  navigator.geolocation.watchPosition(setLocation, noLocation, positionOptions); // this triggers immediately
}



function getUpcoming(di) {
  if (di.upcomingHtml) {
    return; // already done 
  }
  var dayInfos = holyDays.getUpcoming(di, 3);
  var today = moment(di.frag2);
  today.hour(0);
  di.special1 = null;
  di.special2 = null;

  dayInfos.forEach(function (dayInfo, i) {
    var targetDi = getDateInfo(dayInfo.GDate, true);
    if (dayInfo.Type === 'M') {
      dayInfo.A = getMessage('FeastOf').filledWith(targetDi.bMonthMeaning);
    } else
      if (dayInfo.Type.slice(0, 1) === 'H') {
        dayInfo.A = getMessage(dayInfo.NameEn);
      }
    if (dayInfo.Special && dayInfo.Special.slice(0, 5) === 'AYYAM') {
      dayInfo.A = getMessage(dayInfo.NameEn);
    }
    dayInfo.date = getMessage('upcomingDateFormat', targetDi);

    var sameDay = di.stampDay == targetDi.stampDay;
    var targetMoment = moment(dayInfo.GDate);
    dayInfo.away = determineDaysAway(di, today, targetMoment, sameDay);

    if (sameDay) {
      if (!di.special1) {
        di.special1 = dayInfo.A;
      } else {
        di.special2 = dayInfo.A;
      }
    }
  });

  di.upcomingHtml = '<tr class={Type}><td>{away}</td><td>{^A}</td><td>{^date}</td></tr>'.filledWithEach(dayInfos);
}

function determineDaysAway(di, moment1, moment2, sameDay) {
  var days = moment2.diff(moment1, 'days');
  if (days === 1 && !di.bNow.eve) {
    return getMessage('Tonight');
  }
  if (days === -1) {
    return getMessage('Ended');
  }
  if (days === 0) {
    return getMessage('Now');
  }
  return getMessage(days === 1 ? '1day' : 'otherDays').filledWith(days);
}









var findName = function (typeName, results, getLastMatch) {
  var match = null;
  for (var r = 0; r < results.length; r++) {
    var result = results[r];
    if (result.types.indexOf(typeName) != -1) {
      match = result.formatted_address;
      if (!getLastMatch) return match;
    }
  }
  return match;
};


function startGetLocationName() {
  var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng={0},{1}&language={2}'.filledWith(localStorage.lat, localStorage.long, chrome.runtime.getManifest().current_locale);
  console.log('getting');
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      var data = JSON.parse(xhr.responseText);
      localStorage.locationName =
               findName('neighborhood', data.results, true)
               || findName('locality', data.results)
               || findName('political', data.results)
               || getMessage('noLocationName');

      setStorage('locationNameKnown', true);
      console.log(localStorage.locationName);

      // if popup is showing...
      if (typeof showLocation !== 'undefined') {
        showLocation();
      }
    }
  }
  xhr.send();
}

function setLocation(position) {
  localStorage.lat = _locationLat = position.coords.latitude;
  localStorage.long = _locationLong = position.coords.longitude;
  knownDateInfos = {};

  setStorage('locationKnown', true);
  setStorage('locationNameKnown', false);
  localStorage.locationName = getMessage('browserActionTitle'); // temp until we get it

  startGetLocationName();

  refreshDateInfoAndShow();
}
function noLocation(err) {
  localStorage.lat = _locationLat = 0;
  localStorage.long = _locationLong = 0;
  knownDateInfos = {};

  console.error(err);

  setStorage('locationKnown', false);
  localStorage.locationName = getMessage('noLocationAvailable');

  refreshDateInfoAndShow();
}

function refreshDateInfoAndShow() {
  var di = refreshDateInfo();
  setStorage('originalStamp', di.stamp);

  showIcon(di);
  if (typeof showInfo !== 'undefined') {
    showInfo(di);
  }

  setAlarmForNextUpdate(di.currentTime, di.frag2SunTimes.sunset, di.bNow.eve);
}

function setAlarmForNextUpdate(currentTime, sunset, inEvening) {
  if (inEvening) {
    // in eve, after sunset, so update after midnight
    var midnight = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate() + 1).getTime();
    chrome.alarms.create('midnight', { when: midnight + 1000 }); // to be safe, set at least 1 second after midnight 
  } else {
    // in the day, so update at the sunset
    chrome.alarms.create('sunset', { when: sunset.getTime() }); 
  }

  //chrome.alarms.create('test', {delayInMinutes: 1}); 

  // debug - show alarm that was set
  chrome.alarms.getAll(function (alarms) {
    for (var i = 0; i < alarms.length; i++) {
      var alarm = alarms[i];
      console.log(getMessage('nextRefreshAlarm').filledWith(alarm.name, new Date(alarm.scheduledTime)));
    }
  });
}




// based on code by Sunwapta Solutions Inc.
var ObjectConstant = '$****$';

function setStorage(key, value) {
  /// <summary>Save this value in the browser's local storage. Dates do NOT get returned as full dates!</summary>
  /// <param name="key" type="string">The key to use</param>
  /// <param name="value" type="string">The value to store. Can be a simple or complex object.</param>
  if (typeof value === 'object' || typeof value === 'boolean') {
    var strObj = JSON.stringify(value);
    value = ObjectConstant + strObj;
  }

  localStorage[key] = value + "";
}



function getStorage(key, defaultValue) {
  /// <summary>Get a value from storage.</summary>
  var checkForObject = function (obj) {
    if (obj.substring(0, ObjectConstant.length) == ObjectConstant) {
      obj = $.parseJSON(obj.substring(ObjectConstant.length));
    }
    return obj;
  };

  var value = localStorage[key];
  if (typeof value !== 'undefined' && value != null) {
    return checkForObject(value);
  }
  return defaultValue;
}

String.prototype.filledWith = function () {
  /// <summary>Similar to C# String.Format...  in two modes:
  /// 1) Replaces {0},{1},{2}... in the string with values from the list of arguments. 
  /// 2) If the first and only parameter is an object, replaces {xyz}... (only names allowed) in the string with the properties of that object. 
  /// Notes: the { } symbols cannot be escaped and should only be used for replacement target tokens;  only a single pass is done. 
  /// </summary>

  var values = typeof arguments[0] === 'object' && arguments.length === 1 ? arguments[0] : arguments;

  var testForFunc = /^#/; // simple test for "#"
  var testForElementAttribute = /^\*/; // simple test for "#"
  var testDoNotEscapeHtml = /^\^/; // simple test for "^"
  var testDoNotEscpaeHtmlButToken = /^-/; // simple test for "-"
  var testDoNotEscpaeHtmlButSinglQuote = /^\>/; // simple test for ">"

  var extractTokens = /{([^{]+?)}/g;

  var replaceTokens = function (input) {
    return input.replace(extractTokens, function () {
      var token = arguments[1];
      var value = undefined;
      try {
        if (token[0] === ' ') {
          // if first character is a space, do not process
          value = '{' + token + '}';
        }
        else if (values === null) {
          value = '';
        }
        else if (testForFunc.test(token)) {
          try {
            value = eval(token.substring(1));
          }
          catch (e) {
            // if the token cannot be executed, then pass it through intact
            value = '{' + token + '}';
          }
        }
        else if (testForElementAttribute.test(token)) {
          value = quoteattr(values[token.substring(1)]);
        }
        else if (testDoNotEscpaeHtmlButToken.test(token)) {
          value = values[token.substring(1)].replace(/{/g, '&#123;');
        }
        else if (testDoNotEscpaeHtmlButSinglQuote.test(token)) {
          value = values[token.substring(1)].replace(/'/g, "%27");
        }
        else if (testDoNotEscapeHtml.test(token)) {
          value = values[token.substring(1)];
        }
        else {
          var toEscape = values[token];
          value = typeof toEscape == 'undefined' || toEscape === null ? '' : ('' + toEscape).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/{/g, '&#123;');
        }
      }

      catch (err) {
        console.log('filledWithError:\n' + err + '\ntoken:' + token + '\nvalue:' + value + '\ntemplate:' + input + '\nall values:\n');
        console.log(values);
        throw 'Error in Filled With';
      }
      return (typeof value == 'undefined' || value == null ? '' : ('' + value));
    });
  };

  var result = replaceTokens(this);

  var lastResult = '';
  while (lastResult != result) {
    lastResult = result;
    result = replaceTokens(result);
  }

  return result;
};

function quoteattr(s, preserveCr) {
  preserveCr = preserveCr ? '&#13;' : '\n';
  return ('' + s) /* Forces the conversion to string. */
      .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
      .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      /*
      You may add other replacements here for HTML only 
      (but it's not necessary).
      Or for XML, only if the named entities are defined in its DTD.
      */
      .replace(/\r\n/g, preserveCr) /* Must be before the next replacement. */
      .replace(/[\r\n]/g, preserveCr);
}


String.prototype.filledWithEach = function (arr) {
  /// <summary>Silimar to 'filledWith', but repeats the fill for each item in the array. Returns a single string with the results.
  /// </summary>
  if (arr === undefined || arr === null) {
    return '';
  }
  var result = [];
  for (var i = 0, max = arr.length; i < max; i++) {
    result[result.length] = this.filledWith(arr[i]);
  }
  return result.join('');
};

function getMessage(key, obj, defaultValue) {
  var rawMsg = chrome.i18n.getMessage(key);
  var msg = rawMsg || defaultValue || '{' + key + '}';
  return typeof obj === 'undefined' ? msg : msg.filledWith(obj);
}

function digitPad2(num) {
  return ('00' + num).slice(-2);
}

function getOrdinal(num) {
  return ordinal[num] || ordinal[0];
}
function getOrdinalName(num) {
  return ordinalNames[num];
}

function getCurrentTime() {
  if (_targetDate) {
    return _targetDate;
  }
  return new Date();
}

function localizeHtml(host) {
  // parse data-msg...  target:value,target,target,target:value
  // if no value given in one pair, use the element's ID
  var accessKeyList = [];
  $(host || document).find('[data-msg]').each(function (domNum, dom) {
    var el = $(dom);
    var info = el.data('msg');
    var accessKeyFor = null;
    var text = '';
    var parts = info.split(',');
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      var detail = part.split(':');
      var target, value = '';
      if (detail.length === 1) {
        var key = detail[0];
        var key2 = key === '_id_' ? el.attr('id') : key;
        target = 'html';
        value = getMessage(key2);
      }
      if (detail.length === 2) {
        if (detail[0] == 'extractAccessKeyFor') {
          accessKeyFor = detail[1];
          continue;
        }
        target = detail[0];
        value = getMessage(detail[1]);
      }
      if (target === 'html') {
        el.html(value);
        text = value;
      }
      else if (target === 'text') {
        el.text(value);
      }
      else {
        el.attr(target, value);
      }
    }
    if (accessKeyFor) {
      var accessKey = $('<div/>').html(text).find('u').text().substring(0, 1);
      if (accessKey) {
        accessKeyList.push({
          id: accessKeyFor,
          key: accessKey
        });
      }
    }
  });
  // apply after all done
  for (var a = 0; a < accessKeyList.length; a++) {
    var item = accessKeyList[a];
    $('#' + item.id).attr('accesskey', item.key);
  }
}


function installed(info) {
    if (info.reason == 'update') {
        var newVersion = chrome.runtime.getManifest().version_name;
        var oldVersion = localStorage.updateVersion;
        console.log(oldVersion + ' --> ' + newVersion);
        if (newVersion != oldVersion) {
            localStorage.updateVersion = newVersion;
            chrome.tabs.create({
                url: 'https://sites.google.com/site/badicalendartools/home/chrome-extension/history#' + chrome.i18n.getMessage('@@ui_locale')
            });
        }
    } else {
      console.log(info);
    }
}


// google analytics
function prepareAnalytics() {
  if (typeof tracker !== 'undefined') {
    var service = analytics.getService('BadiCal');
    service.getConfig().addCallback(initAnalyticsConfig);
    tracker = service.getTracker('UA-1312528-10');
    tracker.set('appVersion', chrome.runtime.getManifest().version_name);
    tracker.set('language', navigator.language);

  }
}
function initAnalyticsConfig(config) {
  var preferredLanguages = navigator.languages ? navigator.languages.slice(0, 2).join(',') : '';

  tracker.sendEvent('opened', preferredLanguages);

  //var d = analytics.EventBuilder.builder().dimension(1, preferredLanguages)
  //tracker.send(d);
}
