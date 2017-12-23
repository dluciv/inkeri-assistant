import { getUrlVars } from './misc.js';

var urlVars = getUrlVars();
console.log(urlVars);

var tdiClientId     = null;
var tdiClientSecret = null;
var tdiScope        = null;
var tdiState        = null;

$.ajax({
  url: 'https://inkeri-api.herokuapp.com/todoist-auth-data',
  method: 'GET',
  dataType: 'json'
})
.then(({clientId, clientSecret, scope, state}) => {
  tdiClientId      = clientId;
  tdiClientSecret  = clientSecret;
  tdiScope         = scope;
  tdiState         = state;

  return $(document).ready()
})
.then(() => {
  if (urlVars['action'] == 'oauth_redirect' && urlVars['service'] == 'todoist') {
    $('#authTodoistStatus').text('Authorizing...');

    var authCode = urlVars['code'];
    var redirectUri = 
    var todoistAuthUrl = `https://todoist.com/oauth/access_token?client_id=${tdiClientId}&client_secret=${tdiClientSecret}&code=${authCode}&redirect_uri=https://inkeri.tk/settings.html`;

    return $.ajax({
      url: todoistAuthUrl,
      method: 'GET',
      dataType: 'json'
    });
  }
  else {
    var todoistAuthUrl = `https://todoist.com/oauth/authorize?client_id=${tdiClientId}&scope=${tdiScope}&state=${tdiState}`;
    $('#authTodoistBtn')
    .prop('href', todoistAuthUrl)
    .toggleClass('uk-disabled', false);

    return Promise.resolve();
  }
})
.then((res) => {
  if (res) {
    console.log('token: ', res.access_token);
  }
})
.catch((err) => {
  console.log('err: ', err);
});



