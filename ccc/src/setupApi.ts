import express from "express";

export default function setupApi() {
  const app = express();

  app.get('/', (_req, res) => {
    res.send('Get Received');
  })

  app.post('/', (_req, res) => {
    res.send('Post Received');
  });

  return app;
}