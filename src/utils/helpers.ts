import WebSocket from 'ws';
import { Room, Commands } from '../types';
import { ExtendedWebSocket, Player } from '../types';

export const updateRoomsList = (wss: WebSocket.Server, roomsDB: Map<number, Room>) => {
  const roomsList = Array.from(roomsDB.values()).map((room) => ({
    roomId: room.roomId,
    roomUsers: room.playersInRoom.map((user) => ({
      name: user.name,
      index: user.index,
    })),
  }));

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log('client updated');
      client.send(
        JSON.stringify({
          type: Commands.UPDATE_ROOM,
          data: JSON.stringify(roomsList),
        }),
      );
    }
  });
};

export const getPlayerFromWS = (ws: ExtendedWebSocket, playersDB: Map<string, Player>) => {
  const playerName = ws.playerName;

  if (playerName) {
    const player = playersDB.get(playerName);
    if (player) {
      return { playerName, player };
    }
  }

  return undefined;
};
