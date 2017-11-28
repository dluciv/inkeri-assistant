import { t_ga } from './misc.js';

// const KRIPER_URL = 'https://kriper.ru/random';
const KRIPER_URL = 'https://cors-anywhere.herokuapp.com/https://kriper.ru/random';

var loadKriperStory = function(callback) {
  $.ajax({
    url: KRIPER_URL,
    method: 'GET',
    success: function(resp) {
      var text = $('#content .text', resp).text();
      callback(text);
    },
    error: function(err) {
      console.log('Error. ', err);
      t_ga('duckduckgo', 'failed_to_get_response', err.toString());
      callback("Ничего не нашла");
    }
  });
}

export { loadKriperStory }
