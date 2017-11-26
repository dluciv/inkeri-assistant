import { response_default_template, t_ga } from './misc.js';

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
  return speechResult
    .toLowerCase()
    .replace("инкери", "")
    .replace("расскажи", "")
    .replace("такое", "")
    .replace("такой", "")
    .replace("что-нибудь", "")
    .replace("что", "")
    .replace("кто", "")
    .replace("мне", "")
    .replace("про", "")
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
	response = resp.AbstractText;
      }
      else if (resp.RelatedTopics && Array.isArray(resp.RelatedTopics) && resp.RelatedTopics.length > 0 && resp.RelatedTopics[0].Result) {
	response = $("<span>" + resp.RelatedTopics[0].Result + "</span>").children('a[href*="duckduckgo.com/"]').remove().end().text();
      }
      else {
	response = response_default_template({ speechResult : speechResultTrimmed });
      }
      
      callback(response);
    },
    function() {
      callback(response_default_template({ speechResult : speechResult }));
    });
}
