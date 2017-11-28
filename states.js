const STATES = {
  initial   : "st_initial",
  speaking  : "st_speaking",
  listening : "st_listening",
  thinking  : "st_thinking"
}

var currentState = "undefined";

var handlers_before = [];
var handlers_after  = [];
var handlers_before_exit = [];
var handlers_after_exit  = [];
_.each(STATES, (st) => {
  handlers_before[st] = [];
  handlers_after[st]  = [];
  handlers_before_exit[st] = [];
  handlers_after_exit[st]  = [];
});

// Adds a new state handler
// state    : one of STATES
// handlers : { onBefore: (old, new, data) -> void , onAfter : (old, new, data) -> void, onExitBefore : (old, new, data) -> void, onExitAfter : (old, new, data) -> void} 
var addHandler = function(state, handlers) {
  if (_.includes(STATES, state)) {
    if (handlers.onBefore) {
      handlers_before[state].push(handlers.onBefore);
    }
    if (handlers.onAfter) {
      handlers_after[state].push(handlers.onAfter);
    }
    if (handlers.onExitBefore) {
      handlers_before_exit[state].push(handlers.onExitBefore);
    }
    if (handlers.onExitAfter) {
      handlers_after_exit[state].push(handlers.onExitAfter);
    }
  }
  else {
    console.log('states: addHandler: undefined state: ', state);
  }
}

// Switches state
// state    : one of STATES
// data     : additional data
var set = function(state, data) {
  if (_.includes(STATES, state)) {
    var oldState = currentState;
    if (oldState == state) {
      console.log('state: ', oldState, ' -> ', state, ' ; [', data ? data : '', '] ; No handlers executed');
      return;
    }
    
    _.each(handlers_before_exit[oldState], (h) => h(oldState, state, data));
    _.each(handlers_before[state], (h) => h(oldState, state, data));
    currentState = state;
    console.log('state: ', oldState, ' -> ', state, ' ; [', data ? data : '', ']');
    _.each(handlers_after_exit[oldState], (h) => h(oldState, state, data));
    _.each(handlers_after[state], (h) => h(oldState, state, data));
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
