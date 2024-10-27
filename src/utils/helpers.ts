import WebSocket from 'ws';
import { Room, Commands, Ships, ShipCellsArray } from '../types';
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

export const getShipCells = (ship: Ships) => {
  const shipCells = [];
  for (let i = 0; i < ship.length; i++) {
    console.log('ship', ship, 'ship.position', ship.position);
    const position = ship.direction
      ? { x: ship.position.x, y: ship.position.y + i }
      : { x: ship.position.x + i, y: ship.position.y };

    shipCells.push({ ...position, hit: false });
  }
  return shipCells;
};

export const getSurroundingCells = (ship: ShipCellsArray) => {
  const surroundingCells = new Set<string>();

  ship.forEach(({ x, y }) => {
    [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
      { x: x - 1, y: y - 1 },
      { x: x - 1, y: y + 1 },
      { x: x + 1, y: y - 1 },
      { x: x + 1, y: y + 1 },
    ].forEach((pos) => {
      const posKey = `${pos.x},${pos.y}`;

      if (!ship.some((cell) => cell.x === pos.x && cell.y === pos.y)) {
        surroundingCells.add(posKey);
      }
    });
  });

  return Array.from(surroundingCells).map((cell) => {
    const [x, y] = cell.split(',').map(Number);
    return { x, y };
  });
};
