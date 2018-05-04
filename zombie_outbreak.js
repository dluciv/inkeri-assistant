import { t_ga, declinateUnit } from './misc.js';

const zombie_data_url = "https://matrix.dluciv.name/zac/zac.json";

const zombies_unknown = "Данные по активности зомби не поступили.";
const zombies_error = "Активность зомби носит скрытый характер.";
var zombies = zombies_unknown;

const zombie_template_h = _.template(
  "Внимание! Вероятность зомби-атаки <%= z_o_prob %> <%= d_o_pсn %>, то есть выше статистической погрешности экспертизы, равной <%= z_e_prob %> <%= d_e_pсn %>."
);
const zombie_template_l = _.template(
  "Вероятность зомби-атаки <%= z_o_prob %> <%= d_o_pсn %>, то есть находится в пределах статистической погрешности экспертизы, равной <%= z_e_prob %> <%= d_e_pсn %>."
);


export function getZombies() {
  return zombies;
}

export function loadZombieProbability(callback) {
  $.ajax({
    method: 'GET',
    url: zombie_data_url,
    dataType: 'json',
    success: function(z) {
      let v = Math.round(100.0 * z.outbreakProbability);
      let e = Math.round(100.0 * z.absoluteError);
      let vp = declinateUnit(v, "процент");
      let ep = declinateUnit(e, "проценту");

      let tl = v > e ? zombie_template_h : zombie_template_l;
      zombies = tl({
        z_o_prob: v, d_o_pсn: vp,
        z_e_prob: e, d_e_pсn: ep
      });
      console.log("Зомби-атака: ", zombies);
      if (callback)
	callback(zombies);
    },
    error: function(err) {
      console.log('err', err);
      t_ga('zombie', 'zombie_retrieval_error', err.toString());
      zombies = zombies_error;
      if (callback)
	callback(zombies);
    }
  })
}

export function getZombieTextImages() {
  return ["https://matrix.dluciv.name/zac/zz1.svg"];
}
