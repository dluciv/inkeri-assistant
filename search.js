import { response_default_template, t_ga } from './misc.js';
import { inkeris } from './words.js';
import { BRAINS_BASE_URL } from './settings.js';

const searchFull = async (text, idx) => {
  try {
    const resp = await fetch(`${BRAINS_BASE_URL}short-thought?q=${encodeURIComponent(text)}` + ((idx === null) ? '' : `&idx=${idx}`), {
      credentials: 'include'
    });

    const json = await resp.json();
    const respText = json.response;
    const longtext = json.longtext;

    if (longtext && longtext.length >= data.length) {
      return longtext;
    }
    else if (respText) {
      t_ga('search', 'bad_or_small_full_search_long_response', json.href);
      return respText;
    }
    else {
      console.log('Error. Failed to parse response.\n', json);
      t_ga('search', 'bad_full_search_response', JSON.stringify(json));
      throw 'Failed to parse response';
    }
  }
  catch (error) {
    console.log('Error. ', error);
    t_ga('search', 'failed_to_get_response', error.toString());
    throw error;
  }
}

const storeAnswer = async (question, answer, engine) => {
  try {
    const resp = await fetch(`${BRAINS_BASE_URL}store-answer?format=json`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        q: question,
        a: answer,
        e: engine
      })
    });
    
    console.log('search: storeAnswer: saved.', resp);
  }
  catch (error) {
    console.log('search: storeAnswer: error:', error);
  }
}

const searchAnswer = async (text) => {
  try {
    const resp = await fetch('https://cors-anywhere.herokuapp.com/https://api.duckduckgo.com/?q=' + encodeURIComponent(text) + '&format=json');
    const data = await resp.json();

    if (data) {
      return data;
    }
    else {
      console.log('Error. Failed to parse response.\n', resp);
      t_ga('search', 'bad_response', resp.toString());
      
      throw 'Failed to parse response';
    }
  }
  catch (error) {
    console.log('Error. ', error);
    t_ga('search', 'failed_to_get_response', errortoString());
    
    throw error;
  }
}

var clearSpeech = function(speechResult) {
  _.each(inkeris, (ink) => {
    speechResult = speechResult.replace(ink, "");
  });
  return speechResult
    .toLowerCase()
    .replace("расскажи", "")
    .replace("такое", "")
    .replace("такой", "")
    .replace("что-нибудь", "")
    .replace("что ", " ")
    .replace("кто ", " ")
    .replace("мне ", " ")
    .replace(" про ", " ")
    .replace(" о ", " ")
    .replace("какая ", " ")
    .trim();
}

var last_speechResultTrimmed = null;
var lastSearchWasFull = false;
var lastSearchResultIdx = -1;

export const search = async (speechResult) => {
  try {
    const speechResultTrimmed = clearSpeech(speechResult);
    t_ga('speech_recognition', 'question', speechResultTrimmed);

    const resp = await searchAnswer(speechResultTrimmed);

    if (resp.AbstractText) {
      console.log("search: from AbstractText");

      const response = resp.AbstractText;
      await storeAnswer(speechResultTrimmed, response, 'duckduckgo');

      last_speechResultTrimmed = speechResultTrimmed;
      lastSearchWasFull = false;
      lastSearchResultIdx = -1;

      return response;
    }

    if (resp.RelatedTopics && Array.isArray(resp.RelatedTopics) && resp.RelatedTopics.length > 0 && resp.RelatedTopics[0].Result) {
      console.log("search: from RelatedTopics");

      const response = $("<span>" + resp.RelatedTopics[0].Result + "</span>").children('a[href*="duckduckgo.com/"]').remove().end().text();
      await storeAnswer(speechResultTrimmed, response, 'duckduckgo');

      last_speechResultTrimmed = speechResultTrimmed;
      lastSearchWasFull = false;
      lastSearchResultIdx = -1;

      return response;
    }

    console.log("search: full");

    const searchResp = await searchFull(speechResultTrimmed, null);
    
    last_speechResultTrimmed = speechResultTrimmed;
    lastSearchWasFull = true;
    lastSearchResultIdx = -1;

    return searchResp;
  }
  catch (error) {
    const response = response_default_template({ speechResult : speechResult });
    try {
      await storeAnswer(speechResultTrimmed, response, 'constant');
    }
    catch (error2) {
      console.log('Error:', error2);
    }

    last_speechResultTrimmed = speechResultTrimmed;
    lastSearchWasFull = true;
    lastSearchResultIdx = -2;

    return response;
  }
}

export const next = async () => {
  console.log('search: next: last_speechResultTrimmed: ', last_speechResultTrimmed);
  console.log('search: next: lastSearchResultIdx: ', lastSearchResultIdx);
  console.log('search: next: lastSearchWasFull: ', lastSearchWasFull);

  try {
    if (lastSearchResultIdx < -1) {
      const response = response_default_template({ speechResult : speechResult });
      await storeAnswer(last_speechResultTrimmed, response, 'constant');

      // last_speechResultTrimmed = last_speechResultTrimmed;
      lastSearchWasFull = false;
      lastSearchResultIdx = -2;

      return response;
    }

    const newIdx = lastSearchWasFull ? lastSearchResultIdx + 1 : 0;
    const resp = await searchFull(last_speechResultTrimmed, newIdx);
        
    // last_speechResultTrimmed = last_speechResultTrimmed;
    lastSearchWasFull = true;
    lastSearchResultIdx = newIdx;

    return resp;
  }
  catch (error) {
    console.log('search: error:', error);

    const response = response_default_template({ speechResult : speechResult });
    try {
      await storeAnswer(last_speechResultTrimmed, response, 'constant');
    }
    catch (error2) {
      console.log('Error:', error2);
    }

    // last_speechResultTrimmed = last_speechResultTrimmed;
    lastSearchWasFull = true;
    lastSearchResultIdx = -1;

    return response;
  }
}
