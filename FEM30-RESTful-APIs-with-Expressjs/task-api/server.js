const app = require('./app');

const PORT = process.env.PORT || 3000;

// In Express 5 the listen callback also receives start-up errors
// (for example EADDRINUSE: the port is already taken), so check it before announcing success.
app.listen(PORT, (error) => {
  if (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or run: PORT=3001 npm start`);
    } else {
      console.error('Could not start the server:', error.message);
    }
    process.exit(1);
  }
  console.log(`Task API listening on http://localhost:${PORT}`);
});
