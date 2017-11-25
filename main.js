import { loadSealStatus, getSealStatusText, getSealText, getSealBackValue } from './seals.js';
import { loadWeather } from './weather.js';
import { declinateUnit } from './misc.js';

var SpeechRecognition = null;
var SpeechGrammarList = null;
var SpeechRecognitionEvent = null;

window.weather = "";

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

window.tssss = function() {
  window.speechSynthesis.cancel();
}

var speaking = false;
function speaksmth(text) {
  speaking = true;
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

    utterThis.addEventListener('end', function () {
      console.log('speaksmth: speech end');
      if (isAlwaysOn) {
	stt();
      }
      speaking = false;
    });
    
    synth.speak(utterThis);
  } catch(e) {
    console.log(e);
    t_ga('speech_synthesis', 'general_error', navigator.userAgent + " -----> " + e.toString());
    speaking = false;
  }
};

window.woodcocks = "Ситуация с ва́льдшнепами спокойная.";
var zp = 800 + Math.round(Math.random()*50);
window.zombies = "Вероятность зомби-атаки — " + zp + " на миллион. Это меньше статистической погрешности.";

window.tell_status = function() {
  speaksmth("Привет! Говорит И́нкери Норпа Лехтокурпа. " + window.weather + ' ' +  getSealStatusText() + ' ' + getSealBackValue() + ' ' +  window.woodcocks + ' ' + window.zombies + ' ' + "Спасибо, всего доброго!");
};


var started = false;
window.stt = function() {
  if (!started) {
    console.log('stt');
    var sttBtn = document.querySelector('#sttbtn');
    sttBtn.disabled = true;
    window.recognition.start();
  }
  else {
    console.log('stt: already started');
  }
};
function stp() {
  console.log('stp');
  var sttBtn = document.querySelector('#sttbtn');
  sttBtn.disabled = false;
  window.recognition.stop();
}

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

var clearSpeech = function(speechResult) {
  return speechResult
    .toLowerCase()
    .replace("инкери", "")
    .replace("расскажи", "")
    .replace("такое", "")
    .replace("такой", "")
    .replace("что-нибудь", "")
    .replace("что", "")
    .replace("кто", "")
    .replace("мне", "")
    .replace("про", "")
    .replace(" о ", " ")
    .trim();
}

var matchInkeri = function(speechResult) {
  return speechResult.includes("инкери")
    || speechResult.includes("inquiries")
    || speechResult.includes("интере")
    || speechResult.includes("интервью")
    || speechResult.includes("интерьер")
    || speechResult.includes("intellij")
    || speechResult.includes("игры")
    || speechResult.includes("inferi");
}

$(document).ready(function() {

  loadWeather((w) => window.weather = w);
  loadSealStatus();

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
  window.recognition.continuous = isAlwaysOn;
  // window.recognition.maxAlternatives = 0;

  var prevSpeechResult = "";

  window.recognition.onresult = function(event) {
    var speechResult = event.results[0][0].transcript
    // diagnosticPara.textContent = 'Speech received: ' + speechResult + '.';
    console.log('Result: ' + speechResult);
    console.log('Confidence: ' + event.results[0][0].confidence);

    var response_default = "Извините, не знаю, что значит " + speechResult + ". Но вообще меня можно спросить много про что, например про погоду, тюленей, вальдшнепов и зомби.";
    var response = response_default

    speechResult = speechResult.toLowerCase().trim();

    if (isAlwaysOn && speechResult == prevSpeechResult) {
      console.log('duplicate');
      return;
    }
    prevSpeechResult = speechResult;
    
    if(speechResult.includes("тюлен")) {
      response = getSealText();
    } else if(speechResult.includes("вальдшне")) {
      response = window.woodcocks;
    } else if(speechResult.includes("зомби")) {
      response = window.zombies;
    } else if(speechResult.includes("погод")) {
      response = window.weather;
    } else if(isAlwaysOn && matchInkeri(speechResult)) {
      console.log("question event");
      var speechResultTrimmed = clearSpeech(speechResult);
      t_ga('speech_recognition', 'question', speechResultTrimmed);
      stp();
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
	    response = "Извините, не знаю, что значит " + speechResultTrimmed + ". Но вообще меня можно спросить много про что, например про погоду, тюленей, вальдшнепов и зомби.";
	  }
	  speaksmth(response);
	  console.log(response);
	},
	function() {
	  speaksmth(response_default);
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
	  speaksmth(response);
	  console.log(response);
	},
	function() {
	  speaksmth(response_default);
	});
      response = "";
    }

    if (response != "") {
      stp();
      speaksmth(response);
    }
    else if (isAlwaysOn) {
      stt();
    }
  }

  window.recognition.onspeechend = function() {
    console.log('onspeechend');
    if (!isAlwaysOn) {
      stp();
    }
  }

  window.recognition.onerror = function(event) {
    console.log('onerror');
    var sttBtn = document.querySelector('#sttbtn');
    sttBtn.disabled = false;
    if (!isAlwaysOn) {
      alert("Speech recognition error: " + event.error);
    }
    t_ga('speech_recognition', 'recognition_error', event.error.toString());
    started = false;
    if (isAlwaysOn) {
      stt();
    }
  }

  window.recognition.onstart = function(event) {
    console.log('onstart');
    started = true;
  };
  window.recognition.onend = function(event) {
    console.log('onend');
    started = false;
    if (isAlwaysOn) {
      setTimeout(function() {
	if (!speaking) {
	  stt();
	}
      }, 500);
    }
  };

  setInterval(function() {
    if (isAlwaysOn && !speaking && !started) {
      stt();
    }
  }, 5000);

  if (isAlwaysOn) {
    stt();
  }
});
