window.owmAPIkey = "65b3dc1574aadec85e6638331e30b380"; // dluciv@gmail.com
window.exports = {};

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;


window.weather = "";

var _units = {
  "градус" : ["градуса", "градусов"],
  "метр" : ["метра", "метров"],
  "миллиметр" : ["миллиметра", "миллиметров"],
  "процент": ["процента", "процентов"],
};

for(var u in _units)
  if(_units.hasOwnProperty(u))
     _units[u].unshift(u);


function declinateUnit(value, unit){
  var a = _units[unit];
  if(value < 0)
    value = -value;
  var lastdigit = value % 10;
  var lasttwodigits = value % 100;
  if(lasttwodigits >= 10 && lasttwodigits <= 20)
    lastdigit = 5;

  switch(lastdigit){
    case 0:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
      return a[2];
    case 1:
      return a[0];
    case 2:
    case 3:
    case 4:
      return a[1];
  }
}

$(document).ready(function() {
  var lat, lon, api_url;

  var getweather = function(req, where) {
    $.ajax({
      url: api_url,
      method: 'GET',
      success: function(data) {

        var tempr = Math.round(data.main.temp);
        var wind = Math.round(data.wind.speed);
        var vis = data.visibility;
        var hum = Math.round(data.main.humidity);
        var prs = Math.round(0.750062 * data.main.pressure);

        window.weather =
          "Температура " + where +
          " — "          + tempr + ' ' + declinateUnit(tempr, "градус"   ) + '. ' +
          "Ветер — "     + wind  + ' ' + declinateUnit(wind,  "метр"     ) + ' в секунду. ' +
          "Влажность — " + hum   + "%. " +
          "Давление — "  + prs   + ' ' + declinateUnit(prs,   "миллиметр") + ' ртутного столба. ';

        console.log(window.weather);
      }
    });
  }

  if (false && "geolocation" in navigator) { // to slow on mobiles...

    navigator.geolocation.getCurrentPosition(gotLocation);

    var gotLocation = function(position) {
      lat = position.coords.latitude;
      lon = position.coords.longitude;

      api_url = 'http://api.openweathermap.org/data/2.5/weather?lat=' +
        lat + '&lon=' +
        lon + '&units=metric&appid=' + window.owmAPIkey;
      // http://api.openweathermap.org/data/2.5/weather?q=London,uk&callback=test&appid=b1b15e88fa79722

      getweather(api_url, "за бортом");
    }
  } else {
    // alert('Your browser doesnt support geolocation. Sorry.');
      // var api_url = 'http://api.openweathermap.org/data/2.5/weather?lat=60.439803&lon=30.097812&units=metric&appid=' + window.owmAPIkey;
      api_url = 'https://api.openweathermap.org/data/2.5/weather?id=498817&units=metric&appid=' + window.owmAPIkey;

      getweather(api_url, "в И́нгрии");
  }

});

function speaksmth(text) {
  var synth = window.speechSynthesis;
  // var voices = synth.getVoices();

  var utterThis = new SpeechSynthesisUtterance(text);
  utterThis.rate = 1.1;
  utterThis.pitch = 1.5;
  utterThis.lang = 'ru-RU';
  // utterThis.voice = voices[0];

  synth.speak(utterThis);
};

var seals_ok = "Ситуация с тюленями спокойная.";
var seals_not_ok = "Ситуация с тюленями угрожающая.";
window.seals = seals_ok;
window.seals_full = seals_ok;
var seals_url = 'https://matrix.dluciv.name/vksealrescuerss';

var getSealStatus = function(callback) {
		$.ajax({
				method: 'GET',
				url: seals_url,
				success: function(data) {
						// console.log('ok', data);
						var parsed = $.parseXML(data);
						var lastPostHtml = $(parsed).find('item description').first().text();
						var lastPostText = $(lastPostHtml).text();
						console.log(lastPostText);
						if (lastPostText != null && lastPostText != undefined && lastPostText.trim() != '') {
								var moodInfo = analyze(lastPostText);
								// console.log(moodInfo);
								callback(moodInfo.score, lastPostText);
						}
				},
				error: function(err) {
						console.log('err', err);
						callback(0, "");
				}
		})
}
getSealStatus(function(status, text) {
		window.seals = (status >= 0) ? seals_ok : seals_not_ok;
		window.seals_full = window.seals + " " + text;
});

window.woodcocks = "Ситуация с ва́льдшнепами спокойная.";
var zp = 800 + Math.round(Math.random()*50);
window.zombies = "Вероятность зомби-атаки — " + zp + " на миллион. Это меньше статистической погрешности.";

function tell_status() {
  window.speaksmth("Привет! Говорит И́нкери Норпа Лехтокурпа. " + window.weather + ' ' +  window.seals + ' ' +  window.woodcocks + ' ' + window.zombies + ' ' + "Спасибо, всего доброго!");
};

window.recognition = new SpeechRecognition();
recognition.lang = 'ru-RU';
recognition.interimResults = false;
// recognition.maxAlternatives = 0;

window.recognition.onresult = function(event) {
  var speechResult = event.results[0][0].transcript
  // diagnosticPara.textContent = 'Speech received: ' + speechResult + '.';
  console.log('Result: ' + speechResult);
  console.log('Confidence: ' + event.results[0][0].confidence);

  var response = "Извините, не поняла, что значит " + speechResult + ". Меня можно спросить про погоду, тюленей, вальдшнепов и зомби.";

  speechResult = speechResult.toLowerCase();
  if(true || speechResult.includes("тюлен"))
  {
    response = window.seals_full;
  } else if(speechResult.includes("вальдшне")) {
    response = window.woodcocks;
  } else if(speechResult.includes("зомби")) {
    response = window.zombies;
  } else if(speechResult.includes("погод")) {
    response = window.weather;
  }
  window.speaksmth(response);
}

window.recognition.onspeechend = function() {
  var sttBtn = document.querySelector('#sttbtn');
  sttBtn.disabled = false;
  window.recognition.stop();
}

window.recognition.onerror = function(event) {
  var sttBtn = document.querySelector('#sttbtn');
  sttBtn.disabled = false;
  alert("Speech recognition error: " + event.error);
}

function stt() {
  var sttBtn = document.querySelector('#sttbtn');
  sttBtn.disabled = true;
  window.recognition.start();
};
