import { Game, Commands, ExtendedWebSocket, ShipCellsArray } from '../types';
import { GAME_NOT_FOUND, OPPONENT_NOT_FOUND, NOT_PLAYER_TURN } from '../utils/constants';
import { getSurroundingCells } from '../utils/helpers';
import { sendTurnInfo } from './gameHandler';

const sendAttackMessage = (
  game: Game,
  position: { x: number; y: number },
  currentPlayer: number | string,
  status: string,
) => {
  game.players.forEach((player) => {
    player.session.send(
      JSON.stringify({
        type: Commands.ATTACK,
        data: JSON.stringify({
          position,
          currentPlayer,
          status,
        }),
        id: 0,
      }),
    );
  });
};

export const handleAttack = (data: string, gamesDB: Map<number | string, Game>, ws: ExtendedWebSocket) => {
  const attackData = JSON.parse(data);
  const { gameId, x, y, indexPlayer } = attackData;

  const game = gamesDB.get(gameId);

  if (!game) {
    return ws.send(
      JSON.stringify({
        type: Commands.ERROR,
        data: JSON.stringify({ message: GAME_NOT_FOUND }),
        id: 0,
      }),
    );
  }

  const opponent = game.players.find((player) => player.id !== indexPlayer);

  if (!opponent) {
    return ws.send(
      JSON.stringify({
        type: Commands.ERROR,
        data: JSON.stringify({ message: OPPONENT_NOT_FOUND }),
        id: 0,
      }),
    );
  }

  if (game.currentTurnPlayerId === opponent.id) {
    return ws.send(
      JSON.stringify({
        type: Commands.ERROR,
        data: JSON.stringify({ message: NOT_PLAYER_TURN }),
        id: 0,
      }),
    );
  }

  let attackResult = 'miss';
  let killedShip: ShipCellsArray | undefined;

  opponent.shipsCells.forEach((ship) => {
    ship.forEach((cell) => {
      if (cell.x === x && cell.y === y) {
        attackResult = 'shot';
        cell.hit = true;

        if (ship.every((cell) => cell.hit)) {
          attackResult = 'killed';
          killedShip = ship;
        }
      }
    });
  });

  sendAttackMessage(game, { x, y }, indexPlayer, attackResult);

  if (attackResult === 'killed' && killedShip) {
    const surroundingCells = getSurroundingCells(killedShip);

    surroundingCells.forEach((cell) => sendAttackMessage(game, cell, indexPlayer, 'miss'));
    killedShip.forEach((cell) => sendAttackMessage(game, cell, indexPlayer, 'killed'));
  }

  if (attackResult === 'miss') {
    game.currentTurnPlayerId = opponent.id;
  }

  sendTurnInfo(game);
};
