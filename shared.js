/* global HolyDays */
/* global moment */
var _locationLat = localStorage.lat;
var _locationLong = localStorage.long;
var _targetDate = null;
var holyDays = HolyDays();
var di = {};

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


function refreshDateInfo(){
  di = getDateInfo(getCurrentTime());
}

function getDateInfo(currentTime){
  var bNow = holyDays.getBDate(currentTime);
  // split the Baha'i day to be "Eve" - sunset to midnight; 
  // and "Morn" - from midnight through to sunset
  var frag1Noon = new Date(currentTime.getTime());
  frag1Noon.setHours(12,0,0,0);
  if(!bNow.eve){
    // if not already frag1, make it so
    frag1Noon.setDate(frag1Noon.getDate() - 1);
  }
  var frag2Noon = new Date(frag1Noon.getTime());
  frag2Noon.setDate(frag2Noon.getDate() + 1);
  
  var frag1SunTimes = SunCalc.getTimes(frag1Noon, _locationLat, _locationLong);
  var frag2SunTimes = SunCalc.getTimes(frag2Noon, _locationLat, _locationLong);

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
    currentDay: currentTime.getDate(),
    currentDay00: digitPad2(currentTime.getDate()),
    currentWeekday: currentTime.getDay(),
    currentTime: currentTime,
    
    startingSunsetDesc: frag1SunTimes.sunset.showTime(),
    endingSunsetDesc: frag2SunTimes.sunset.showTime(),
    frag1SunTimes: frag1SunTimes,
    frag2SunTimes: frag2SunTimes,
    
    bNow: bNow,
    bDay: bNow.d,
    bWeekday: 1 + (frag2Noon.getDay() + 1) % 7,
    bMonth: bNow.m,
    bYear: bNow.y,
    bVahid: Math.floor(1 + (bNow.y - 1) / 19),
    bKullishay: 1,
    
    bDayNameAr: bMonthNameAr[bNow.d],
    bDayMeaning: bMonthMeaning[bNow.d],
    bMonthNameAr: bMonthNameAr[bNow.m],
    bMonthMeaning: bMonthMeaning[bNow.m],
    
    bEraLong: getMessage('eraLong'),
    bEraAbbrev: getMessage('eraAbbrev'),
    bEraShort: getMessage('eraShort'),
  };
  
  di.bYearInVahid = di.bYear - (di.bVahid - 1) * 19;
  di.bYearInVahidNameAr = bYearInVahidNameAr[di.bYearInVahid];
  di.bYearInVahidMeaning = bYearInVahidMeaning[di.bYearInVahid];
  di.bWeekdayNameAr = bWeekdayNameAr[di.bWeekday];
  di.bWeekdayMeaning = bWeekdayMeaning[di.bWeekday];

  di.bDayOrdinal = di.bDay + getOrdinal(di.bDay);
  di.bVahidOrdinal = di.bVahid + getOrdinal(di.bVahid);
  di.bKullishayOrdinal = di.bKullishay + getOrdinal(di.bKullishay);
  di.bDayOrdinalName = getOrdinalName(di.bDay);
  di.bVahidOrdinalName = getOrdinalName(di.bVahid);
  di.bKullishayOrdinalName = getOrdinalName(di.bKullishay);

  di.bDay00 = digitPad2(di.bDay);
  di.frag1Day00 = digitPad2(di.frag1Day),
  di.frag2Day00 = digitPad2(di.frag2Day),
  di.bMonth00 = digitPad2(di.bMonth);
    
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

  di.bMonthDayYear = '{bMonthNameAr} {bDay}, {bYear}'.filledWith(di);
  
  if (di.frag1Year != di.frag2Year) {
    // Jul 31/Aug 1
    di.gCombined = '{frag1MonthShort} {frag1Day}, {frag1Year}/{frag2MonthShort} {frag2Day}, {frag2Year}'.filledWith(di);
    di.gCombinedMD = '{frag1MonthShort} {frag1Day}/{frag2MonthShort} {frag2Day}'.filledWith(di);
  } else if (di.frag1Month != di.frag2Month) {
    // Jul 31/Aug 1
    di.gCombined = '{frag1MonthShort} {frag1Day}/{frag2MonthShort} {frag2Day}, {frag2Year}'.filledWith(di);
    di.gCombinedMD = '{frag1MonthShort} {frag1Day}/{frag2MonthShort} {frag2Day}'.filledWith(di);
  } else {
    // Jul 12/13
    di.gCombined = '{frag2MonthShort} {frag1Day}/{frag2Day}, {frag2Year}'.filledWith(di);
    di.gCombinedMD = '{frag1MonthShort} {frag1Day}/{frag2Day}'.filledWith(di);
  }
  di.nearestSunset = bNow.eve 
      ? "{dayStarted} with sunset at {startingSunsetDesc}".filledWith(di)
      : "{dayEnded} with sunset at {endingSunsetDesc}".filledWith(di);
  
  return di;
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

function quoteattr(s, preserveCR) {
  preserveCR = preserveCR ? '&#13;' : '\n';
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
      .replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
      .replace(/[\r\n]/g, preserveCR);
  ;
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

function getMessage(key){
  return  chrome.i18n.getMessage(key);
}

function digitPad2(num){
  return ('00' + num).slice(-2);
}

function getOrdinal(num){
  return ordinal[num] || ordinal[0];
}
function getOrdinalName(num){
  return ordinalNames[num];
}

function getCurrentTime(){
  if(_targetDate){
    return _targetDate;
  }
  return new Date();
}
function text(key){
  document.write(getMessage(key));
}

function localizeHtml(){
  // parse data-msg...  target:value,target,target,target:value
  // if no value given in one pair, use the element's ID
  $('[data-msg]').each(function(domNum, dom){
    var el = $(dom);
    var info = el.data('msg');
    var parts = info.split(',');
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      var detail = part.split(':');
      var target, value;
      if (detail.length===1) { 
        var key = detail[0];
        var key2 = key === '_id_' ? el.attr('id') : key; 
        target = 'html';
        value = getMessage(key2);
      }
      if(detail.length===2){
        target = detail[0];
        value = getMessage(detail[1]);
      }
      if(target==='html'){
        el.html(value);
      } 
      else if(target==='text'){
        el.text(value);
      }
      else{
        el.attr(target, value);
      }
    }
  });
}
