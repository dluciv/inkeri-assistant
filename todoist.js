import { getUrlVars } from './misc.js';
import { BRAINS_BASE_URL } from './settings.js';
import {} from './thirdparty/js.cookie.js';

const TODOIST_AUTH_STATES = {
  INITIAL  : 0,
  REDIRECT : 1
};

let initTodoist = async () => {
  let todoistAuthState = null;

  const urlVars = getUrlVars();
  console.log(urlVars);

  if (urlVars['action'] == 'oauth_redirect' && urlVars['service'] == 'todoist') {
    todoistAuthState = TODOIST_AUTH_STATES.REDIRECT;
  }
  else {
    todoistAuthState = TODOIST_AUTH_STATES.INITIAL;
  }

  const {clientId, clientSecret, scope, state} = await $.ajax({
    url: `${BRAINS_BASE_URL}todoist-auth-data`,
    method: 'GET',
    xhrFields: {
      withCredentials: true
    },
    dataType: 'json'
  });

  await $(document).ready();

  let res = null;
  if (todoistAuthState == TODOIST_AUTH_STATES.INITIAL) {
    let todoistAuthUrl = `https://todoist.com/oauth/authorize?client_id=${clientId}&scope=${scope}&state=${state}`;
    $('#authTodoistBtn')
    .prop('href', todoistAuthUrl)
    .toggle(true)
    .toggleClass('uk-disabled', false);
  }
  else if (todoistAuthState == TODOIST_AUTH_STATES.REDIRECT) {
    $('#authTodoistStatus').text('Authorizing...');

    let authCode = urlVars['code'];
    let redirectUri = 'https://inkeri.tk/settings.html';
    let todoistAuthUrl = `https://todoist.com/oauth/access_token`;

    // res = await $.ajax({
    //   url: todoistAuthUrl,
    //   method: 'POST',
    //   dataType: 'json',
    //   data: {
    //     client_id     : clientId,
    //     client_secret : clientSecret,
    //     code          : authCode
    //   }
    // });

    res = await $.ajax({
      url: `${BRAINS_BASE_URL}/todoist_token`,
      method: 'get',
      dataType: 'json',
      xhrFields: {
        withCredentials: true
      },
      data: {
        code : authCode
      }
    });
  }

  if (res) {
    console.log('token: ', res.access_token);
    if (res.access_token) {
      Cookies.set('todoist_auth_token', res.access_token, 365);
    }
  }
}

export { initTodoist }
