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
  else if (json && json.message) {
    if (self.msg_port) {
      self.msg_port.postMessage(JSON.stringify({
        event: 'message',
        data: json.message
      }));
    }
  }
  else if (json && json.say) {
    if (self.msg_port) {
      self.msg_port.postMessage(JSON.stringify({
        event: 'say',
        data: json.say
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
