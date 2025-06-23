function fetchMessage() {
    fetch('/api/message')
      .then(res => res.json())
      .then(data => {
        document.getElementById('message').textContent = data.message;
      })
      .catch(err => {
        document.getElementById('message').textContent = 'Error fetching message';
      });
  }
  