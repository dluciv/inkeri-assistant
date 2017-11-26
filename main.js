import { loadSealStatus, getSealStatusText, getSealText, getSealBackValue } from './seals.js';
import { loadWeather } from './weather.js';
import { search } from './search.js';
import { declinateUnit, t_ga, response_default_template } from './misc.js';

var SpeechRecognition = null;
var SpeechGrammarList = null;
var SpeechRecognitionEvent = null;

window.weather = "";

function log_for_user(text){
  t_ga('log_for_user', 'text', text);
  $('#log_for_user_text')[0].innerHTML += text + '<br/>\n';
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
    log_for_user("Ваш браузер не поддерживает распознавание речи. Пожалуйста откройте страницу в Google Chrome.");
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

    var response = response_default_template({ speechResult : speechResult });

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
      stp();
      search(
	speechResult,
	(response) => {
	  speaksmth(response);
	  console.log(response);
	});
      response = "";      
    } else if(speechResult.trim() != "") {
      t_ga('speech_recognition', 'unknown_phrase', speechResult);
      search(
	speechResult,
	(response) => {
	  speaksmth(response);
	  console.log(response);
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
