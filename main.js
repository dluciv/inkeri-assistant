import { STATES, set as setState, get as getState, is as isState, addHandler as addStateHandler } from './states.js';
import { loadSealStatus, getSealStatusText, getSealText, getSealBackValue } from './seals.js';
import { loadWeather } from './weather.js';
import { search } from './search.js';
import { loadKriperStory } from './kriper.js';
import { randomSpeech, REMEMBER_PROBABILITY } from './self.js';
import { declinateUnit, t_ga, response_default_template, log_for_user, getUrlVars, matchInkeri } from './misc.js';

var SpeechRecognition = null;
var SpeechGrammarList = null;
var SpeechRecognitionEvent = null;
var recognition = null;
try {
  SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
  SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
  SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
  recognition = new SpeechRecognition();
} catch (e) {
  console.log(e);
  t_ga('speech_recognition', 'no_browser_support', navigator.userAgent + " -----> " + e.toString());
  log_for_user("Ваш браузер не поддерживает распознавание речи. Пожалуйста откройте страницу в Google Chrome.");
}
if (recognition) {
  recognition.lang = 'ru-RU';
  recognition.interimResults = false;
  recognition.continuous = isAlwaysOn;
  // recognition.maxAlternatives = 0;
}
else {
  $(function() {
    $("#sttbtn").remove();
  });
}
if (recognition) {
  var prevSpeechResult = "";
  recognition.onresult = function(event) {
    var speechResult = event.results[0][0].transcript;
    // diagnosticPara.textContent = 'Speech received: ' + speechResult + '.';
    console.log('Result: ' + speechResult);
    console.log('Confidence: ' + event.results[0][0].confidence);

    speechResult = speechResult.toLowerCase().trim();

    if (speechResult == "") {
      console.log('empty');
      return;
    }
    else if (speechResult == prevSpeechResult) {
      console.log('duplicate');
      return;
    }
    prevSpeechResult = speechResult;

    setState(STATES.thinking, speechResult);
  }

  recognition.onerror = function(event) {
    console.log('onerror');
    setState(STATES.initial);
    if (!isAlwaysOn) {
      alert("Speech recognition error: " + event.error);
    }
    t_ga('speech_recognition', 'recognition_error', event.error.toString());
  }
  
  recognition.onend = function(event) {
    if (isState(STATES.listening)) {
      console.log('onend');
      setState(STATES.initial);
    }
  };
}

addStateHandler(STATES.listening, {
  onAfter: (stOld, stNew) => {
    console.log('started listening');
    var sttBtn = document.querySelector('#sttbtn');
    sttBtn.disabled = true;
    if (recognition) {
      recognition.start();
    }
    else {
      setState(STATES.initial);
    }
  },
  onExitBefore : (stOld, stNew) => {
    console.log('started listening');
    var sttBtn = document.querySelector('#sttbtn');
    sttBtn.disabled = false;
    if (recognition) {
      recognition.stop();
    }
  }
});

addStateHandler(STATES.thinking, {
  onAfter: (stOld, stNew, speechResult) => {
    var response;
    if(speechResult.includes("тюлен")) {
      response = getSealText();
    } else if(speechResult.includes("вальдшне")) {
      response = woodcocks;
    } else if(speechResult.includes("зомби")) {
      response = zombies;
    } else if(speechResult.includes("погод")) {
      response = weather;
    } else if(speechResult.includes("крипер") || speechResult.includes("страш")) {
      loadKriperStory((response) => {
  console.log(response);
  if (response.trim() != "") {
    setState(STATES.speaking, response);
  }
  else {
    setState(STATES.initial);
  }
      });
      return;
    } else if(isAlwaysOn && matchInkeri(speechResult)) {
      search(
        speechResult,
        (response) => {
          console.log(response);
          if (response.trim() != "") {
            setState(STATES.speaking, response);
          }
          else {
            setState(STATES.initial);
          }
        });
      return;      
    } else if(speechResult != "") {
      t_ga('speech_recognition', 'unknown_phrase', speechResult);
      search(
        speechResult,
        (response) => {
          console.log(response);
          if (response.trim() != "") {
            setState(STATES.speaking, response);
          }
          else {
            setState(STATES.initial);
          }
        });
      return;
    }
    else {
      return;
    }

    if (response != "") {
      setState(STATES.speaking, response);
    }
    else {
      setState(STATES.initial);
    }
  }
});

addStateHandler(STATES.speaking, {
  onAfter: (stOld, stNew, textToSpeak) => {
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

      // window, not var because onend does not trigger otherwise
      // https://bugs.chromium.org/p/chromium/issues/detail?id=509488#c11
      window.utterThis = new SpeechSynthesisUtterance(textToSpeak);
      // utterThis.rate = 1.1;
      utterThis.pitch = 1.4;
      utterThis.lang = 'ru-RU';
      utterThis.voice = voice;

      utterThis.addEventListener('end', function () {
        console.log('speaksmth: speech end');
        setState(STATES.initial);
      });
      
      synth.speak(utterThis);
      setTimeout
    } catch(e) {
      console.log(e);
      t_ga('speech_synthesis', 'general_error', navigator.userAgent + " -----> " + e.toString());
      setState(STATES.initial);
    }
  },
  onExitBefore: (stOld, stNew) => {
    speechSynthesis.cancel();
  }
});

addStateHandler(STATES.initial, {
  onAfter : (stOld, stNew) => {
    if (isAlwaysOn) {
      setTimeout(() => {
        if (isState(STATES.initial)) {
          if (Math.random() < REMEMBER_PROBABILITY) {
            startRemembering()
          }
          else {
            startListening();
          }
        }
      }, 500);
    }
  }
});

addStateHandler(STATES.remembering, {
  onAfter: (stOld, stNew) => {
    randomSpeech(
      (resp) => {
        setState(STATES.speaking, resp);
      },
      () => {
        setState(STATES.initial);
      }
    );
  }
});

var startListening = function() {
  if (isState(STATES.initial)) {
    setState(STATES.listening);
  }
  else {
    console.log('startListening: wrong state');
  }
};

var stopListening = function() {
  if (isState(STATES.listening)) {
    setState(STATES.initial);
  }
  else {
    console.log('stopListening: wrong state');
  }
}

var startRemembering = function() {
  if (isState(STATES.initial)) {
    setState(STATES.remembering);
  }
  else {
    console.log('startRemembering: wromg state');
  }
}

var tssss = function() {
  if (isState(STATES.speaking) || isState(STATES.listening)) {
    setState(STATES.initial);
  }
  else {
    console.log('tssss: wrong state');
  }
}

var status_template = _.template("Привет! Говорит И́нкери Норпа Лехтокурпа. <%= weather %> <%= seals %> <%= seals_back %> <%= woodcocks %> <%= zombies %> Спасибо, всего доброго!");
var tell_status = function() {
  if (isState(STATES.initial)) {
    var text = status_template({
      weather    : weather,
      seals      : getSealStatusText(),
      seals_back : getSealBackValue(),
      woodcocks  : woodcocks,
      zombies    : zombies
    });
    setState(STATES.speaking, text);
  }
  else {
    console.log('tell_status: wrong state');
  }
};

var isAlwaysOn = getUrlVars()['on'] == 1;
if (isAlwaysOn) {
  console.log("isAlwaysOn");
}

var weather = "";
var woodcocks = "Ситуация с ва́льдшнепами спокойная.";
var zp = 800 + Math.round(Math.random()*50);
var zombies = "Вероятность зомби-атаки — " + zp + " на миллион. Это меньше статистической погрешности.";

$(function() {
  $('#statusBtn').click((e) => {
    e.preventDefault();
    tell_status();
  });
  $('#inkeriImg').click((e) => {
    e.preventDefault();
    tssss();
  });
  $('#sttbtn').click((e) => {
    e.preventDefault();
    startListening();
  });
});

setState(STATES.initial);

loadWeather((w) => weather = w);
loadSealStatus();

if (isAlwaysOn) {
  startListening();
}
