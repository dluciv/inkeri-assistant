const REMEMBER_PROBABILITY = 0.1;

var randomSpeech = function(onSuccess, onError) {
  $.ajax({
    url: 'https://inkeri-api.herokuapp.com/random-knowledge',
    method: 'GET',
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
