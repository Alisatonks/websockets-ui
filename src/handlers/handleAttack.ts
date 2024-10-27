import { Game, Commands, ExtendedWebSocket, ShipCellsArray, Position } from '../types';
import { GAME_NOT_FOUND, OPPONENT_NOT_FOUND, NOT_PLAYER_TURN } from '../utils/constants';
import { getSurroundingCells } from '../utils/helpers';
import { sendTurnInfo } from './gameHandler';

const sendAttackMessage = (game: Game, position: Position, currentPlayer: number | string, status: string) => {
  const player = game.players.find((player) => player.id === currentPlayer);
  player?.attackHistory.push(position);
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

const sendErrorMessage = (ws: ExtendedWebSocket, message: string) => {
  return ws.send(
    JSON.stringify({
      type: Commands.ERROR,
      data: JSON.stringify({ message }),
      id: 0,
    }),
  );
};

const validateGame = (game: Game | undefined, indexPlayer: number | string, ws: ExtendedWebSocket) => {
  if (!game) {
    sendErrorMessage(ws, GAME_NOT_FOUND);
    return null;
  }

  const opponent = game.players.find((player) => player.id !== indexPlayer);
  const player = game.players.find((player) => player.id === indexPlayer);

  if (!opponent) {
    sendErrorMessage(ws, OPPONENT_NOT_FOUND);
    return null;
  }

  if (game.currentTurnPlayerId === opponent.id) {
    sendErrorMessage(ws, NOT_PLAYER_TURN);
    return null;
  }

  return { opponent, player };
};

const processAttack = (target: Position, opponent: Game['players'][number]) => {
  let attackResult = 'miss';
  let killedShip: ShipCellsArray | undefined;

  opponent.shipsCells.forEach((ship) => {
    ship.forEach((cell) => {
      if (cell.x === target.x && cell.y === target.y) {
        attackResult = 'shot';
        cell.hit = true;

        if (ship.every((cell) => cell.hit)) {
          attackResult = 'killed';
          killedShip = ship;
        }
      }
    });
  });

  return { attackResult, killedShip };
};

const handleAttackResult = (
  game: Game,
  target: Position,
  indexPlayer: number | string,
  attackResult: string,
  killedShip: ShipCellsArray | undefined,
  opponent: Game['players'][number],
) => {
  sendAttackMessage(game, target, indexPlayer, attackResult);

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

const getRandomTarget = (player: Game['players'][number] | undefined): Position => {
  let target: Position;
  do {
    target = {
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
    };
  } while (player?.attackHistory.some((cell) => cell.x === target.x && cell.y === target.y));
  return target;
};

export const handleAttack = (data: string, gamesDB: Map<number | string, Game>, ws: ExtendedWebSocket) => {
  const { gameId, x, y, indexPlayer } = JSON.parse(data);
  const game = gamesDB.get(gameId);

  const result = validateGame(game, indexPlayer, ws);
  if (!result) return;

  const { opponent } = result;
  const target = { x, y };

  const { attackResult, killedShip } = processAttack(target, opponent);

  if (game) {
    handleAttackResult(game, target, indexPlayer, attackResult, killedShip, opponent);
  }
};

export const handleRandomAttack = (data: string, gamesDB: Map<number | string, Game>, ws: ExtendedWebSocket) => {
  const { gameId, indexPlayer } = JSON.parse(data);
  const game = gamesDB.get(gameId);

  const result = validateGame(game, indexPlayer, ws);
  if (!result) return;

  const { opponent, player } = result;
  const target = getRandomTarget(player);

  const { attackResult, killedShip } = processAttack(target, opponent);

  if (game) {
    handleAttackResult(game, target, indexPlayer, attackResult, killedShip, opponent);
  }
};
