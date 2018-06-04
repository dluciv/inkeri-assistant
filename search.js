import { response_default_template, t_ga } from './misc.js';
import { inkeris } from './words.js';
import { BRAINS_BASE_URL } from './settings.js';

var searchFull = function(text, idx, onSuccess, onError) {
  $.ajax({
    url: `${BRAINS_BASE_URL}short-thought?q=${encodeURIComponent(text)}` + ((idx === null) ? '' : `&idx=${idx}`),
    method: 'GET',
    dataType: 'json',
    success: function(resp) {
      let data = resp.response;
      let longtext = resp.longtext;
      if (longtext && longtext.length >= data.length) {
        onSuccess(longtext);
      } else if (data) {
        t_ga('search', 'bad_or_small_full_search_long_response', resp.href);
        onSuccess(data);
      } else {
        console.log('Error. Failed to parse response.\n', resp);
        t_ga('search', 'bad_full_search_response', resp.toString());
        onError();
      }
    },
    error: function(err) {
      console.log('Error. ', err);
      t_ga('search', 'failed_to_get_response', err.toString());
      onError();
    }
  });
}

var storeAnswer = function(question, answer, engine) {
  $.ajax({
    url: `${BRAINS_BASE_URL}store-answer?format=json`,
    method: 'GET',
    data: {
      q: question,
      a: answer,
      e: engine
    },
    success: function(resp) {
      console.log('search: storeAnswer: saved.', resp);
    },
    error: function(err) {
      console.log('search: storeAnswer: error:', err);
    }
  });
}

var searchAnswer = function(text, onSuccess, onError) {
  $.ajax({
    url: 'https://cors-anywhere.herokuapp.com/https://api.duckduckgo.com/?q=' + encodeURIComponent(text) + '&format=json',
    method: 'GET',
    success: function(resp) {
      var data = JSON.parse(resp);
      if (data) {
        onSuccess(data);
      } else {
        console.log('Error. Failed to parse response.\n', resp);
        t_ga('search', 'bad_response', resp.toString());
        onError();
      }
    },
    error: function(err) {
      console.log('Error. ', err);
      t_ga('search', 'failed_to_get_response', err.toString());
      onError();
    }
  });
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

var search = function (speechResult, callback) {
  var speechResultTrimmed = clearSpeech(speechResult);
  t_ga('speech_recognition', 'question', speechResultTrimmed);

  searchAnswer(
    speechResultTrimmed,
    function(resp) {
      // console.log(resp);
      var response;
      if (resp.AbstractText) {
        console.log("search: from AbstractText");
        let response = resp.AbstractText;
        storeAnswer(speechResultTrimmed, response, 'duckduckgo');

        last_speechResultTrimmed = speechResultTrimmed;
        lastSearchWasFull = false;
        lastSearchResultIdx = -1;

        callback(response);
      }
      else if (resp.RelatedTopics && Array.isArray(resp.RelatedTopics) && resp.RelatedTopics.length > 0 && resp.RelatedTopics[0].Result) {
        console.log("search: from RelatedTopics");
        let response = $("<span>" + resp.RelatedTopics[0].Result + "</span>").children('a[href*="duckduckgo.com/"]').remove().end().text();
        storeAnswer(speechResultTrimmed, response, 'duckduckgo');

        last_speechResultTrimmed = speechResultTrimmed;
        lastSearchWasFull = false;
        lastSearchResultIdx = -1;

        callback(response);
      }
      else {
        console.log("search: full");
        searchFull(speechResultTrimmed, null, (resp) => {
          last_speechResultTrimmed = speechResultTrimmed;
          lastSearchWasFull = true;
          lastSearchResultIdx = -1;

          callback(resp);
        }, () => {
          var response = response_default_template({ speechResult : speechResult });
          storeAnswer(speechResultTrimmed, response, 'constant');

          last_speechResultTrimmed = speechResultTrimmed;
          lastSearchWasFull = true;
          lastSearchResultIdx = -2;

          callback(response);
        });
      }
    },
    function() {
      var response = response_default_template({ speechResult : speechResult });
      storeAnswer(speechResultTrimmed, response, 'constant');

      last_speechResultTrimmed = speechResultTrimmed;
      lastSearchWasFull = false;
      lastSearchResultIdx = -2;

      callback(response);
    });
}

var next = function(callback) {
  console.log('search: next: last_speechResultTrimmed: ', last_speechResultTrimmed);
  console.log('search: next: lastSearchResultIdx: ', lastSearchResultIdx);
  console.log('search: next: lastSearchWasFull: ', lastSearchWasFull);
  if (lastSearchResultIdx < -1) {
    var response = response_default_template({ speechResult : speechResult });
    storeAnswer(last_speechResultTrimmed, response, 'constant');

    // last_speechResultTrimmed = last_speechResultTrimmed;
    lastSearchWasFull = false;
    lastSearchResultIdx = -2;

    callback(response);
  }
  else {
    var newIdx = lastSearchWasFull ? lastSearchResultIdx + 1 : 0;
    searchFull(last_speechResultTrimmed, newIdx, (resp) => {
      // last_speechResultTrimmed = last_speechResultTrimmed;
      lastSearchWasFull = true;
      lastSearchResultIdx = newIdx;

      callback(resp);
    }, () => {
      var response = response_default_template({ speechResult : speechResult });
      storeAnswer(last_speechResultTrimmed, response, 'constant');

      // last_speechResultTrimmed = last_speechResultTrimmed;
      lastSearchWasFull = true;
      lastSearchResultIdx = -1;

      callback(response);
    });
  }
}

export { search, next };
