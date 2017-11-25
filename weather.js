import { declinateUnit } from './misc.js';

const owmAPIkey = "65b3dc1574aadec85e6638331e30b380"; // dluciv@gmail.com
const owmAPIroot = `https://api.openweathermap.org/data/2.5/weather?appid=${owmAPIkey}&units=metric`;
const owmCity = 498817;

export function loadWeather(callback) {
  let getweather = function(req, where, cb) {
    $.ajax({
      url: api_url,
      method: 'GET',
      success: function(data) {

        var tempr = Math.round(data.main.temp);
        var wind = Math.round(data.wind.speed);
        var vis = data.visibility;
        var hum = Math.round(data.main.humidity);
        var prs = Math.round(0.750062 * data.main.pressure);

        let weather =
          "Температура " + where +
          " — "          + tempr + ' ' + declinateUnit(tempr, "градус"   ) + '. ' +
          "Ветер — "     + wind  + ' ' + declinateUnit(wind,  "метр"     ) + ' в секунду. ' +
          "Влажность — " + hum   + "%. " +
          "Давление — "  + prs   + ' ' + declinateUnit(prs,   "миллиметр") + ' ртутного столба. ';

        console.log(weather);
        cb(weather);
      }
    });
  }

  let api_url = `${owmAPIroot}&id=${owmCity}`;
  getweather(api_url, "в И́нгрии", (w) => {
    callback(w);

    if ("geolocation" in navigator) { // to slow on mobiles...
      navigator.geolocation.getCurrentPosition((position) => {
        let api_url = `${owmAPIroot}&lat=${position.coords.latitude}&lon=${position.coords.longitude}`;
        getweather(api_url, "за бортом", callback);
      });
    } else {
      t_ga('weather', 'no_geolocation_support', navigator.userAgent);
    }
  });

}
