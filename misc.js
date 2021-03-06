import { BRAINS_BASE_URL } from './settings.js';

var _units = {
  "градус" : ["градуса", "градусов"],
  "метр" : ["метра", "метров"],
  "миллиметр" : ["миллиметра", "миллиметров"],
  "процент": ["процента", "процентов"],
  "проценту": ["процентам", "процентам"],
  "тюлень": ["тюленя", "тюленей"],
};

for(var u in _units)
  if(_units.hasOwnProperty(u))
     _units[u].unshift(u);

export function declinateUnit(value, unit){
  var a = _units[unit];
  if(value < 0)
    value = -value;
  var lastdigit = value % 10;
  var lasttwodigits = value % 100;
  if(lasttwodigits >= 10 && lasttwodigits <= 20)
    lastdigit = 5;

  switch(lastdigit){
    case 0:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
      return a[2];
    case 1:
      return a[0];
    case 2:
    case 3:
    case 4:
      return a[1];
  }
}

// Exponential weighted average
export function calculateWeightedAverage(now, moments, half_life, notolder) {
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

// Google analytics helper
export function t_ga(category, action, text){
  console.log(`Analytics: ${category} / ${action} / ${text}`);
  try {
    gtag('event', action, {
      'event_category': category,
      'event_label': text
    });
  } catch (e) {
    console.log("Analytics error: " + e.toString());
  }
}

export var response_default_template = _.template("Извините, не знаю, что значит <%= speechResult %>. Но вообще меня можно спросить много про что, например про погоду, тюленей, вальдшнепов и зомби.");

export function log_for_user(text){
  t_ga('log_for_user', 'text', text);
  $('#log_for_user_text')[0].innerHTML += text + '<br/>\n';
}

export function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

export function stripHtml(html) {
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

var imagesIv = null;
const INITIAL_IMAGE = "inkeri.png";
export function showImages(images) {
  if (images.length > 0) {
    setTimeout(() => {
      var i = 0;
      $("#inkeriImg").attr("src", images[i]);
      imagesIv = setInterval(() => {
        i = (i + 1) % images.length;
        var img = images[i];
        console.log("Showing image: ", img);
        $("#inkeriImg").attr("src", img);
      }, 5000);
    }, 3000);

    () => {
      stopImages();
    }
  }
  else {
    () => {}
  }
}
export function stopImages() {
  if (imagesIv) {
    clearInterval(imagesIv);
    imagesIv = null;
    $("#inkeriImg").attr("src", INITIAL_IMAGE);
  }
}

// From https://www.w3schools.com/js/js_cookies.asp
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export async function showToken() {
  let resp = await fetch(`${BRAINS_BASE_URL}authtoken`, { credentials: 'include' });
  let token = await resp.text();
  if (token) {
    console.log('token: ', token, $("#authToken"));
    $("#authToken").text(token.slice(0, 6)).toggle(true);
  }
}

// From https://stackoverflow.com/questions/30970068/js-regex-url-validation
export function isValidUrl(str) {
  var res = str.match(/^(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  if(res == null)
    return false;
  else
    return true;
}
