import path from "node:path";
import express from "express";

const root = path.join(__dirname, '../frontend');
export default function setupApi() {
  const app = express();

  app.get('/', (_req, res) => {
    res.sendFile('/index.html', { root });
  })
  app.get('/app.js', (_req, res) => {
    res.sendFile('/app.js', {root })
  })

  app.post('/post', (_req, res) => {
    res.send('Post Received');
  });

  app.get('/get', (_req, res) => {
    res.send('Get Received');
  });

  return app;
}