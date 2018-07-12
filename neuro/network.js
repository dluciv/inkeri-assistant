import { Synapse } from './synapse.js';
import { Connection } from './connection.js';

const TRAIN_SPEED = 0.5;

const Network = class {
  constructor(conf) {
    console.log('conf: ', conf);
    this.id = null;
    this.width = conf.width;
    this.height = conf.height;
    this.parentId = null;

    this.levels = [];
    conf.connections.forEach((level, levelIdx) => {
      let newLevel = level.map((syn, synIdx) => new Synapse(levelIdx * (this.width + 1) + synIdx));
      this.levels.push(newLevel);

      if (levelIdx > 0) {
        let prevNewLevel = this.levels[levelIdx - 1];
        let prevLevel = conf.connections[levelIdx - 1];

        prevNewLevel.forEach((newSyn2, synIdx) => {
          let syn2 = prevLevel[synIdx];
          syn2.forEach((connCoeff, connIdx) => {
            let conn = new Connection(connCoeff);
            let newSyn = (levelIdx == conf.connections.length - 1) ? newLevel[connIdx] : newLevel[connIdx + 1]; // +1 - because of a shift synapse (except the last level - it does not have it)
            newSyn2.outputs.push(newSyn);
            newSyn2.outputConnections[newSyn.id] = conn;
            newSyn.inputs.push(newSyn2);
            newSyn.inputConnections[newSyn2.id] = conn;
            if (synIdx <= 5 && connIdx <= 5) {
              console.log('load: ', newSyn2.id, ' -> ', newSyn.id, ' ; ', conn.coeff, levelIdx, synIdx);
            }
          });
        });
      }
    });
  }

  calculate(input) {
    for (var i = 0; i < Math.min(input.length, this.levels[0].length); i++) {
      this.levels[0][i].output = input[i];
    }

    this.levels.slice(1).forEach((level) => level.forEach((syn) => syn.update()));

    return this.levels[this.levels.length - 1].map((syn) => syn.output);
  }

  log() {
    this.levels.forEach((level) => {
      var str = level.reduce((acc, syn) => {
        return acc + ((syn.output > 0.3) ? "#" : "=")
      }, "");
      console.log(str);
    });
  }
  logFull() {
    console.log("Full network:");
    console.log("-------------");
    this.levels.forEach((level) => {
      var str = level.reduce((acc, syn) => {
        return acc + " | " + (syn.isShift? "s" : "") + syn.output;
      }, "");
      console.log(str);
      level.forEach((syn) => {
        if (_.size(syn.outputConnections) > 0) {
          var str = _.reduce(syn.outputConnections, (acc, conn) => {
            return acc + " ; " + conn.coeff;
          }, "");
          console.log(str);
        }
      });
    });
    console.log("-------------");
  }
  logPart(ncol) {
    this.levels.forEach((level) => {
      // console.log('w: ', level.length);
      var str = level.reduce((acc, syn) => {
        return acc + " | " + (syn.isShift? "s" : "") + syn.output;
      }, "");
      console.log(str);
      level.slice(0, ncol).forEach((syn) => {
        if (_.size(syn.outputConnections) > 0) {
          var str = _.reduce(_.slice(_.values(syn.outputConnections), 0, ncol), (acc, conn) => {
            return acc + " ; " + conn.coeff;
          }, "");
          console.log(str);
        }
      });
    });
  }

  toJSON() {
    return {
      width: this.width,
      height: this.height,
      levels: this.levels.map((level) => level.length),
      connections: this.levels.map((level) => level.map((syn) => _.map(syn.outputConnections, (conn) => conn.coeff)))
    }
  }
}

export { Network };
