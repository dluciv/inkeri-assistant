import { t_ga } from './misc.js';
import { BRAINS_BASE_URL } from './settings.js';

const REMEMBER_PROBABILITY = 0.05;

var randomSpeech = function(onSuccess, onError) {
  $.ajax({
    url: `${BRAINS_BASE_URL}random-knowledge`,
    method: 'GET',
    xhrFields: {
      withCredentials: true
    },
    dataType: 'json',
    success: function(resp) {
      var query = resp.query;
      var response = resp.response;

      if (query === undefined || response === undefined || response.trim() == "") {
        onError();
        return;
      }
      
      console.log("randomSpeech: query: ", query);
      console.log("randomSpeech: response: ", response);
      onSuccess(response);
    },
    error: function(err) {
      console.log('Error. ', err);
      t_ga('search', 'failed_to_get_response', err.toString());
      onError();
    }
  });
}

export { randomSpeech, REMEMBER_PROBABILITY }
