import { VOICE_NAME, VOICE_RATE, VOICE_PITCH, VOICE_LANG } from './settings.js'

let voice = null;
let synth = null;

export const init = () => {
    synth = window.speechSynthesis;

    // linux:
    // :: chromium does not have built-in speech engine
    // :: firefox-developer-edition optionally requires speech-dispatcher: Text-to-Speech
    // :: qt5-speech optionally requires speech-dispatcher: speech-dispatcher TTS backend
    // => speech-dispatcher is needed
    // as speech engine RHVoice worked fine for me

    const allVoices = synth.getVoices();
    const ruVoices = allVoices.filter((v) => v.lang == 'ru' || v.lang == 'ru-RU');

    console.log('speech: init: ru voices:', ruVoices);
    console.log('speech: init: all voices:', allVoices);

    const voices = ruVoices.length > 0 ? ruVoices : allVoices;

    voice =
        voices.find(v => v.name === VOICE_NAME)
        ?? voices.find(v => v.default)
        ?? voices[0];
    console.log('speech: init: voice:', voice);
}

export const speak = (textToSpeak, callback) => {
    if (voice == null) {
        init();
    }

    if (voice == null) {
        throw 'Failed to get voice';
    }

    // window, not var because onend does not trigger otherwise
    // https://bugs.chromium.org/p/chromium/issues/detail?id=509488#c11
    window.utterThis = new SpeechSynthesisUtterance(textToSpeak);
    utterThis.rate = VOICE_RATE;
    utterThis.pitch = VOICE_PITCH;
    utterThis.lang = VOICE_LANG;
    utterThis.voice = voice;

    utterThis.addEventListener('end', callback);
    
    try {
        synth.speak(utterThis);
    }
    catch (error) {
        console.log('speech: speak: error:', error);
        throw error;
    }
}