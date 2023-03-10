import { STATES, set as setState, get as getState, is as isState, addHandler as addStateHandler } from './states.js';
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
import { getGptAnswer } from './gpt.js';
import { init as initNeuro, query as queryNeuro } from './neuro/index.js';
import { VOICE_LANG, VOICE_NAME, VOICE_PITCH, VOICE_RATE } from './settings.js'
import { init as recogitionInit, create as recognitionCreate, start as recognitionStart, stop as recognitionStop } from './recognition.js'
import { speak } from './speech.js'

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

const isAlwaysOn = getUrlVars()['on'] == 1;
if (isAlwaysOn) {
  console.log("isAlwaysOn");
}

recogitionInit();

const mainRecognitionID = 'mainRecognition';
const mainRecognition = recognitionCreate(mainRecognitionID, {
  interimResults: false,
  isAlwaysOn: isAlwaysOn,
  onResult: (speechResult, speechResults) => {
    setState(STATES.thinking, speechResult);
  },
  onError: (error) => {
    console.log('mainRecognition: onError: error: ', error);

    setState(STATES.initial);
  },
  onEnd: () => {
    setState(STATES.initial);
  }
});

const bgRecognitionID = 'bgRecognition';
const bgRecognition = recognitionCreate(bgRecognitionID, {
  interimResults: true,
  isAlwaysOn: true,
  onResult: async (speechResult, speechResults) => {
    const speechResultsNC = speechResults.map(res => res[0]);

    const stopWordMatched = matchStopAny(speechResultsNC);
    const inkeriWordMatched = matchInkeriAny(speechResultsNC);
    const nextWordMatched = matchNextAny(speechResultsNC);
    console.log('bgRecognition: matchInkeri: ', inkeriWordMatched);
    console.log('bgRecognition: matchStop: ', stopWordMatched);
    console.log('bgRecognition: matchNext: ', nextWordMatched);

    if (stopWordMatched) {
      console.log('bgRecognition: stop word matched');
      
      tssss();
    }
    else if (nextWordMatched && inkeriWordMatched) {
      console.log('bgRecognition: next word matched');
      
      const response = await next();
      console.log('bgRecognition: next: response:', response);
      if (response != null && response.trim() !== '') {
        setState(STATES.thinking, response);
      }
      else {
        setState(STATES.initial);
      }
    }
  },
  onError: (error) => {
    console.log('bgRecognition: onError: error: ', error);

    setTimeout(() => {
      if (isState(STATES.speaking)) {
        try {
          recognitionStart(bgRecognitionID);
        }
        catch (e) {}
      }
    }, 500);
  },
  onEnd: () => {
    console.log('bgRecognition: onError: error: ', error);

    setTimeout(() => {
      if (isState(STATES.speaking)) {
        try {
          recognitionStart(bgRecognitionID);
        }
        catch (e) {}
      }
    }, 500);
  }
});

if (mainRecognition == null) {
  $(function() {
    $("#sttbtn").remove();
  });
}

addStateHandler(STATES.listening, {
  onAfter: (stOld, stNew) => {
    console.log('main: started listening');

    const sttBtn = document.querySelector('#sttbtn');
    sttBtn.disabled = true;

    if (mainRecognition != null) {
      console.log('main: recogition start');
      try {
        recognitionStart(mainRecognitionID);
      }
      catch (error) {
        console.log('main: recogition start: error:', error);
        setState(STATES.initial);
      }
    }
    else {
      setState(STATES.initial);
    }
  },
  onExitBefore : (stOld, stNew) => {
    console.log('main: stopped listening');

    const sttBtn = document.querySelector('#sttbtn');
    sttBtn.disabled = false;

    if (mainRecognition != null) {
      console.log('main: recogition stop');
      try {
        recognitionStop(mainRecognition);
      }
      catch (error) {
        console.log('main: recogition stop: error:', error);
      }
    }
  }
});

const onAfterThinking = async (speechResult) => {
  console.log('onAfterThinking: speechResult:', speechResult);

  let response = null;
  let images = [];
  
  if (speechResult.startsWith('gpt ')) {
    const t = speechResult.slice(4).trim();
    console.log('!GPT:', t);
    if (t !== '') {
      response = await getGptAnswer();
    }
  }
  else if (speechResult.startsWith('say ') || speechResult.startsWith('скажи ')) {
    const t = speechResult.slice(4).trim();
    console.log('!Saying:', t);
    if (t !== '') {
      response = t;
    }
  }
  else if (speechResult.startsWith('img ')) {
    console.log('!Showing image')
    const t = speechResult.slice(4).trim();
    if (t !== '') {
      images = [ t ];
    }
  }
  else if (matchStop(speechResult)) {
    console.log('!Stop');
    tssss();
    return;
  }
  else if (speechResult.includes('тюлен') || speechResult.includes('нерп')) {
    console.log('!nerpa')

    response = getSealText();
    images = getSealTextImages();
  }
  else if(speechResult.includes('вальдшне')) {
    console.log('!woodcock')

    response = woodcocks;
  }
  else if(speechResult.includes('зомби')) {
    console.log('!zombies')

    response = getZombies();
    images = getZombieTextImages();
  }
  else if(speechResult.includes('погод')) {
    console.log('!weather')

    response = weather;
  }
  else if(speechResult.includes('статус') || speechResult.includes('обстановк')) {
    console.log('!status')

    response = get_status();
  }
  else if(speechResult.includes('крипер') || speechResult.includes('страш')) {
    console.log('!creeper')

    const r = await loadKriperStory();
    if (r == null || r == '') {
      response = 'Ничего не нашла';
    }
      
    console.log('onAfterThinking: creeper: response: ', r);

    if (response.trim() != '') {
      response = r;
    }
  }
  else if (speechResult.includes('матриц') || speechResult.includes('matrix')) {
    console.log("!matrix");
    showToken();
  }
  else if (matchNext(speechResult) && matchInkeri(speechResult)) {
    console.log('!next')

    const r = await next();
    if (r.trim() != '') {
      response = r
    }
  }
  else if(isAlwaysOn && matchInkeri(speechResult)) {
    console.log('!search')

    const r = await search(speechResult);

    console.log("main: thinking: inkeri: response: ", r);
    if (r.trim() != "") {
      response = r
    }    
  }
  else if(speechResult != '') {
    console.log('!unknown')

    t_ga('speech_recognition', 'unknown_phrase', speechResult);

    const r = await search(speechResult);

    console.log("main: thinking: unknown: response: ", r);
    
    if (r.trim() != "") {
      response = r;
    }
  }

  if ((response != null && response !== '') || (images != null && images.length > 0 )) {
    setState(STATES.speaking, {
      text: response,
      images: images
    });
  }
  else {
    setState(STATES.initial);
  }
}

addStateHandler(STATES.thinking, {
  onAfter: (stOld, stNew, speechResult) => {
    onAfterThinking(speechResult, true);
  }
});

const onAfterSpeaking = (textToSpeak, images) => {
  console.log('onAfterSpeaking: textToSpeak:', textToSpeak);
  
  try {
    const textToSpeakPresent = textToSpeak != null && textToSpeak !== '';
    if (textToSpeakPresent) {
      speak(textToSpeak, () => {
        setState(STATES.initial);
      });
    }

    if (images != null && images.length > 0) {
      showImages(images);

      if (!textToSpeakPresent) {
        setState(STATES.initial);
      }
    }
  }
  catch(error) {
    console.log('onAfterSpeaking: error:', error);
    t_ga('speech_synthesis', 'general_error', navigator.userAgent + " -----> " + e.toString());

    setState(STATES.initial);
  }

  // console.log("main: recogition2 start");
  // try {
  //   recognition2.start();
  // }
  // catch (e) {
  //   console.log("Error: main: cannot start recognition2", e);
  // }
}

addStateHandler(STATES.speaking, {
  onAfter: (stOld, stNew, data) =>  {
    onAfterSpeaking(data.text, data.images);
  },
  onExitBefore: (stOld, stNew) => {
    speechSynthesis.cancel();
    console.log("main: bgRecognition stop");

    if (bgRecognition != null) {
      try {
        recognitionStop(bgRecognitionID);
      }
      catch (error) {
        console.log('main: bgRecognition: stop: error:', error);
      }
    }

    stopImages();
  }
});

addStateHandler(STATES.initial, {
  onAfter : (stOld, stNew) => {
    if (isAlwaysOn) {
      setTimeout(() => {
        if (isState(STATES.initial)) {
          if (Math.random() < REMEMBER_PROBABILITY) {
            startRemembering();
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

const startListening = () => {
  if (isState(STATES.initial)) {
    setState(STATES.listening);
  }
  else {
    console.log('startListening: wrong state');
  }
};

const stopListening = () => {
  if (isState(STATES.listening)) {
    setState(STATES.initial);
  }
  else {
    console.log('stopListening: wrong state');
  }
}

const startRemembering = () => {
  if (isState(STATES.initial)) {
    setState(STATES.remembering);
  }
  else {
    console.log('startRemembering: wrong state');
  }
}

const tssss = function() {
  if (isState(STATES.initial)) {
    startListening();
  }
  else if (isState(STATES.speaking) || isState(STATES.listening) || (isState(STATES.thinking))) {
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
  $('#devInputBtn').click((e) => {
    e.preventDefault();
    const input = $('#devInputText')[0];
    const text = input.value;
    onAfterThinking(text, false);
  });
});

setState(STATES.initial);

loadWeather((w) => weather = w);
// loadSealStatus();
loadZombieProbability();

// initPushes();
// onPushEvent('url', (event) => {
//   console.log('main: push event: [url]: ', event);
//   tellUrl(event.data);
// });
// onPushEvent('message', (event) => {
//   console.log('main: push event: [message]: ', event);
//   tell(event.data);
// });
// onPushEvent('say', (event) => {
//   console.log('main: push event: [say]: ', event);
//   if (event.data.trim() != "") {
//     setState(STATES.speaking, {
//       text: event.data,
//       images: []
//     });
//   }
// });

// initTodoist();
// onTask((task) => {
//   console.log('todoist task: ', task.content);
//   window.tell(task.content);
// });

// initNeuro();
// window.queryNeuro = queryNeuro;

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
