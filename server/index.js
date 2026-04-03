// Brewmaster's Bazaar — Backend
// Express + SQLite

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// TODO: SQLite setup, player persistence, economy engine

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', game: 'Brewmaster\'s Bazaar' });
});

app.listen(PORT, () => {
  console.log(`🍺 Brewmaster's Bazaar server running on port ${PORT}`);
});
