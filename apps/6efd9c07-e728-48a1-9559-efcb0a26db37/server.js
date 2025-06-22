const express = require('express');
const app = express();
const PORT = 3000;

// Serve static files from "public"
app.use(express.static('public'));

// Sample API endpoint
app.get('/api/message', (req, res) => {
  res.json({ message: "Hello from the server!" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
