const Synapse = class {
  constructor(id, isShift = false) {
    this.id = id;
    this.isShift = isShift;

    this.inputs = [];
    this.inputConnections = {};
    this.outputs = [];
    this.outputConnections = {};

    this.output = 0.0;
    this.input = 0.0;
    this.error = 0.0;
  }

  activateFn(val) {
    return this.isShift ? 1.0 : (1.0 / (1.0 + Math.exp(- val)));
  }
  activateFn1(val) {
    return this.isShift ? 1.0 : (this.activateFn(val) * (1 - this.activateFn(val)));
  }

  update() {
    this.input  =  _.reduce(this.inputs, (acc, syn) => {
      var conn = this.inputConnections[syn.id];
      return conn ? acc + syn.output * conn.coeff : acc;
    }, 0.0);
    this.output = this.activateFn(this.input);
  }

  activate() {
    this.output = 1.0;
  }

  reset() {
    this.output = 0.0;
  }
}

export { Synapse };
