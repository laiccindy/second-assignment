// app.js (frontend)
document.addEventListener('DOMContentLoaded', () => {
  const addGameForm = document.getElementById('addGameForm');
  const updateGameForm = document.getElementById('updateGameForm');
  const gamesList = document.getElementById('gamesList');
  const searchForm = document.getElementById('searchForm');

  const fetchAndDisplayGames = async () => {
    try {
      const response = await fetch('/games');
      const games = await response.json();

      gamesList.innerHTML = '';

      games.forEach(game => {
        const listItem = document.createElement('li');
        listItem.textContent = `${game.title} - ${game.platform} - ${game.genre} - ${new Date(game.releaseDate).toLocaleDateString()}`;
        gamesList.appendChild(listItem);
      });
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const searchGames = async (query) => {
    try {
      const response = await fetch(`/search?q=${query}`);
      const results = await response.json();

      gamesList.innerHTML = '';

      results.forEach(game => {
        const listItem = document.createElement('li');
        listItem.textContent = `${game.title} - ${game.platform} - ${game.genre} - ${new Date(game.releaseDate).toLocaleDateString()}`;
        gamesList.appendChild(listItem);
      });
    } catch (error) {
      console.error('Error searching games:', error);
    }
  };

  addGameForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = document.getElementById('title').value;
    const platform = document.getElementById('platform').value;
    const genre = document.getElementById('genre').value;
    const releaseDate = document.getElementById('releaseDate').value;

    try {
      await fetch('/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, platform, genre, releaseDate }),
      });

      fetchAndDisplayGames();
    } catch (error) {
      console.error('Error adding game:', error);
    }
  });

  updateGameForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const updateTitle = document.getElementById('updateTitle').value;
    const updatePlatform = document.getElementById('updatePlatform').value;
    const updateGenre = document.getElementById('updateGenre').value;
    const updateReleaseDate = document.getElementById('updateReleaseDate').value;

    // You would need to get the ID of the game to update.
    // This is a simplified example, and you may need to implement logic to select the game to update.
    // For example, you could display a list of games with an "Update" button next to each, and when clicked, set the updateForm fields with the selected game's details.

    try {
      // Replace 'gameId' with the actual ID of the game you want to update
      const gameId = '...';
      await fetch(`/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: updateTitle, platform: updatePlatform, genre: updateGenre, releaseDate: updateReleaseDate }),
      });

      fetchAndDisplayGames();
    } catch (error) {
      console.error('Error updating game:', error);
    }
  });

  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const query = document.getElementById('searchInput').value;

    if (query.trim() !== '') {
      searchGames(query);
    } else {
      fetchAndDisplayGames();
    }
  });

  fetchAndDisplayGames();
});