var tdiClientId = null;
var tdiScope    = null;
var tdiState    = null;

$.ajax({
  url: 'https://inkeri-api.herokuapp.com/todoist-auth-data',
  method: 'GET',
  dataType: 'json'
})
.then(({clientId, scope, state}) => {
  tdiClientId = clientId;
  tdiScope    = scope;
  tdiState    = state;

  return $(document).ready()
})
.then(() => {
  var todoistAuthUrl = `https://todoist.com/oauth/authorize?client_id=${tdiClientId}&scope=${tdiScope}&state=${tdiState}`;
  $('#authTodoistBtn').prop('href', todoistAuthUrl);
})
.catch((err) => {
  console.log('err: ', err);
})
