window.owmAPIkey = "65b3dc1574aadec85e6638331e30b380"; // dluciv@gmail.com

var SpeechRecognition = null;
var SpeechGrammarList = null;
var SpeechRecognitionEvent = null;

window.weather = "";

var _units = {
  "градус" : ["градуса", "градусов"],
  "метр" : ["метра", "метров"],
  "миллиметр" : ["миллиметра", "миллиметров"],
  "процент": ["процента", "процентов"],
  "тюлень": ["тюленя", "тюленей"],
};

for(var u in _units)
  if(_units.hasOwnProperty(u))
     _units[u].unshift(u);


function t_ga(category, action, text){
  try {
    gtag('event', action, {
      'event_category': category,
      'event_label': text
    });
  } catch (e) {
    console.log("Analytics error: " + e.toString());
    console.log("Tried to send: " + category + ' ' + action + ' ' + label + ' ' + value);
  }
}

function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
var urlVars = getUrlVars();
var isAlwaysOn = urlVars['on'] == 1;
if (isAlwaysOn) {
  console.log("isAlwaysOn");
}

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

function tssss() {
  window.speechSynthesis.cancel();
}

function speaksmth(text) {
  try {
    var synth = window.speechSynthesis;
    var voices = synth.getVoices();
    var ru_voices = voices.filter(function(v){
      return v.lang.startsWith("ru");
    });
    var available_voices = ru_voices.length > 0 ? ru_voices : voices;
    var voice = available_voices[0];
    for(var v in available_voices){
      if(available_voices[v].default)
        voice = available_voices[v];
    }
    /*
    Bad idea to use cloud syntheser on Desktop — Google does
    not render it to the end. 
    var bestvoice = "Google русский";
    for(var v in voices){
      if(voices[v].name == bestvoice)
        voice = voices[v];
    }
    */
    
    var utterThis = new SpeechSynthesisUtterance(text);
    // utterThis.rate = 1.1;
    utterThis.pitch = 1.4;
    utterThis.lang = 'ru-RU';
    utterThis.voice = voice;
    
    synth.speak(utterThis);
  } catch(e) {
    console.log(e);
    t_ga('speech_synthesis', 'general_error', navigator.userAgent + " -----> " + e.toString());    
  }
};

var seals_ok = "Ситуация с тюленями обнадёживающая.";
var seals_not_ok = "Ситуация с тюленями угрожающая.";
var seals_default = "Ситуация с тюленями спокойная.";
var seals_full_prefix = "Центр реабилитации морских млекопитающих Ленинградской области сообщает. ";
window.seals = seals_default;
window.seals_full = seals_default;
var seals_url = 'https://matrix.dluciv.name/vksealrescuerss';

var get_ewma = function(now, moments, half_life, notolder) {

  var events = moments.slice();
  events.sort();
  var total_weighted_events = 0.0;

  for(var i = 0; i < events.length; ++i) {
    var e = events[i];
    var d = (now - e) / 1000.0;
    if(d > notolder)
      continue;
    var weight = Math.pow(2, -d/half_life);
    total_weighted_events += weight;
  }

  // total_weighted_seconds = \sum_{d = 0}^{analysis_period} 2^{-d/half_life} =
  // \frac{1 - q^n}{1-q}, q^{half_life} = 1/2.

  var q = Math.pow(2, -1/half_life);
  var total_weighted_time = (1 - Math.pow(q, notolder)) / (1 - q);

  return total_weighted_events / total_weighted_time;
}

window.seal_back_value = " ";

var measure_seal_background = function(parsed) {
  var now = new Date().getTime();
  var pubdates = [];
  $(parsed).find('item pubDate').each(function(){
    pubdates.push(new Date($(this).text()).getTime());
  });

  var halflife = 60*60*24*1; // 1 сутки - период полураспада события
  var ap = 31536000 / 12; // анализируем за месяц
  var tulsec = get_ewma(now, pubdates, halflife, ap);
  var micro_tul_hour = Math.round(tulsec * 1e6 * 3600);
  window.seal_back_value = " Фон — " + micro_tul_hour + " микро" + declinateUnit(micro_tul_hour, "тюлень") + " в час. ";
}

var getSealStatus = function(callback) {
		$.ajax({
				method: 'GET',
				url: seals_url,
				success: function(data) {
						// console.log('ok', data);
						var parsed = $.parseXML(data);
						measure_seal_background(parsed);
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
						t_ga('news', 'news_retrieval_error', err.toString());
						callback(0, "");
				}
		})
}

window.woodcocks = "Ситуация с ва́льдшнепами спокойная.";
var zp = 800 + Math.round(Math.random()*50);
window.zombies = "Вероятность зомби-атаки — " + zp + " на миллион. Это меньше статистической погрешности.";


function tell_status() {
  window.speaksmth("Привет! Говорит И́нкери Норпа Лехтокурпа. " + window.weather + ' ' +  window.seals + ' ' + window.seal_back_value + ' ' +  window.woodcocks + ' ' + window.zombies + ' ' + "Спасибо, всего доброго!");
};


function stt() {
  var sttBtn = document.querySelector('#sttbtn');
  sttBtn.disabled = true;
  window.recognition.start();
};

var searchAnswer = function(text, onSuccess, onError) {
  $.ajax({
    url: 'https://api.duckduckgo.com/?q=' + encodeURIComponent(text) + '&format=json',
    method: 'GET',
    success: function(resp) {
      var data = JSON.parse(resp);
      if (data) {
	onSuccess(data);
      }
      else {
	console.log('Error. Failed to parse response.\n', resp);
	t_ga('duckduckgo', 'bad_response', resp.toString());
	onError();
      }
    },
    error: function(err) {
      console.log('Error. ', err);
      t_ga('duckduckgo', 'failed_to_get_response', err.toString());
      onError();
    }
  });
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

  getSealStatus(function(status, text) {
    window.seals = (status >= 0) ? seals_ok : seals_not_ok;
    if (text.trim()) {
      window.seals_full = window.seals + window.seal_back_value + " " + seals_full_prefix + text;
    }
    else {
      window.seals_full = window.seals;
    }
  });

  try {
    SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
    SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
  } catch (e) {
    console.log(e);
    t_ga('speech_recognition', 'no_browser_support', navigator.userAgent + " -----> " + e.toString());
    $("#sttbtn").remove();
  }

  window.recognition = new SpeechRecognition();
  window.recognition.lang = 'ru-RU';
  window.recognition.interimResults = false;
  // window.recognition.maxAlternatives = 0;

  window.recognition.onresult = function(event) {
    var speechResult = event.results[0][0].transcript
    // diagnosticPara.textContent = 'Speech received: ' + speechResult + '.';
    console.log('Result: ' + speechResult);
    console.log('Confidence: ' + event.results[0][0].confidence);

    var response_default = "Извините, не знаю, что значит " + speechResult + ". Но вообще меня можно спросить много про что, например про погоду, тюленей, вальдшнепов и зомби.";
    var response = response_default

    speechResult = speechResult.toLowerCase();
    if(speechResult.includes("тюлен")) {
      response = window.seals_full;
    } else if(speechResult.includes("вальдшне")) {
      response = window.woodcocks;
    } else if(speechResult.includes("зомби")) {
      response = window.zombies;
    } else if(speechResult.includes("погод")) {
      response = window.weather;
    } else if(isAlwaysOn && speechResult.includes("инкери")) {
      console.log("question event");
      var speechResultTrimmed = speechResult.toLowerCase().replace("инкери", "").replace("расскажи", "").replace("такое", "").replace("такой", "").replace("что", "").replace("кто", "").trim();
      t_ga('speech_recognition', 'question', speechResultTrimmed);
      searchAnswer(
	speechResultTrimmed,
	function(resp) {
	  console.log(resp);
	  if (resp.AbstractText) {
	    response = resp.AbstractText;
	  }
	  else if (resp.RelatedTopics && Array.isArray(resp.RelatedTopics) && resp.RelatedTopics.length > 0 && resp.RelatedTopics[0].Result) {
	    response = $("<span>" + resp.RelatedTopics[0].Result + "</span>").children('a[href*="duckduckgo.com/"]').remove().end().text();
	  }
	  else {
	    response = response_default;
	  }
	  window.speaksmth(response);
	  console.log(response);
	},
	function() {
	  window.speaksmth(response_default);
	});
      response = "";      
    } else if(speechResult.trim() != "") {
      t_ga('speech_recognition', 'unknown_phrase', speechResult);
      searchAnswer(
	speechResult,
	function(resp) {
	  console.log(resp);
	  if (resp.AbstractText) {
	    response = resp.AbstractText;
	  }
	  else if (resp.RelatedTopics && Array.isArray(resp.RelatedTopics) && resp.RelatedTopics.length > 0 && resp.RelatedTopics[0].Result) {
	    response = $("<span>" + resp.RelatedTopics[0].Result + "</span>").children('a[href*="duckduckgo.com/"]').remove().end().text();
	  }
	  else {
	    response = response_default;
	  }
	  window.speaksmth(response);
	  console.log(response);
	},
	function() {
	  window.speaksmth(response_default);
	});
      response = "";
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
    t_ga('speech_recognition', 'recognition_error', event.error.toString());
  }
});
