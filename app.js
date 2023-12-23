const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs')

const atlasConnectionUri = "mongodb+srv://ginapertance:wuRJsYtICJ1hTzD6@cluster0.tn5m5sr.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(atlasConnectionUri, { useNewUrlParser: true, useUnifiedTopology: true });

const Game = mongoose.model('Game', {
  title: String,
  platform: String,
  genre: String,
  releaseDate: Date,
});

app.use(bodyParser.json());

app.post('/games', async (req, res) => {
  const { title, platform, genre, releaseDate } = req.body;
  const game = new Game({ title, platform, genre, releaseDate });

  try {
    await game.save();
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/games', async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/games/:id', async (req, res) => {
  const gameId = req.params.id;

  try {
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/games/:id', async (req, res) => {
  const gameId = req.params.id;
  const { title, platform, genre, releaseDate } = req.body;

  try {
    const game = await Game.findByIdAndUpdate(gameId, { title, platform, genre, releaseDate }, { new: true });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/games/:id', async (req, res) => {
  const gameId = req.params.id;

  try {
    const game = await Game.findByIdAndDelete(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// New route for searching games
app.get('/search', async (req, res) => {
  const query = req.query.q;

  try {
    const results = await Game.find({
      $or: [
        { title: { $regex: query, $options: 'i' } }, // Case-insensitive title search
        { platform: { $regex: query, $options: 'i' } }, // Case-insensitive platform search
        { genre: { $regex: query, $options: 'i' } }, // Case-insensitive genre search
      ],
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});