import { t_ga } from './misc.js';
import { BRAINS_BASE_URL } from './settings.js';

let cleanup = ($pageText) => {
  console.log('reader: cleanup: before: ', $pageText);
  return $pageText.not('script').not('img').text();
}
let extractImages = (baseUrl, $pageText) => {
  return $pageText.find('img').map((i, el) => baseUrl + $(el).attr('src'));
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
    xhrFields: {
      withCredentials: true
    },
    success: function(resp, result, xhr) {
      window.resp = resp;
      let $content = $(resp.content);
      let baseUrl = url.split('/').slice(0, 3).join('/') + '/';
      let images = extractImages(baseUrl, $content);
      console.log('images: ', images);
      callback(resp.title + '\n' + cleanup($content), images);
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
