import { t_ga } from './misc.js';

let cleanup = (pageText) => {
  return $(pageText).not('script').text();
}

let readUrl = function(url, callback) {
  var urlWithHeroku = 'https://cors-anywhere.herokuapp.com/' + url;

  $.ajax({
    url: urlWithHeroku,
    method: 'GET',
    success: function(resp, result, xhr) {
      window.resp = resp;
      callback(cleanup(resp));
    },
    error: function(err) {
      console.log('Error. ', err);
      t_ga('search', 'failed to read url', err.toString());
      callback("Ничего не нашла");
    }
  });
}

export { readUrl }
