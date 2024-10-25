import WebSocket from 'ws';
import { Player, Room } from '../types';
import { INVALID_PASSWORD_ERROR } from '../utils/constants';
import { ExtendedWebSocket, Commands } from '../types';
import { updateRoomsList } from '../utils/helpers';

export const handleRegistration = (
  ws: ExtendedWebSocket,
  data: string,
  playersDB: Map<string, Player>,
  id: number,
  wss: WebSocket.Server,
  roomDB: Map<number, Room>,
) => {
  const { name, password } = JSON.parse(data);

  if (playersDB.has(name)) {
    console.log('has a name');
    const player = playersDB.get(name)!;
    console.log('password/validpassword', password, player.password);
    if (password === player.password) {
      ws.playerName = name;
      console.log('valid password');
      ws.send(
        JSON.stringify({
          type: Commands.REGISTRATION,
          data: JSON.stringify({
            name,
            index: player.index,
            error: false,
            errorText: '',
          }),
          id,
        }),
      );
      updateRoomsList(wss, roomDB);
    } else {
      console.log('unvalid password');
      ws.send(
        JSON.stringify({
          type: Commands.REGISTRATION,
          data: JSON.stringify({
            name,
            index: player.index,
            error: true,
            errorText: INVALID_PASSWORD_ERROR,
          }),
          id,
        }),
      );
    }
  } else {
    const newIndex = playersDB.size + 1;
    playersDB.set(name, { password, index: newIndex });
    ws.playerName = name;
    console.log('create new user');
    console.log('name', name, '{ password, index: newIndex }', { password, index: newIndex }, 'playerDB', playersDB);
    ws.send(
      JSON.stringify({
        type: Commands.REGISTRATION,
        data: JSON.stringify({
          name,
          index: newIndex,
          error: false,
          errorText: '',
          id,
        }),
      }),
    );
    updateRoomsList(wss, roomDB);
    console.log('respond sended');
  }
  console.log('playersDB', playersDB);
};
