self.addEventListener('push', (event) => {
  console.log('push event: ', event);

  var data = {};
  if (event.data) {
    data = event.data.text();
  }
  console.log('push event data: ', data);
});
