﻿import { STATES, set as setState, get as getState, is as isState, addHandler as addStateHandler } from './states.js';
import { loadSealStatus, getSealStatusText, getSealText, getSealTextImages, getSealBackValue } from './seals.js';
import { loadZombieProbability, getZombies, getZombieTextImages } from './zombie_outbreak.js';
import { loadWeather } from './weather.js';
import { search, next } from './search.js';
import { loadKriperStory } from './kriper.js';
import { randomSpeech, REMEMBER_PROBABILITY } from './self.js';
import { declinateUnit, t_ga, response_default_template, log_for_user, getUrlVars, showImages, stopImages, showToken, isValidUrl } from './misc.js';
import { matchInkeri, matchInkeriAny, matchStop, matchStopAny, matchNext, matchNextAny } from './words.js';
import { init as initPushes, onEvent as onPushEvent } from './push.js';
import { readUrl } from './reader.js';
import { initTodoist, onTask } from './todoist.js';
import { init as initNeuro, query as queryNeuro } from './neuro/index.js';

// -- To Force https ------------------------------
// -- https://stackoverflow.com/a/4723302/539470 --
if (location.protocol != 'https:' && location.hostname != 'localhost' && location.hostname != '127.0.0.1')
  location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
// --

// -- Global site tag (gtag.js) - Google Analytics --
window.dataLayer = window.dataLayer || [];
function gtag(){
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'UA-110108110-1');
// --

var SpeechRecognition = null;
var SpeechGrammarList = null;
var SpeechRecognitionEvent = null;
var recognition = null;
var recognition2 = null;
try {
  SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
  SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
  SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
  recognition = new SpeechRecognition();
  recognition2 = new SpeechRecognition();
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
var prevSpeechResult = "";
if (recognition) {
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

if (recognition2) {
  recognition2.lang = 'ru-RU';
  recognition2.interimResults = true;
  recognition2.continuous = true;
  // recognition.maxAlternatives = 0;
}
if (recognition2) {
  recognition2.onresult = function(event) {
    // console.log('recognition2.onresult: event: ', event);
    var speechResults = _.flatMap(event.results, (res) => _.map(res, (res2) => [ res2.transcript.toLowerCase() , res2.confidence ]));
    var speechResultsNC = _.flatMap(event.results, (res) => _.map(res, (res2) => res2.transcript.toLowerCase()));
    console.log('recognition2.onresult: results: ', speechResults);
    var stopWordMatched = matchStopAny(speechResultsNC);
    var inkeriWordMatched = matchInkeriAny(speechResultsNC);
    var nextWordMatched = matchNextAny(speechResultsNC);
    console.log('matchInkeri: ', inkeriWordMatched);
    console.log('matchStop: ', stopWordMatched);
    console.log('matchNext: ', nextWordMatched);
    if (stopWordMatched) {
      console.log('stop word matched');
      tssss();
    }
    else if (nextWordMatched && inkeriWordMatched) {
      console.log('next word matched');
      next((response) => {
        console.log("main: next [speaking]: response: ", response);
        if (response.trim() != "") {
          setState(STATES.thinking, response);
        }
        else {
          setState(STATES.initial);
        }
      });
    }
  }

  recognition2.onerror = function(error) {
    console.log('recognition2.onerror: error: ', error);
    setTimeout(function() {
      if (isState(STATES.speaking)) {
        try {
          recognition2.start();
        }
        catch (e) {}
      }
    }, 500);
  }

  recognition2.onend = function(event) {
    console.log('recognition2.onend: event: ', event);
    setTimeout(function() {
      if (isState(STATES.speaking)) {
        try {
          recognition2.start();
        }
        catch (e) {}
      }
    }, 500);
  }
}

addStateHandler(STATES.listening, {
  onAfter: (stOld, stNew) => {
    console.log('main: started listening');
    var sttBtn = document.querySelector('#sttbtn');
    sttBtn.disabled = true;
    if (recognition) {
      console.log("main: recogition start");
      recognition.start();
    }
    else {
      setState(STATES.initial);
    }
  },
  onExitBefore : (stOld, stNew) => {
    console.log('main: stopped listening');
    var sttBtn = document.querySelector('#sttbtn');
    sttBtn.disabled = false;
    if (recognition) {
      console.log("main: recogition stop");
      recognition.stop();
    }
  }
});

addStateHandler(STATES.thinking, {
  onAfter: (stOld, stNew, speechResult) => {
    var response;
    var images = [];
    console.log(speechResult);
    if (speechResult.startsWith("say ") || speechResult.startsWith("скажи ")) {
      const t = speechResult.slice(4).trim();
      if (t != "") {
        setState(STATES.speaking, {
          text: t,
          images: []
        });
      }
    }
    else if (speechResult.startsWith("img ")) {
      console.log('Showing image')
      const t = speechResult.slice(4).trim();
      if (t != "") {
        showImages([ t ]);
        setState(STATES.initial);
        return;
      }
    }
    else if (matchStop(speechResult)) {
      console.log('stop');
      tssss();
      return;
    }
    else if (speechResult.includes("тюлен") || speechResult.includes("нерп")) {
      response = getSealText();
      images = getSealTextImages();
    } else if(speechResult.includes("вальдшне")) {
      response = woodcocks;
    } else if(speechResult.includes("зомби")) {
      response = getZombies();
      images = getZombieTextImages();
    } else if(speechResult.includes("погод")) {
      response = weather;
    } else if(speechResult.includes("статус") || speechResult.includes("обстановк")) {
      response = get_status();
    } else if(speechResult.includes("крипер") || speechResult.includes("страш")) {
      loadKriperStory((response) => {
        console.log("main: thinking: kriper: response: ", response);
        if (response.trim() != "") {
          setState(STATES.speaking, {
            text: response,
            images: []
          });
        }
        else {
          setState(STATES.initial);
        }
      });
      return;
    } else if (speechResult.includes("матриц") || speechResult.includes("matrix")) {
      console.log("main: thinking: matrix");
      showToken();
      setState(STATES.initial);
    }  else if (matchNext(speechResult) && matchInkeri(speechResult)) {
      next((response) => {
        console.log("main: next [thinking]: response:", response);
        if (response.trim() != "") {
          setState(STATES.speaking, {
            text: response,
            images: []
          });
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
          console.log("main: thinking: inkeri: response: ", response);
          if (response.trim() != "") {
            setState(STATES.speaking, {
              text: response,
              images: []
            });
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
          console.log("main: thinking: unknown: response: ", response);
          if (response.trim() != "") {
            setState(STATES.speaking, {
              text: response,
              images: []
            });
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
      setState(STATES.speaking, {
        text: response,
        images: images
      });
    }
    else {
      setState(STATES.initial);
    }
  }
});

addStateHandler(STATES.speaking, {
  onAfter: (stOld, stNew, data) => {
    var textToSpeak = data.text;
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

      showImages(data.images);
      synth.speak(utterThis);
    } catch(e) {
      console.log(e);
      t_ga('speech_synthesis', 'general_error', navigator.userAgent + " -----> " + e.toString());
      setState(STATES.initial);
    }

    console.log("main: recogition2 start");
    try {
      recognition2.start();
    }
    catch (e) {
      console.log("Error: main: cannot start recognition2", e);
    }
  },
  onExitBefore: (stOld, stNew) => {
    speechSynthesis.cancel();
    console.log("main: recogition2 stop");
    recognition2.stop();
    stopImages();
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
        setState(STATES.speaking, {
          text: resp,
          images: []
        });
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
  if (isState(STATES.initial)) {
    startListening();
  } else if (isState(STATES.speaking) || isState(STATES.listening) || (isState(STATES.thinking))) {
    setState(STATES.initial);
  }
  else {
    console.log('tssss: wrong state');
  }
  stopImages();
}

var status_template = _.template("Привет! Говорит И́нкери Норпа Лехтокурпа. <%= weather %> <%= seals %> <%= seals_back %> <%= woodcocks %> <%= zombies %> Спасибо, всего доброго!");

var get_status = function() {
  var text = status_template({
    weather    : weather,
    seals      : getSealStatusText(),
    seals_back : getSealBackValue(),
    woodcocks  : woodcocks,
    zombies    : getZombies()
  });
  return text;
};

window.tell_status = function() {
  if (isState(STATES.initial)) {
    var text = get_status();
    setState(STATES.speaking, {
      text: text,
      images: []
    });
  } else {
    console.log('tell_status: wrong state');
  }
};



var isAlwaysOn = getUrlVars()['on'] == 1;
if (isAlwaysOn) {
  console.log("isAlwaysOn");
}

var weather = "";
var woodcocks = "Ситуация с ва́льдшнепами настораживает. Двадцать второго апреля в городе Сосновый бор Ленинградской области был обнаружен разбившийся вальдшнеп.";
var zp = 2800 + Math.round(Math.random()*50);

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
loadZombieProbability();

initPushes();
onPushEvent('url', (event) => {
  console.log('main: push event: [url]: ', event);
  tellUrl(event.data);
});
onPushEvent('message', (event) => {
  console.log('main: push event: [message]: ', event);
  tell(event.data);
});
onPushEvent('say', (event) => {
  console.log('main: push event: [say]: ', event);
  if (event.data.trim() != "") {
    setState(STATES.speaking, {
      text: event.data,
      images: []
    });
  }
});

initTodoist();
onTask((task) => {
  console.log('todoist task: ', task.content);
  window.tell(task.content);
});

initNeuro();
window.queryNeuro = queryNeuro;

if (isAlwaysOn) {
  startListening();
}

const tellUrl = (url) => {
  if (isState(STATES.initial) || isState(STATES.listening)) {
    return new Promise((resolve) => {
      readUrl(url, (response, images) => {
        console.log("main: tellUrl:  response: ", response.trim());
        if (response.trim() != "") {
          let uss = addStateHandler(getState(), {
            onAfter: (stOld, stNew) => {
              uss();
              console.log('tellUrl: done');
              resolve();
            }
          });

          setState(STATES.speaking, {
            text: response,
            images: (images ? images : [])
          });
        }
        else {
          setState(STATES.initial);
          resolve();
        }
      });
    });
  }
  else {
    console.log('main: tellUrl: ', url, 'wrong state');
    return Promise.resolve();
  }
}

// JSON samples:
// '{ type : "script", commands: [ { time: "12:42:00", command: "say тюлень" }, { time: "12:42:и30", command: "say кулебяка" } ] }'
// '{ type : "script", commands: [ { offset: 1, command: "say тюлень" }, { offset: 2, command: "say кулебяка" } ] }' - offsets in seconds
// '{ type : "script", commands: [ { offset: 1, commands: ["say тюлень", "say кулебяка"] } ] }'
// '{ type : "script", commands: [ { offset: 1, commands: ["img https://static.1000.menu/img/content/21268/golyi-tort-s-fruktami-svadebnyi-recept-s-foto_1499683557_37_max.jpg", "торт", "спасибо", "say а теперь про тюленей", "тюлень"] } ] }'
const tellJson = (json) => {
  switch (json.type) {
  case 'script':
    if (json.commands) {
      return tellScript(json.commands);
    }
    break;
  default:
    return Promise.resolve();
    break;
  }
}

const tellScript = (commands) => {
  console.log('tellScript: commands: ', commands);
  commands.forEach((cmd) => {
    if (cmd.time) {
      const diff = moment(cmd.time, 'HH:mm:ss').diff(moment());
      if (diff >= 0) {
        setTimeout(() => {
          tellScriptEntry(cmd);
        }, diff);
      }
    }
    else if (cmd.offset) {
      setTimeout(() => {
        tellScriptEntry(cmd);
      }, cmd.offset * 1000);
    }
  });

  return Promise.resolve(); // Script resolves immediately
}

const tellScriptEntry = async (entry) => {
  if (entry.command) {
    window.tell(entry.command);
    console.log('tellScript: done command: ', entry.command);
  }
  else if (entry.commands) {
    for (const cmd of entry.commands) {
      await window.tell(cmd);
      console.log('tellScript: done command: ', cmd);
    }
  }
}

window.tell = (text) => {
  const text2 = text.toLowerCase().trim();
  console.log('tell: ', text2);
  if (isState(STATES.initial) || isState(STATES.listening)) {
    let parsedText = null;
    try {
      parsedText = JSON.parse(text2.replace('https:', '#HTTPS;').replace('http:', '#HTTP;').replace(/(['"])?([a-zA-Z_]+)(['"])?\s*:/g, '"$2": ').replace('#HTTP;', 'http:').replace('#HTTPS;', 'https:'));
    }
    catch (e) {}

    if (parsedText) {
      return tellJson(parsedText);
    }
    else if (isValidUrl(text2)) {
      return tellUrl(text2);
    }
    else {
      console.log("tell: -> thinking");
      prevSpeechResult = text2;

      return new Promise((resolve) => {
        let uss = addStateHandler(getState(), {
          onAfter: (stOld, stNew) => {
            uss();
            console.log('tell: done');
            resolve();
          }
        });

        setState(STATES.thinking, text2);
      });
    }
  }
  else if (isState(STATES.speaking)) {
    console.log("tell: -> tsss");
    var stopWordMatched = matchStop(text2);
    var nextWordMatched = matchNext(text2);

    return new Promise((resolve) => {
      let uss0 = addStateHandler(STATES.initial, {
        onAfter: (stOld, stNew) => {
          uss0(); uss1();
          console.log('tell: done');
          resolve();
        }
      });
      let uss1 = addStateHandler(STATES.initial, {
        onAfter: (stOld, stNew) => {
          uss0(); uss1();
          console.log('tell: done');
          resolve();
        }
      });

      if (nextWordMatched) {
        next((response) => {
          console.log("main: tell: next [speaking]: response: ", response);
          if (response.trim() != "") {
            setState(STATES.thinking, response);
          }
          else {
            setState(STATES.initial);
          }
        });
      }
      else if (stopWordMatched) {
        console.log('stop word matched');
        tssss();
      }
    });
  }
  else {
    console.log("tell: status: " + getState());
    return Promise.resolve();
  }
}
