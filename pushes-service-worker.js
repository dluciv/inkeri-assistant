self.addEventListener('push', (event) => {
  console.log('push event: ', event);

  var text = '';
  var json = {};
  if (event.data) {
    text = event.data.text();
    try {
      json = event.data.json();
    }
    catch (e) {
    }
  }
  console.log('push event data: ', text, json);

  if (json && json.url) {
    if (self.msg_port) {
      self.msg_port.postMessage(JSON.stringify({
        event: 'url',
        data: json.url
      }));
    }
  }
});

self.addEventListener('message', (event) => {
  let data = event.data;

  if (data == 'subscribe') {
    console.log('subscribe');
    self.msg_port = event.ports[0];

    self.msg_port.postMessage("SW Says 'Hello back!'");
  }
});
