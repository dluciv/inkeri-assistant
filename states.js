const STATES = {
  initial              : "st_initial",
  speaking             : "st_speaking",
  listening            : "st_listening",
  waiting_for_response : "st_waiting_for_response"
}

var currentState = "undefined";

var handlers_before = [];
var handlers_after  = [];
_.each(STATES, (st) => {
  handlers_before[st] = [];
  handlers_after[st]  = [];
});

// Adds a new state handler
// state    : one of STATES
// handlers : { onBefore: (old, new) -> void , onAfter : (old, new) -> void} 
var addHandler = function(state, handlers) {
  if (_.includes(STATES, state)) {
    if (handlers.onBefore) {
      handlers_before[state].push(handlers.onBefore);
    }
    if (handlers.onAfter) {
      handlers_after[state].push(handlers.onAfter);
    }
  }
  else {
    console.log('states: addHandler: undefined state: ', state);
  }
}

// Switches state
// state    : one of STATES
var set = function(state) {
  if (_.includes(STATES, state)) {
    var oldState = currentState;
    _.each(handlers_before[state], (h) => h(oldState, state));
    currentState = state;
    _.each(handlers_after[state], (h) => h(oldState, state));
    console.log('state: ', oldState, ' -> ', state);
  }
  else {
    console.log('states: set: undefined state: ', state);
  }  
}

var get = function() {
  return currentState;
}

var is = function(state) {
  return state == currentState;
}

export { STATES, addHandler, set, get, is }
