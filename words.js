export const inkeris = [ "инкери", "inquiries", "интере", "интервью", "интерьер", "intellij", "игры", "inferi", "intel", "inquiry" ];
export const STOP_WORDS = ["хватит", "молчи", "спасибо", "довольно"];
export const NEXT_WORDS = ["ещё", "следующий", "дальше"];

export function matchInkeri(speechResult) {
  return _.some(inkeris, (w) => speechResult == w || speechResult.includes(w));
}
export function matchInkeriAny(speechResults) {
  return _.some(speechResults, (sr) => _.some(inkeris, (w) => speechResult == w || speechResult.includes(w)));
}

export function matchNext(speechResult) {
  return _.some(NEXT_WORDS, (w) => speechResult == w || speechResult.includes(w));
}
export function matchNextAny(speechResults) {
  return _.some(speechResults, (sr) => _.some(NEXT_WORDS, (w) => speechResult == w || speechResult.includes(w)));
}

export function matchStop(speechResult) {
  return _.some(STOP_WORDS, (w) => speechResult == w || speechResult.includes(w));
}
export function matchStopAny(speechResults) {
  return _.some(speechResults, (sr) => _.some(STOP_WORDS, (w) => speechResult == w || speechResult.includes(w)));
}
