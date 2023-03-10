import { t_ga } from './misc.js';

// const KRIPER_URL = 'https://kriper.ru/random';
const KRIPER_URL = 'https://cors-anywhere.herokuapp.com/https://kriper.ru/random';

const getFinalUrl = function(resp) {
  const headers = resp.headers;
  
  const found = headers.get('x-final-url');
  if (!found) {
    return null;
  }

  const pair = found.split(':');
  if (pair.length < 3) {
    console.log('wrong x-final-url header. ', headers);
    return null;
  }

  return pair[1].trim() + pair[2].trim();
}

export const loadKriperStory = async () => {
  try {
    const resp = await fetch(KRIPER_URL);

    const finalUrl = getFinalUrl(resp);
    t_ga('search', 'kriper_redirect', finalUrl);

    const rtext = await resp.text();
    const text = $('#content .text', rtext).text();

    return text;
  }
  catch (err) {
    console.log('Error. ', err);
    t_ga('search', 'failed_to_get_response', err.toString());
    
    return null;
  }
}