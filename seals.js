import { declinateUnit, calculateWeightedAverage } from './misc.js';

const seals_ok = "Ситуация с тюленями обнадёживающая.";
const seals_not_ok = "Ситуация с тюленями угрожающая.";
const seals_default = "Ситуация с тюленями спокойная.";

const seal_back_value_template = _.template('Фон — <%= micro_tul_hour %> микро<%= declinated %> в час.');
const seal_text_template       = _.template('<%= status_text %> <%= back_text %> Центр реабилитации морских млекопитающих Ленинградской области сообщает. <%= text %>');

const seals_url = 'https://cors-anywhere.herokuapp.com/http://myfeeds.info/?2angrbmt';

var seal_back_value = " ";
var seal_status_text = "";
var seal_text = "";

var measure_seal_background = function(parsed) {
  var now = new Date().getTime();
  var pubdates = [];
  $(parsed).find('item pubDate').each(function(){
    pubdates.push(new Date($(this).text()).getTime());
  });

  var halflife = 60*60*24*1; // 1 сутки - период полураспада события
  var ap = 31536000 / 12; // анализируем за месяц
  var tulsec = calculateWeightedAverage(now, pubdates, halflife, ap);
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
