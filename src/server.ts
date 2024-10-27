import WebSocket from 'ws';
import { handleRegistration } from './handlers/registrationHandler';
import { Room, Player, Commands, Game } from './types';
import { handleAddUserToRoom, handleCreateRoom } from './handlers/roomHandler';
import { handleAddShips } from './handlers/gameHandler';
import { handleAttack } from './handlers/handleAttack';

const createWSServer = () => {
  const playersDB = new Map<string, Player>();
  const roomsDB = new Map<number, Room>();
  const gamesDB = new Map<number | string, Game>();
  let roomIdCounter = 1;

  const wss = new WebSocket.Server({ port: 3000 });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
      const messageToString = message.toString();
      const data = JSON.parse(messageToString);
      const id = Number(data.id);

      switch (data.type) {
        case Commands.REGISTRATION:
          handleRegistration(ws, data.data, playersDB, id, wss, roomsDB);
          break;

        case Commands.CREATE_ROOM:
          handleCreateRoom(ws, playersDB, roomsDB, roomIdCounter, wss);
          roomIdCounter++;
          break;

        case Commands.ADD_USER_TO_ROOM:
          handleAddUserToRoom(ws, data.data, playersDB, roomsDB, wss);
          break;

        case Commands.ADD_SHIPS:
          handleAddShips(data.data, gamesDB, ws);
          break;

        case Commands.ATTACK:
          handleAttack(data.data, gamesDB, ws);
          break;

        default:
          ws.send(
            JSON.stringify({
              type: Commands.ERROR,
              message: 'Unsupported message type',
            }),
          );
          break;
      }
    });

    ws.on('close', () => {
      console.log('Disconnected');
    });
  });

  console.log(`Websocket Server is running on port 3000`);
};

export default createWSServer;
