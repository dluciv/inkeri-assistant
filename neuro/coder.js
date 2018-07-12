// version 0 - each symbol is encoded and given to input
const word2input = function(str) {
  var result = new Array(str.length);
  for (var i = 0; i < str.length; i++) {
    var keyCode = str.charCodeAt(i);
    // 65-122 - en letters
    // 1040-1103 - ru letters
    // 0-64 - symbols
    result[i] = keyCode / 1103;
  }
  return result;
}

// version 1 - presence of each symbol is given to input
const alphabet = "-@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZабвгдеёжзийклмнопрстуфхцчшщъьыэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЫЭЮЯ".split("");
// var alphabet = "абвгдеёжзийклмнопрстуфхцчшщъьыэюя".split("");
const word2input_1 = function(str) {
  var counts = _.mapValues(_.keyBy(alphabet, (letter) => letter), (letter) => 0);
  _.each(str, (letter) => {
    if (letter in counts) {
      counts[letter]++;
    }
  });
  return _.values(counts);
}

// version 2 -
const pairs = _.flatMap(alphabet, (l1) => _.map(alphabet, (l2) => l1 + l2));
const word2input_2 = function(str) {
  var part0 = str.length;

  var counts = _.mapValues(_.keyBy(alphabet, (letter) => letter), (letter) => 0);
  _.each(str, (letter) => {
    if (letter in counts) {
      counts[letter]++;
    }
  });
  var part1 =  _.values(counts);

  var pcounts = _.mapValues(_.keyBy(pairs, (p) => p), (p) => 0);
  var pairs2 = _.flatMap(str, (l1) => _.map(str, (l2) => l1 + l2));
  _.each(pairs2, (p) => {
    if (p in pcounts) {
      pcounts[p]++;
    }
  });
  var part2 =  _.values(pcounts);

  return _.concat(part0, part1, part2);
}

const word2input_3 = function(str) {
  var part0 = str.length;

  var counts = _.mapValues(_.keyBy(alphabet, (letter) => letter), (letter) => 0);
  _.each(str, (letter) => {
    if (letter in counts) {
      counts[letter]++;
    }
  });
  var part1 =  _.values(counts);

  return _.concat(part0, part1);
}

const output2words = async (output) => {
  const dbClient = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });
  await dbClient.connect();

  let dbRes = await dbClient.query('SELECT * FROM nn_words_known');
  let res = dbRes.rows.map((row) => [ row.word, output[row.id - 1] ]);
  const stableKnownWordsLen = dbRes.rows.length;

  dbRes = await dbClient.query('SELECT matched_word FROM nn_training_set_tmp GROUP BY matched_word');
  for (var i in dbRes.rows){
    const row = dbRes.rows[i];
    res.push([row.matched_word, output[stableKnownWordsLen + i]]);
  }

  await dbClient.end();

  return res;
}

const width = word2input_3("test").length;

let trainingSet = null;
let checkSet = null;

const createTrainingSet = async () => {
  const checkPartVal = 0.05;
  const minGroupSizeToSplit = 100;
  
  const dbClient = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });
  await dbClient.connect();

  trainingSet = [];
  checkSet = [];

  var knownWordsIdx = {};
  let dbRes = await dbClient.query('SELECT * FROM nn_words_known');
  for (var i in dbRes.rows) {
    const row = dbRes.rows[i];
    knownWordsIdx[row.word] = row.id - 1; // pg indexes start from 1
  }
  maxKnownWordsIdx = _.max(_.values(knownWordsIdx));

  var set = {};
  dbRes = await dbClient.query('SELECT * FROM nn_training_set');
  for (var i in dbRes.rows) {
    const row = dbRes.rows[i];
    if (!(row.word in set)) {
      set[row.word] = new Array(width + 1).fill(null);
    }
    set[row.word][row.matched_word - 1] = row.match_result ? 1.0 : 0.0;
  }

  var newMatchedWordsIdx = {};
  dbRes = await dbClient.query('SELECT * FROM nn_training_set_tmp');
  for (var i in dbRes.rows) {
    const row = dbRes.rows[i];
    if (!(row.matched_word in knownWordsIdx)) {
      knownWordsIdx[row.matched_word] = maxKnownWordsIdx + 1;
      maxKnownWordsIdx++;
    }

    if (!(row.word in set)) {
      set[row.word] = new Array(width + 1).fill(null);
    }
    set[row.word][knownWordsIdx[row.matched_word]] = row.match_result ? 1.0 : 0.0;
  }

  await dbClient.end();

  const fullSet = _.map(set, (val, key) => [key, val])
  // for (var i in fullSet) {
  //   console.log('training set: word: ', res[i][0], " ; encoded: ", JSON.stringify(res[i][1]), " ; len: ", res[i][1].length);
  // }

  const grouped = _.groupBy(fullSet, (r) => r[1]);
  for (var key in grouped) {
    const setEntries = grouped[key];
    console.log('training group: key: ', JSON.stringify(key.slice(0, 5)));
    for (var i in setEntries) {
      console.log('training group: word: ', setEntries[i][0], " ; encoded: ", JSON.stringify(setEntries[i][1].slice(0, 5)), " ; len: ", setEntries[i][1].length);
    }
    if (_.filter(setEntries[0][1], (r) => r == 1.0).length == 1) { // result is like 0 0 1 0 0 0 0 0
      const groupLen = setEntries.length;
      const checkEntriesLen = Math.ceil(groupLen * checkPartVal);
      if (checkEntriesLen != groupLen && groupLen >= minGroupSizeToSplit) {
        var sentToCheckSet = 0;
        setEntries.forEach((e) => {
          if (sentToCheckSet < checkEntriesLen && Math.random() < checkPartVal) {
            checkSet.push(e);
            sentToCheckSet++;
          }
          else {
            trainingSet.push(e);
          }
        });
      }
      else {
        trainingSet = trainingSet.concat(setEntries);
      }
    }
    else {
      trainingSet = trainingSet.concat(setEntries);
    }
  }

  for (var i in trainingSet) {
    console.log('training set: word: ', trainingSet[i][0], " ; encoded: ", JSON.stringify(trainingSet[i][1].slice(0, 5)), " ; len: ", trainingSet[i][1].length);
  }
  for (var i in checkSet) {
    console.log('check set: word: ', checkSet[i][0], " ; encoded: ", JSON.stringify(checkSet[i][1].slice(0, 5)), " ; len: ", checkSet[i][1].length);
  }

  return trainingSet;
}

const getTrainingSet = async () => {
  if (!trainingSet) {
    await createTrainingSet();
  }

  return trainingSet;
}
const getCheckSet = async () => {
  if (!checkSet) {
    await createTrainingSet();
  }

  return checkSet;
}
const reloadTrainingSet = () => {
  trainingSet = null;
  checkSet = null;
}

export { word2input_3 as word2input };
export { output2words };
export { getTrainingSet };
export { getCheckSet };
export { reloadTrainingSet };
