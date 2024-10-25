import { ShipsResponse, Game } from '../types';

export const handleAddShips = (data: string, gamesDB: Map<number | string, Game>) => {
  const shipsObject: ShipsResponse = JSON.parse(data);
  const { gameId } = shipsObject;
  console.log('Adding ships for game ID:', gameId);

  if (!gamesDB.has(gameId)) {
    gamesDB.set(gameId, {
      gameId,
      players: [],
      currentTurnPlayerId: null,
    });
  }

  const game = gamesDB.get(gameId);

  if (game) {
    let player = game.players.find((p) => p.id === shipsObject.indexPlayer);

    if (!player) {
      player = {
        id: shipsObject.indexPlayer,
        ships: [],
        ready: false,
      };
      game.players.push(player);
    }

    player.ships = shipsObject.ships;

    player.ready = true;
    console.log('gamesDB', gamesDB);

    if (game.players.length === 2 && game.players.every((p) => p.ready)) {
      game.currentTurnPlayerId = game.players[0].id;

      console.log(`Game ${gameId} is ready to start!`);
      console.log('gamesDB');
      //   startGame(game);
    } else {
      console.log(`Waiting for the second player to be ready in game ${gameId}`);
    }
  }
};
