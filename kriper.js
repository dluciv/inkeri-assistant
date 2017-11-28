import { t_ga } from './misc.js';

// const KRIPER_URL = 'https://kriper.ru/random';
const KRIPER_URL = 'https://cors-anywhere.herokuapp.com/https://kriper.ru/random';

var getFinalUrl = function(xhr) {
  var headers = xhr.getAllResponseHeaders().split('\n');
  var found = _.find(headers, (h) => h.trim().startsWith('x-final-url'));
  if (!found) {
    return null;
  }
  var pair = found.split(':');
  if (pair.length < 3) {
    console.log('wrong x-final-url header. ', headers);
    return null;
  }
  return pair[1].trim() + pair[2].trim();
}

var loadKriperStory = function(callback) {
  $.ajax({
    url: KRIPER_URL,
    method: 'GET',
    success: function(resp, result, xhr) {
      var finalUrl = getFinalUrl(xhr);
      t_ga('duckduckgo', 'kriper_redirect', finalUrl);
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
