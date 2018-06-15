import { initTodoist } from './todoist.js';

// -- To Force https ------------------------------
// -- https://stackoverflow.com/a/4723302/539470 --
if (location.protocol != 'https:' && location.hostname != 'localhost' && location.hostname != '127.0.0.1')
  location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
// --

// -- Global site tag (gtag.js) - Google Analytics --
window.dataLayer = window.dataLayer || [];
function gtag(){
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'UA-110108110-1');
// --

initTodoist();
