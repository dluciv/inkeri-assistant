self.addEventListener('push', (event) => {
  console.log('push event: ', event);
  console.log('push event args: ', arguments);
});
