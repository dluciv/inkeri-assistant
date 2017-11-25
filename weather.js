import { declinateUnit } from './misc.js';

const owmAPIkey = "65b3dc1574aadec85e6638331e30b380"; // dluciv@gmail.com

export function loadWeather(callback) {
  var lat, lon, api_url;

  var getweather = function(req, where) {
    var weather = "";
    $.ajax({
      url: api_url,
      method: 'GET',
      success: function(data) {

        var tempr = Math.round(data.main.temp);
        var wind = Math.round(data.wind.speed);
        var vis = data.visibility;
        var hum = Math.round(data.main.humidity);
        var prs = Math.round(0.750062 * data.main.pressure);

        weather =
          "Температура " + where +
          " — "          + tempr + ' ' + declinateUnit(tempr, "градус"   ) + '. ' +
          "Ветер — "     + wind  + ' ' + declinateUnit(wind,  "метр"     ) + ' в секунду. ' +
          "Влажность — " + hum   + "%. " +
          "Давление — "  + prs   + ' ' + declinateUnit(prs,   "миллиметр") + ' ртутного столба. ';

        console.log(weather);
        callback(weather);
      }
    });
  }

  if (false && "geolocation" in navigator) { // to slow on mobiles...

    navigator.geolocation.getCurrentPosition(gotLocation);

    var gotLocation = function(position) {
      lat = position.coords.latitude;
      lon = position.coords.longitude;

      api_url = 'http://api.openweathermap.org/data/2.5/weather?lat=' +
        lat + '&lon=' +
        lon + '&units=metric&appid=' + owmAPIkey;
      // http://api.openweathermap.org/data/2.5/weather?q=London,uk&callback=test&appid=b1b15e88fa79722

      getweather(api_url, "за бортом");
    }
  } else {
    // alert('Your browser doesnt support geolocation. Sorry.');
      // var api_url = 'http://api.openweathermap.org/data/2.5/weather?lat=60.439803&lon=30.097812&units=metric&appid=' + owmAPIkey;
      api_url = 'https://api.openweathermap.org/data/2.5/weather?id=498817&units=metric&appid=' + owmAPIkey;

      getweather(api_url, "в И́нгрии");
  }
}