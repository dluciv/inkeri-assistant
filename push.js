import { BRAINS_BASE_URL } from './settings.js';

// This function is needed because Chrome doesn't accept a base64 encoded string
// as value for applicationServerKey in pushManager.subscribe yet
// https://bugs.chromium.org/p/chromium/issues/detail?id=802280
// Taken from: https://github.com/mozilla/serviceworker-cookbook/blob/master/tools.js
function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
 
  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);
 
  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

let init = async () => {
  navigator.serviceWorker.register('pushes-service-worker.js');

  var registration = await navigator.serviceWorker.ready;
  console.log('got registration');
  var subscription = await registration.pushManager.getSubscription();
  window.ss = subscription;
  if (!subscription) {
      const response = await fetch(`${BRAINS_BASE_URL}pushVapidPublicKey`);
      const vapidPublicKey = await response.text();
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      console.log('creating subscription');

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
  }
  console.log('got subscription', subscription);
  var resp = await fetch(`${BRAINS_BASE_URL}pushTest`, {
    method: 'post',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      subscription: subscription,
      test: 'testv'
    })
  });
  console.log('Push requested');
}

export { init };
