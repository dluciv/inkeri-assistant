import { query } from './neuro/index.js';

export const inkeris = [ "инкери", "inquiries", "интере", "интервью", "интерьер", "intellij", "игры", "inferi", "intel", "inquiry", "гири", "энгри"];
export const STOP_WORDS = ["хватит", "молчи", "спасибо", "довольно"];
export const NEXT_WORDS = ["ещё", "еще", "следующий", "дальше", "едущий", "next"];

const NN_THRESHOLD = 0.8;

export function matchInkeri(speechResult) {
  // return _.some(inkeris, (w) => speechResult == w || speechResult.includes(w));

  const splitted = speechResult.split(" ");
  for (var i in splitted) {
    const word = splitted[i];
    const qres = query(word);
    const qresEntry = _.find(qres, (p) => p[0] == "инкери");
    if (qresEntry && qresEntry[1] >= NN_THRESHOLD) {
      return true;
    }
  }

  return false;
}
export function matchInkeriAny(speechResults) {
  // return _.some(speechResults, (speechResult) => _.some(inkeris, (w) => speechResult == w || speechResult.includes(w)));

  const splitted = _.flatMap(speechResults, (speechResult) => speechResult.split(" "));
  for (var i in splitted) {
    const word = splitted[i];
    const qres = query(word);
    const qresEntry = _.find(qres, (p) => p[0] == "инкери");
    if (qresEntry && qresEntry[1] >= NN_THRESHOLD) {
      return true;
    }
  }

  return false;
}

export function matchNext(speechResult) {
  //  return _.some(NEXT_WORDS, (w) => speechResult == w || speechResult.includes(w));
  console.log("matchNext: speechResult: ", speechResult);

  const splitted = speechResult.split(" ");
  for (var i in splitted) {
    const word = splitted[i];
    const qres = query(word);
    const qresEntry = _.find(qres, (p) => p[0] == "ещё");
    if (qresEntry && qresEntry[1] >= NN_THRESHOLD) {
      console.log("matchNext: matched");
      return true;
    }
  }

  return false;
}
export function matchNextAny(speechResults) {
  const splitted = _.flatMap(speechResults, (speechResult) => speechResult.split(" "));
  for (var i in splitted) {
    const word = splitted[i];
    const qres = query(word);
    const qresEntry = _.find(qres, (p) => p[0] == "ещё");
    if (qresEntry && qresEntry[1] >= NN_THRESHOLD) {
      return true;
    }
  }

  return false;
}

export function matchStop(speechResult) {
  return _.some(STOP_WORDS, (w) => speechResult == w || speechResult.includes(w));
}
export function matchStopAny(speechResults) {
  return _.some(speechResults, (speechResult) => _.some(STOP_WORDS, (w) => speechResult == w || speechResult.includes(w)));
}
