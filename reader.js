import { t_ga } from './misc.js';
import { BRAINS_BASE_URL } from './settings.js';

let cleanup = (pageText) => {
  return $(pageText).not('script').text();
}

let readUrlWithHeroku = function(url, callback) {
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

let readUrlText = function(url, callback) {
  var url2 = `${BRAINS_BASE_URL}urlText?url=${url}`;

  $.ajax({
    url: url2,
    method: 'GET',
    success: function(resp, result, xhr) {
      window.resp = resp;
      callback(resp.title + '\n' + cleanup(resp.content));
    },
    error: function(err) {
      console.log('Error. ', err);
      t_ga('search', 'failed to read url', err.toString());
      callback("Ничего не нашла");
    }
  });
}

let readUrl = readUrlText;

export { readUrl }
