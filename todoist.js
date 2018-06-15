import { getUrlVars } from './misc.js';
import { BRAINS_BASE_URL } from './settings.js';
import {} from './thirdparty/js.cookie.js';

const TODOIST_AUTH_STATES = {
  INITIAL  : 0,
  REDIRECT : 1
};

const getTasks = async (token) => {
  const res = await $.ajax({
    url: 'https://beta.todoist.com/API/v8/tasks',
    method: 'GET',
    beforeSend: function (xhr) {
      xhr.setRequestHeader ("Authorization", `Bearer ${token}`);
    }
  });
  console.log(res);
}

const onTokenGot = (token) => {
  if (token) {
    console.log('token: ', token);
    Cookies.set('todoist_auth_token', token, 365);
    $('#authTodoistStatus').text('Connected');
    $('#todoistTasksBtn')
      .toggle(true)
      .toggleClass('uk-disabled', false)
      .click((e) => { e.preventDefault(); getTasks(token); });
  }
}

const initTodoist = async () => {
  let todoistAuthState = null;

  const urlVars = getUrlVars();
  console.log(urlVars);

  if (urlVars['action'] == 'oauth_redirect' && urlVars['service'] == 'todoist') {
    todoistAuthState = TODOIST_AUTH_STATES.REDIRECT;
  }
  else {
    todoistAuthState = TODOIST_AUTH_STATES.INITIAL;
  }

  const {token, clientId, clientSecret, scope, state} = await $.ajax({
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
    if (token) {
      onTokenGot(token);
    }
    else {
      let todoistAuthUrl = `https://todoist.com/oauth/authorize?client_id=${clientId}&scope=${scope}&state=${state}`;
      $('#authTodoistBtn')
        .prop('href', todoistAuthUrl)
        .toggle(true)
        .toggleClass('uk-disabled', false);
    }
  }
  else if (todoistAuthState == TODOIST_AUTH_STATES.REDIRECT) {
    $('#authTodoistStatus').text('Authorizing...');

    let authCode = urlVars['code'];
    let redirectUri = 'https://inkeri.tk/settings.html';
    let todoistAuthUrl = 'https://todoist.com/oauth/access_token';
    let state2 = decodeURIComponent(urlVars['state']);

    res = await $.ajax({
      url: `${BRAINS_BASE_URL}todoist-token`,
      method: 'get',
      dataType: 'json',
      xhrFields: {
        withCredentials: true
      },
      data: {
        code : authCode,
        state: state2
      }
    });
  }

  if (res) {
    onTokenGot(res.token);
  }
}

export { initTodoist }
