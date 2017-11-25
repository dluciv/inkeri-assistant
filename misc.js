var _units = {
  "градус" : ["градуса", "градусов"],
  "метр" : ["метра", "метров"],
  "миллиметр" : ["миллиметра", "миллиметров"],
  "процент": ["процента", "процентов"],
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
