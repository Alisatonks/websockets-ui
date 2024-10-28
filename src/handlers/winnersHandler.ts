import { Game, Commands, ExtendedWebSocket } from '../types';

const winnersDB = new Map<string, number>();

export const updateWinners = (playerName: string, game?: Game, ws?: ExtendedWebSocket) => {
  if (game) {
    const currentWins = winnersDB.get(playerName);
    if (!currentWins) {
      winnersDB.set(playerName, 1);
    } else {
      winnersDB.set(playerName, currentWins + 1);
    }
  }

  const winnersArray = Array.from(winnersDB, ([name, wins]) => ({ name, wins }));

  if (game) {
    game.players.forEach((player) => {
      player.session.send(
        JSON.stringify({
          type: Commands.WINNERS,
          data: JSON.stringify(winnersArray),
          id: 0,
        }),
      );
    });
  }
  if (ws) {
    ws.send(
      JSON.stringify({
        type: Commands.WINNERS,
        data: JSON.stringify(winnersArray),
        id: 0,
      }),
    );
  }
};
