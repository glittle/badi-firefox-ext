/* global setStorage */
/* global di */
/* global chrome */

function refreshDateInfoAndShow(){
  refreshDateInfo();
  showIcon();
  
  setStorage('originalDI', di);
  
  //TODO: if popup is open, need to refresh it

  setAlarmForNextUpdate(di.currentTime, di.frag2SunTimes.sunset, di.bNow.eve);
}

function showIcon(){
  var tipLines = [
    '{bDay} {bMonthNameAr} {bYear}'.filledWith(di),
    di.nearestSunset,
    '',
    '(click for more details)'
  ];
  chrome.browserAction.setTitle({title: tipLines.join('\n')})
  chrome.browserAction.setIcon({
      imageData: draw(di.bMonthNameAr, di.bDay, 'center')
    });
  //  chrome.browserAction.setBadgeBackgroundColor({color: bNow.eve ? '#ddd' : '#aaa'});

}

function setAlarmForNextUpdate(currentTime, sunset, inEvening){
   if(inEvening){
     // in eve, after sunset, so update after midnight
     var midnight = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate() + 1).getTime();
     chrome.alarms.create('midnight', {when: midnight + 1000}); // to be safe, set at least 1 second after midnight 
   }else{
     // in the day, so update at the sunset
     chrome.alarms.create('sunset', {when: sunset.getTime() + 1000}); // at least 1 second after sunset 
   }

   //chrome.alarms.create('test', {delayInMinutes: 1}); 

   // debug - show alarm that was set
   chrome.alarms.getAll(function(alarms){
     for (var i = 0; i < alarms.length; i++) {
       var alarm = alarms[i];
       console.log('Alarm at ' + alarm.name + ': ' + new Date(alarm.scheduledTime));
     }
   });
}

function draw(line1, line2, line2align) {
  var canvas = document.createElement('canvas');
  canvas.width = 19;
  canvas.height = 19;
  
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  //context.strokeRect(0, 0, canvas.width, canvas.height);
  
  context.font="9px Tahoma";
  context.fillText(line1,0,7);
  
  context.font="11px Tahoma";
  context.textAlign = line2align;
  var x = 0;
  switch(line2align){
    case 'center': 
	  x = 10;
	  break;
	case 'end':
	  x = 19;
	  break;
  }
  context.fillText(line2,x,19);
  
  return context.getImageData(0, 0, 19, 19);
}

function startGetLocationName(){
    if (!_locationLat || !_locationLong) {
	    localStorage.locationName = '?';
      return;
    }
    
    var findName = function(type, results){
      for (var r = 0; r < results.length; r++) {
        var result = results[r];
        if(result.types.indexOf(type) != -1){
          return result.formatted_address;
        }
      } 
      return null;
    };

    var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + _locationLat + ',' + _locationLong

	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
      // JSON.parse does not evaluate the attacker's scripts.
      var data = JSON.parse(xhr.responseText);
      localStorage.locationName = //findName('neighborhood', data.results) ||
               findName('political', data.results)
               || findName('locality', data.results);
      
//      var components = data.results[0].address_components;
//      for (var i = 0; i < components.length; i++) {
//        var component = components[i];
//        console.log(component);
//        if (component.types.indexOf('political') != -1) { //$.inArray('political', component.types)!=-1 && 
//          localStorage.locationName = component.short_name;
//          break;
//        }
//      }
		  refreshDateInfoAndShow();
	  }
	}
	xhr.send();
}

function setLocation(position){
  localStorage.lat = _locationLat = position.coords.latitude;
  localStorage.long = _locationLong = position.coords.longitude;
  startGetLocationName();  
}
function noLocation(err){
  console.error(err);
}

function registerHandlers(){

  //chrome.runtime.onSuspend.addListener(function(){ console.log('suspending'); });
  
  // geo
  var positionOptions = {
	  enableHighAccuracy: false, 
	  maximumAge        : 300000, 
	  timeout           : 27000
	};
  navigator.geolocation.watchPosition(setLocation, noLocation, positionOptions); // this triggers immediately
  chrome.alarms.onAlarm.addListener(refreshDateInfoAndShow);
}

function prepare(){
  chrome.alarms.clearAll();
  localStorage.clear(); 

  registerHandlers();
}

prepare();