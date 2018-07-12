import { t_ga } from '../misc.js';
import { BRAINS_BASE_URL } from '../settings.js';
import { Network } from './network.js';
import { word2input } from './coder.js';

let network = null;
let words = [];

const init = async () => {
  const response = await fetch(`${BRAINS_BASE_URL}nn-conf`, { credentials: 'include' });
  const conf = await response.text();
  const response2 = await fetch(`${BRAINS_BASE_URL}nn-words`, { credentials: 'include' });
  const ws = await response2.text();

  network = new Network(JSON.parse(conf));
  words = JSON.parse(ws);
}

const query = (word) => {
  const cres = network.calculate(word2input(word));

  return _.zip(words, cres.slice(0, words.length));
}

export { init, query };
