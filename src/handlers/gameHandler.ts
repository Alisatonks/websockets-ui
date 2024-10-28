import { ShipsResponse, Game, ExtendedWebSocket, Commands, PlayerData } from '../types';
import { getShipCells } from '../utils/helpers';

export const sendTurnInfo = (game: Game) => {
  const currentPlayerId = game.currentTurnPlayerId;

  game.players.forEach((player) => {
    player.session.send(
      JSON.stringify({
        type: Commands.TURN,
        data: JSON.stringify({
          currentPlayer: currentPlayerId,
        }),
        id: 0,
      }),
    );
  });
};

export const startGame = (game: Game) => {
  game.players.forEach((player) => {
    player.session.send(
      JSON.stringify({
        type: Commands.START_GAME,
        data: JSON.stringify({
          ships: player.ships,
          currentPlayerIndex: player.id,
        }),
        id: 0,
      }),
    );
  });
  sendTurnInfo(game);
};

export const handleAddShips = (data: string, gamesDB: Map<number | string, Game>, ws: ExtendedWebSocket) => {
  const shipsObject: ShipsResponse = JSON.parse(data);
  const { gameId } = shipsObject;

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
        session: ws,
        shipsCells: [],
        attackHistory: [],
      };
      game.players.push(player);
    }

    player.ships = shipsObject.ships;
    player.shipsCells = player.ships.map((ship) => getShipCells(ship));

    player.ready = true;

    if (game.players.length === 2 && game.players.every((p) => p.ready)) {
      game.currentTurnPlayerId = game.players[0].id;

      console.log(`Game ${gameId} is ready to start!`);
      startGame(game);
    } else {
      console.log(`Waiting for the second player to be ready in game ${gameId}`);
    }
  }
};

export const finishGame = (id: number | string, players: PlayerData[]) => {
  players.forEach((player) => {
    player.session.send(
      JSON.stringify({
        type: Commands.FINISH,
        data: JSON.stringify({
          winPlayer: id,
        }),
        id: 0,
      }),
    );
  });
};
