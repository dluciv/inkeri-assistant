import { declinateUnit } from './misc.js';

const seals_ok = "Ситуация с тюленями обнадёживающая.";
const seals_not_ok = "Ситуация с тюленями угрожающая.";
const seals_default = "Ситуация с тюленями спокойная.";

const seal_back_value_template = _.template('Фон — <%= micro_tul_hour %> микро<%= declinated %> в час.');
const seal_text_template       = _.template('<%= status_text %> <%= back_text %> Центр реабилитации морских млекопитающих Ленинградской области сообщает. <%= text %>');

const seals_url = 'https://matrix.dluciv.name/vksealrescuerss';

var seal_back_value = " ";
var seal_status_text = "";
var seal_text = "";

var get_ewma = function(now, moments, half_life, notolder) {

  var events = moments.slice();
  events.sort();
  var total_weighted_events = 0.0;

  for(var i = 0; i < events.length; ++i) {
    var e = events[i];
    var d = (now - e) / 1000.0;
    if(d > notolder)
      continue;
    var weight = Math.pow(2, -d/half_life);
    total_weighted_events += weight;
  }

  // total_weighted_seconds = \sum_{d = 0}^{analysis_period} 2^{-d/half_life} =
  // \frac{1 - q^n}{1-q}, q^{half_life} = 1/2.

  var q = Math.pow(2, -1/half_life);
  var total_weighted_time = (1 - Math.pow(q, notolder)) / (1 - q);

  return total_weighted_events / total_weighted_time;
}

var measure_seal_background = function(parsed) {
  var now = new Date().getTime();
  var pubdates = [];
  $(parsed).find('item pubDate').each(function(){
    pubdates.push(new Date($(this).text()).getTime());
  });

  var halflife = 60*60*24*1; // 1 сутки - период полураспада события
  var ap = 31536000 / 12; // анализируем за месяц
  var tulsec = get_ewma(now, pubdates, halflife, ap);
  var micro_tul_hour = Math.round(tulsec * 1e6 * 3600);
  seal_back_value = seal_back_value_template({
    micro_tul_hour : micro_tul_hour,
    declinated     : declinateUnit(micro_tul_hour, "тюлень")
  });
}

export function loadSealStatus(callback) {
  $.ajax({
    method: 'GET',
    url: seals_url,
    success: function(data) {
      // console.log('ok', data);
      var parsed = $.parseXML(data);
      
      measure_seal_background(parsed);
      
      var posts = $(parsed).find('item');
      var postdate = (post) => new Date($(post).find('pubDate').text()).getTime();
      var sortedPosts = posts.sort((p1, p2) => postdate(p2) - postdate(p1))
      var lastPostHtml = $(sortedPosts).first().find('description').first().text();
      var lastPostText = $(lastPostHtml).text();    
      console.log(lastPostText);
      
      if (lastPostText != null && lastPostText != undefined && lastPostText.trim() != '') {
	var moodInfo = analyze(lastPostText);
	// console.log('mood:', moodInfo);

	seal_status_text = (status >= 0) ? seals_ok : seals_not_ok;
	seal_text        = seal_text_template({
	  status_text : seal_status_text,
	  back_text   : seal_back_value,
	  text        : lastPostText
	});

	if (callback)
	  callback(moodInfo.score, lastPostText);
      }
    },
    error: function(err) {
      console.log('err', err);
      t_ga('news', 'news_retrieval_error', err.toString());
      if (callback)
	callback(0, "");
    }
  })
}

export function getSealStatusText() {
  return seal_status_text;
}
export function getSealText() {
  return seal_text;
}
export function getSealBackValue() {
  return seal_back_value;
}
