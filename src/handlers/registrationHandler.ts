import WebSocket from 'ws';
import { Player, Room } from '../types';
import { INVALID_PASSWORD_ERROR } from '../utils/constants';
import { ExtendedWebSocket, Commands } from '../types';
import { updateRoomsList } from '../utils/helpers';
import { updateWinners } from './winnersHandler';

export const handleRegistration = (
  ws: ExtendedWebSocket,
  data: string,
  playersDB: Map<string, Player>,
  wss: WebSocket.Server,
  roomDB: Map<number, Room>,
) => {
  const { name, password } = JSON.parse(data);

  if (playersDB.has(name)) {
    const player = playersDB.get(name)!;
    if (password === player.password) {
      ws.playerName = name;
      ws.send(
        JSON.stringify({
          type: Commands.REGISTRATION,
          data: JSON.stringify({
            name,
            index: player.index,
            error: false,
            errorText: '',
          }),
          id: 0,
        }),
      );
      updateRoomsList(wss, roomDB);
      updateWinners(name, undefined, ws);
    } else {
      ws.send(
        JSON.stringify({
          type: Commands.REGISTRATION,
          data: JSON.stringify({
            name,
            index: player.index,
            error: true,
            errorText: INVALID_PASSWORD_ERROR,
          }),
          id: 0,
        }),
      );
    }
  } else {
    const newIndex = playersDB.size + 1;
    playersDB.set(name, { password, index: newIndex });
    ws.playerName = name;
    ws.send(
      JSON.stringify({
        type: Commands.REGISTRATION,
        data: JSON.stringify({
          name,
          index: newIndex,
          error: false,
          errorText: '',
          id: 0,
        }),
      }),
    );
    updateRoomsList(wss, roomDB);
    updateWinners(name, undefined, ws);
  }
};
