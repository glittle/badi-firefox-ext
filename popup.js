/* global getMessage */
/* global di */
/* global chrome */
/* global $ */
var samplesDiv = $('#samples');

samplesDiv.on('click', 'button', copySample);
$('.btnChangeDay').on('click', changeDay);
$('#btnEveOrDay').on('click', toggleEveOrDay);
$('#datePicker').on('change', jumpToDate);

$('#datePicker').on('keydown', function(ev){
  ev.stopPropagation();
});
$(document).on('keydown', keyPressed);

$('.iconArea a').click(function(){
  chrome.tabs.create({active: true, url: this.href });
});

chrome.alarms.onAlarm.addListener(showInfo);

$('#sampleTitle').html(getMessage('pressToCopy'));

var sampleNum = 0;

function showInfo(){

  var dayDetails = [
     {name:getMessage('DayOfWeek'), value: "{bWeekday} - {bWeekdayNameAr} ({bWeekdayMeaning})".filledWith(di)}
   , {name:getMessage('DayOfMonth'), value: "{bDay} - {bDayNameAr} ({bDayMeaning})".filledWith(di)}
   , {name:getMessage('Month'), value: di.bMonth ? "{bMonth} - {bMonthNameAr} ({bMonthMeaning})".filledWith(di) : "{bMonthNameAr} ({bMonthMeaning})".filledWith(di)}
   , {name:getMessage('YearOfVahid'), value: "{bYearInVahid} - {bYearInVahidNameAr} ({bYearInVahidMeaning})".filledWith(di)}
   , {name:getMessage('Vahid'), value: "{bVahid}".filledWith(di)}
   , {name:getMessage('Kullishay'), value: "{bKullishay}".filledWith(di)}
   , {name:getMessage('YearOfEra'), value: "{bYear}".filledWith(di)}
  ];
  
  var explain1 = ('This is the day of {bWeekdayNameAr}, the day of {bDayNameAr},'
    + ' of the month of {bMonthNameAr},'
    + ' of the year {bYearInVahidNameAr},'
    + ' of the {bVahidOrdinalName} Váḥid,'
    + ' of the {bKullishayOrdinalName} Kull-i-<u>Sh</u>ay’.').filledWith(di);

  var explain2 = ('{bMonthNameAr} {bDay}'
     + ' {dayStartedLower} at sunset (about {startingSunsetDesc}) on {frag1WeekdayLong}, {frag1MonthShort} {frag1Day}'
     + ' and {dayEndedLower} at sunset (about {endingSunsetDesc}) on {frag2WeekdayLong}, {frag2MonthShort} {frag2Day}.').filledWith(di);

  // prepare samples
  var samples = [''

    // 3 Jamál 172
    , '{bDay} {bMonthNameAr} {bYear}'.filledWith(di)

    // Jamal 4, 172
    , di.bMonthDayYear

    // Jamal 4, 172 -> 7:55pm
    , '{bMonthDayYear} ⇨ {endingSunsetDesc}'.filledWith(di)

    // 1 Beauty (Jamal) 172 B.E.
    , '{bDay} {bMonthMeaning} ({bMonthNameAr}) {bYear} B.E.'.filledWith(di)
    
    // 1 Jamal (Beauty) 172
    , '{bDay} {bMonthNameAr} ({bMonthMeaning}) {bYear}'.filledWith(di)
    
    // 30 April 2015 / 3 Beauty 172 -- NSA Canada
    , {value:'{frag2Day} {frag2MonthLong} {frag2Year} / {bDay} {bMonthMeaning} {bYear}'.filledWith(di), currentTime:true}

    // 1 May 2015 / 4 Jamál 172  -- Susan Gammage
    , {value:'{frag2Day} {frag2MonthLong} {frag2Year} / {bDay} {bMonthNameAr} {bYear}'.filledWith(di), currentTime:true}


    // 04 Jamal / Glory 172 B.E. (Fri 01 May 2015) -- bahai-readings@bcca.org
    // 05 Jamal / Glory (12th Day of Ridvan) 172 B.E. (Sat 02 May 2015)
    , ('{bDay00} {bMonthNameAr} / {bMonthMeaning} {bYear} {bEraAbbrev}'
       + ' ({currentWeekdayShort} {currentDay00} {currentMonthLong} {currentYear})').filledWith(di)

    
    // 1 Jamál (Beauty) 172 - April 27/28, 2015  -- Calgary Feast report (drop the 1)
    , {value:'{bDay} {bMonthNameAr} ({bMonthMeaning}) {bYear} - {gCombined}'.filledWith(di), currentTime:true}
          
    // Jamál / Bahá, 1st ‘Aẓamat     or [weekday] / [monthday], [day no.] [month] - james@19months.com
    , '{bWeekdayNameAr} / {bDayNameAr}, {bDayOrdinal} {bMonthNameAr} {bYear}'.filledWith(di) 

    // 3 Jamál 172 BE / 30 April 2015 -- Calgary LSA minutes
    , '{bDay} {bMonthNameAr} {bYear} {eraShort} / {currentDay} {currentMonthLong} {currentYear}'.filledWith(di)
    //, {currentTime:true, value: '{bDay} {bMonthNameAr} {bYear} {eraShort} / {currentDay} {currentMonthLong} {currentYear}'.filledWith(di)}
    
    // 172.03.13
    , '{bYear}.{bMonth00}.{bDay00}'.filledWith(di)
  ];
  

  
  
  $('#day').html('{bDay} {bMonthNameAr} {bYear}'.filledWith(di));
  $('#sunset').html(di.nearestSunset);
  $('#place').html(localStorage.locationName);
  $('#gDay').html('{currentDay} {currentMonthShort} {currentYear}'.filledWith(di));

  $('#dayDetails').html('<dl>' + '<dt>{^name}</dt><dd>{^value}</dd>'.filledWithEach(dayDetails) + '</dl>');

  $('#explain').html(explain1);
  $('#explain2').html(explain2);
  
  $('#gDate').html('{currentWeekdayShort}, {currentDay} {currentMonthLong} {currentYear}'.filledWith(di));
  $('#gDateDesc').html('({^currentRelationToSunset})'.filledWith(di));

  $('#datePicker').val(di.currentDateString);

  showUpcoming();
     
  clearSamples();
  var showFootnote = false;
  for (var i = 0; i < samples.length; i++) {
    var sample = samples[i];
    if(sample) {
       if(sample.currentTime){
         showFootnote = true;
       }
       addSample(sample);
    }
  }
  $('#sampleFootnote').toggle(showFootnote);
  
  $('#version').text(getMessage('version').filledWith(chrome.runtime.getManifest().version_name));
}

function showUpcoming(){
  var dayInfos = holyDays.getUpcoming(di, 3);
  var today = moment(di.frag2);
  today.hour(0);
  $('#special').html('').hide();
  
  $.each(dayInfos, function(i, dayInfo){
    var targetDi = getDateInfo(dayInfo.GDate);
    
    if(dayInfo.Type === 'M'){
      dayInfo.A = 'Feast of ' + targetDi.bMonthMeaning;
    }else 
    if(dayInfo.Type.slice(0,1)==='H'){
      dayInfo.A = dayInfo.NameEn;
    }
    if(dayInfo.Special && dayInfo.Special.slice(0,5)==='AYYAM'){
      dayInfo.A = dayInfo.NameEn;
    }
    dayInfo.date = '{bMonthNameAr} {bDay} ({gCombinedMD})'.filledWith(targetDi);

    var sameDay = di.gCombinedMD == targetDi.gCombinedMD;
    var targetMoment = moment(dayInfo.GDate);
    dayInfo.away = determineDaysAway(today, targetMoment, sameDay);

    if(sameDay){
      $('#special').html(dayInfo.A).show();
    }
  });
  
  $('#upcoming').html('<tr class={Type}><td>{away}</td><td>{^A}</td><td>{date}</td></tr>'.filledWithEach(dayInfos));
}

function determineDaysAway(moment1, moment2, sameDay){
  var days = moment2.diff(moment1, 'days');
  if(days===1 && !di.bNow.eve){
    return 'Tonight';
  }
  if(days===-1){
    return 'Ended';
  }
  if(days===0){
    return 'Now';
  }
  return (days===1 ? 'in {0} day' : 'in {0} days').filledWith(days);
}

function keyPressed(ev){
  var key = String.fromCharCode(ev.which) || '';
  switch(ev.which){
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
      try{
        var sample = $('#key' + key);
        if(sample.length){
          sample.trigger('click'); // effective if a used letter is typed
          ev.preventDefault();
        }
      }catch(ex){
        // ignore jquery error
      }
      return;
  }
}

function addSample(info){
  sampleNum++;
  var char = String.fromCharCode(64 + sampleNum);
  
  var sample = {
    value:'',
    currentTime:false,
    char:char
  };
  
  if(typeof info === 'string'){
    sample.value = info;
  }else{
    $.extend(sample, info);
  }
  sample.currentNote = sample.currentTime ? ' *' : '';
  samplesDiv.find('#sampleList')
    .append(('<div><button title="Click button or press {char}."'
    + ' type=button data-char={char} id="key{char}">{char}{currentNote}</button>'
    + ' <span>{^value}</span></div>').filledWith(sample));
}

function clearSamples(){
  sampleNum = 0;
  samplesDiv.find('#sampleList').text('');
}

function copySample(ev){
  var btn = $(ev.target);
  var div = btn.closest('div');
  var text = div.find('span').text();
  $('#sampleCopy').val(text).focus().select();
  document.execCommand('copy');
  
  div.addClass('copied');
  btn.text('Copied!');
  setTimeout(function(){
    div.removeClass('copied');
    btn.text(btn.data('char'));
  }, 1000);
}
function toggleEveOrDay(toEve){
  _targetDate = getCurrentTime();
  toEve = typeof toEve === 'boolean' ? toEve : !di.bNow.eve;
  if(toEve){
    _targetDate.setHours(23,59,0,0);
  }else{
    _targetDate.setHours(12,0,0,0);
  }
  refreshDateInfo();
  showInfo();
}

function jumpToDate(ev){
  var date = moment($(ev.target).val()).toDate();
  if(!isNaN(date)){
    _targetDate = date;
    
    refreshDateInfo();
    showInfo();
  }
}

function changeDay(ev, delta){
  delta = ev ? +$(ev.target).data('delta') : +delta;
  if (delta === 0) {
    _targetDate = null;
 } else{
    _targetDate = getCurrentTime();
    // console.log(delta + ' ' + di.bNow.eve);  

    _targetDate.setDate(_targetDate.getDate() + delta);   

//    if(delta == 1){
//      if(!di.bNow.eve){
//        toggleEveOrDay(true);
//        return;
//      }
//      _targetDate.setDate(_targetDate.getDate() + delta);   
//      toggleEveOrDay(false);
//    }
//
//
//    if(delta == -1){
//      if(di.bNow.eve){
//        toggleEveOrDay(false);
//        return;
//      }
//      _targetDate.setDate(_targetDate.getDate() + delta);   
//      toggleEveOrDay(true);
//    } 
  }
  
  _targetDate = getCurrentTime();

  refreshDateInfo();
  
  if(di.bNow.eve){
    _targetDate.setHours(23,59,0,0);
  }else{
    _targetDate.setHours(12,0,0,0);
  }

  showInfo();

  $('button.today').toggleClass('notToday', di.gCombined !== getStorage('originalDI').gCombined);  
}

refreshDateInfo();
showInfo();
localizeHtml();
