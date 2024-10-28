import WebSocket from 'ws';
import { Player, Room, ExtendedWebSocket, Commands } from '../types';
import { updateRoomsList, getPlayerFromWS } from '../utils/helpers';
import { USER_ALREADY_IN_ROOM, ROOM_IS_FULL, ROOM_PLAYER_NOT_FOUND, PLAYER_NOT_FOUND } from '../utils/constants';

export const handleCreateRoom = (
  ws: ExtendedWebSocket,
  playersDB: Map<string, Player>,
  roomsDB: Map<number, Room>,
  roomIdCounter: number,
  wss: WebSocket.Server,
) => {
  const playerData = getPlayerFromWS(ws, playersDB);

  if (playerData) {
    const { playerName, player } = playerData;
    if (player) {
      const newRoomId = roomIdCounter++;

      roomsDB.set(newRoomId, { roomId: newRoomId, playersInRoom: [{ name: playerName, ...player, session: ws }] });

      updateRoomsList(wss, roomsDB);
    } else {
      ws.send(
        JSON.stringify({
          type: Commands.ERROR,
          message: PLAYER_NOT_FOUND,
        }),
      );
    }
  }
};

export const handleAddUserToRoom = (
  ws: WebSocket,
  data: string,
  playersDB: Map<string, Player>,
  roomsDB: Map<number, Room>,
  wss: WebSocket.Server,
  singlePlay?: boolean,
) => {
  const { indexRoom } = JSON.parse(data);
  const playerData = getPlayerFromWS(ws, playersDB);

  if (playerData) {
    const { playerName, player } = playerData;
    if ((player && roomsDB.has(indexRoom)) || singlePlay) {
      const room = roomsDB.get(indexRoom);

      if (room && room.playersInRoom.length < 2) {
        const playerInRoom = room.playersInRoom.find((roomPlayer) => roomPlayer.name === playerName);

        if (playerInRoom) {
          ws.send(
            JSON.stringify({
              type: Commands.ERROR,
              message: USER_ALREADY_IN_ROOM,
            }),
          );
          return;
        }

        room.playersInRoom.push({ name: playerName, ...player, session: ws });

        if (room.playersInRoom.length === 2) {
          roomsDB.delete(indexRoom);
        }
        updateRoomsList(wss, roomsDB);
        room.playersInRoom.forEach((roomPlayer) => {
          roomPlayer.session.send(
            JSON.stringify({
              type: Commands.CREATE_GAME,
              data: JSON.stringify({
                idGame: indexRoom,
                idPlayer: roomPlayer.index,
              }),
            }),
          );
        });
      } else {
        ws.send(
          JSON.stringify({
            type: Commands.ERROR,
            message: ROOM_IS_FULL,
          }),
        );
      }
    } else {
      ws.send(
        JSON.stringify({
          type: Commands.ERROR,
          message: ROOM_PLAYER_NOT_FOUND,
        }),
      );
    }
  }
};
