import { getUrlVars } from './misc.js';
import * as Cookies from './thirdparty/js.cookie.js';

var urlVars = getUrlVars();
console.log(urlVars);

var tdiClientId     = null;
var tdiClientSecret = null;
var tdiScope        = null;
var tdiState        = null;

const TODOIST_AUTH_STATES = {
  INITIAL  : 0,
  REDIRECT : 1
};

var todoistAuthState = null;
if (urlVars['action'] == 'oauth_redirect' && urlVars['service'] == 'todoist') {
  todoistAuthState = TODOIST_AUTH_STATES.REDIRECT;
}
else {
  todoistAuthState = TODOIST_AUTH_STATES.INITIAL;
}

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
  if (todoistAuthState == TODOIST_AUTH_STATES.INITIAL) {
    var todoistAuthUrl = `https://todoist.com/oauth/authorize?client_id=${tdiClientId}&scope=${tdiScope}&state=${tdiState}`;
    $('#authTodoistBtn')
    .prop('href', todoistAuthUrl)
    .toggleClass('uk-disabled', false);

    return Promise.resolve();
  }
  else if (todoistAuthState == TODOIST_AUTH_STATES.REDIRECT) {
    $('#authTodoistStatus').text('Authorizing...');

    var authCode = urlVars['code'];
    var redirectUri = 'https://inkeri.tk/settings.html';
    var todoistAuthUrl = `https://todoist.com/oauth/access_token`;

    return $.ajax({
      url: todoistAuthUrl,
      method: 'POST',
      dataType: 'json',
      data: {
        client_id     : tdiClientId,
        client_secret : tdiClientSecret,
        code          : authCode
      }
    });
  }
  else {
    return Promise.resolve();
  }
})
.then((res) => {
  if (res) {
    console.log('token: ', res.access_token);
    if (res.access_token) {
      Cookies.set('todoist_auth_token', res.access_token, 365);
    }
  }
})
.catch((err) => {
  console.log('err: ', err);
});



