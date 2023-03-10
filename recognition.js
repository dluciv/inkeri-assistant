let SpeechRecognition = null;
let SpeechGrammarList = null;
let SpeechRecognitionEvent = null;

let recognitions = {}; // { [id]: { id: string, recognition: Recognition, prevSpeechResult: string } }
let initialized = false;

const createRecognition = (config) => {
    let recognition;

    try {
        recognition = new SpeechRecognition();
    } catch (e) {
        console.log(e);
        t_ga('speech_recognition', 'no_browser_support', navigator.userAgent + " -----> " + e.toString());
        log_for_user("Ваш браузер не поддерживает распознавание речи. Пожалуйста откройте страницу в Google Chrome.");

        return null;
    }

    recognition.lang = 'ru-RU';
    recognition.interimResults = config.interimResults;
    recognition.continuous = config.isAlwaysOn;
    // recognition.maxAlternatives = 0;
}

const onResult = (recognition, event, callback) => {
    var speechResults =
        _.flatMap(event.results, (res) => _.map(res, (res2) => [ res2?.transcript.toLowerCase().trim() , res2.confidence ]))
        .filter(res => res[0] != null && res[0] !== '');

    console.log(`recognition: [${recognition.id}]: onResult: results: '${speechResults}'`);

    if (speechResults.length === 0) {
        console.log(`recognition: [${recognition.id}]: onResult: empty result`);
        return;
    }

    const speechResult = speechResults[0][0];
    
    if (speechResult === recognition.prevSpeechResult) {
        console.log(`recognition: [${recognition.id}]: onResult: duplicate`);
        return;
    }

    recognition.prevSpeechResult = speechResult;

    callback(speechResult, speechResults);
}

const onError = (recognition, event, callback) => {
    console.log(`recognition: [${recognition.id}]: onError: error: '${event.error}'`);
    t_ga('speech_recognition', 'recognition_error', event.error.toString());

    callback(event.error);
}

const onEnd = (recognition, callback) => {
    console.log(`recognition: [${recognition.id}]: onEnd`);

    callback();
}

export const init = () => {
    SpeechRecognition = window.SpeechRecognition;
    if (!SpeechRecognition && window.webkitSpeechRecognition) {
        SpeechRecognition = window.webkitSpeechRecognition;
    }

    SpeechGrammarList = window.SpeechGrammarList;
    if (!SpeechGrammarList && window.webkitSpeechGrammarList) {
        SpeechGrammarList = window.webkitSpeechGrammarList;
    }

    SpeechRecognitionEvent = window.SpeechRecognitionEvent;
    if (!SpeechRecognitionEvent && window.webkitSpeechRecognitionEvent) {
        SpeechRecognitionEvent = window.webkitSpeechRecognitionEvent;
    }

    initialized = SpeechRecognition != null;
}

export const create = (id, config) => {
    if (!initialized) {
        console.log('recognition: create: not available');
        return null;
    }

    const recognition = createRecognition(config);

    if (recognition == null) {
        return null;
    }

    const entry = {
        id: id,
        recognition: recognition,
        prevSpeechResult: null
    };

    recognition.onresult = (event) => { onResult(entry, event, config.onResult); };
    recognition.onerror = (event) => { onError(entry, event, config.onError); };
    recognition.onend = (event) => { onEnd(entry, config.onResult); };

    recognitions[id] = entry;

    return recognition;
}

export const start = (id) => {
    if (!initialized) {
        console.log('recognition: start: not available');
        return;
    }

    const recogition = recognitions[id];
    
    if (recogition == null) {
        console.log(`recognition: [${ id }]: start: not found`);
        return;
    }

    try {
        recogition.recogition.start();
    }
    catch (error) {
        console.log(`recognition: [${ id }]: start: error: ${error}`);

        throw error;
    }
}

export const stop = (id) => {
    const recogition = recognitions[id];
    
    if (recogition == null) {
        console.log(`recognition: [${ id }]: stop: not found`);
        return;
    }

    try {
        recogition.recogition.stop();
    }
    catch (error) {
        console.log(`recognition: [${ id }]: stop: error: ${error}`);

        throw error;
    }
}