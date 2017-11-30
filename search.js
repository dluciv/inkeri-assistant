import { response_default_template, t_ga, inkeris } from './misc.js';

var searchFull = function(text, onSuccess, onError) {
  $.ajax({
    url: `https://inkeri-api.herokuapp.com/short-thought?q=${encodeURIComponent(text)}`,
    method: 'GET',
    dataType: 'json',
    success: function(resp) {
      let data = resp.response;
      if (data) {
	onSuccess(data);
      }
      else {
        console.log('Error. Failed to parse response.\n', resp);
        t_ga('duckduckgo', 'bad_full_search_response', resp.toString());
        onError();
      }
    },
    error: function(err) {
      console.log('Error. ', err);
      t_ga('duckduckgo', 'failed_to_get_response', err.toString());
      onError();
    }
  });
}

var searchAnswer = function(text, onSuccess, onError) {
  $.ajax({
    url: 'https://api.duckduckgo.com/?q=' + encodeURIComponent(text) + '&format=json',
    method: 'GET',
    success: function(resp) {
      var data = JSON.parse(resp);
      if (data) {
	onSuccess(data);
      }
      else {
        console.log('Error. Failed to parse response.\n', resp);
        t_ga('duckduckgo', 'bad_response', resp.toString());
        onError();
      }
    },
    error: function(err) {
      console.log('Error. ', err);
      t_ga('duckduckgo', 'failed_to_get_response', err.toString());
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
    .trim();
}

export function search(speechResult, callback) {
  var speechResultTrimmed = clearSpeech(speechResult);
  t_ga('speech_recognition', 'question', speechResultTrimmed);

  searchAnswer(
    speechResultTrimmed,
    function(resp) {
      // console.log(resp);
      var response;
      if (resp.AbstractText) {
	let response = resp.AbstractText;
        callback(response);
      }
      else if (resp.RelatedTopics && Array.isArray(resp.RelatedTopics) && resp.RelatedTopics.length > 0 && resp.RelatedTopics[0].Result) {
	let response = $("<span>" + resp.RelatedTopics[0].Result + "</span>").children('a[href*="duckduckgo.com/"]').remove().end().text();
        callback(response);
      }
      else {
        searchFull(speechResultTrimmed, (resp) => {
          callback(resp);
        }, () => {
          callback(response_default_template({ speechResult : speechResult }));
        });
      }
    },
    function() {
      callback(response_default_template({ speechResult : speechResult }));
    });
}
