import WebSocket from 'ws';
import { handleRegistration } from './handlers/registrationHandler';
import { Room, Player, Commands, Game, ExtendedWebSocket } from './types';
import { handleAddUserToRoom, handleCreateRoom } from './handlers/roomHandler';
import { handleAddShips } from './handlers/gameHandler';
import { handleAttack, handleRandomAttack } from './handlers/handleAttack';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

const createWSServer = () => {
  const playersDB = new Map<string, Player>();
  const roomsDB = new Map<number, Room>();
  const gamesDB = new Map<number | string, Game>();
  let roomIdCounter = 1;

  const wss = new WebSocket.Server({
    port: PORT,
    host: 'localhost',
    clientTracking: true,
  });

  console.log('WebSocket Server Parameters:');
  console.log(`Port: ${wss.options.port}`);
  console.log(`Host: ${wss.options.host}`);
  console.log(`Max Payload: ${wss.options.maxPayload || 'default'}`);
  console.log(`Client Tracking: ${wss.options.clientTracking}`);
  console.log(`Number of clients: ${wss.clients.size}`);

  const logCommand = (command: string) => {
    console.log('\nCommand received:', command);
    console.log('Current connections:', wss.clients.size);
  };

  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('Client connected');
    console.log('Total connections:', wss.clients.size);

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message: WebSocket.Data) => {
      try {
        const messageToString = message.toString();
        const data = JSON.parse(messageToString);

        switch (data.type) {
          case Commands.REGISTRATION:
            handleRegistration(ws, data.data, playersDB, wss, roomsDB);
            logCommand('REGISTRATION');
            break;

          case Commands.CREATE_ROOM:
            handleCreateRoom(ws, playersDB, roomsDB, roomIdCounter, wss);
            logCommand('CREATE_ROOM');
            roomIdCounter++;
            break;

          case Commands.ADD_USER_TO_ROOM:
            handleAddUserToRoom(ws, data.data, playersDB, roomsDB, wss);
            logCommand('ADD_USER_TO_ROOM');
            break;

          case Commands.ADD_SHIPS:
            handleAddShips(data.data, gamesDB, ws);
            logCommand('ADD_SHIPS');
            break;

          case Commands.ATTACK:
            handleAttack(data.data, gamesDB, ws);
            logCommand('ATTACK');
            break;

          case Commands.RANDOM_ATTACK:
            handleRandomAttack(data.data, gamesDB, ws);
            logCommand('RANDOM_ATTACK');
            break;

          default:
            ws.send(
              JSON.stringify({
                type: Commands.ERROR,
                message: 'Unsupported message type',
              }),
            );
            logCommand('UNKNOWN');
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(
          JSON.stringify({
            type: Commands.ERROR,
            message: 'Error processing message',
          }),
        );
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      console.log('Remaining connections:', wss.clients.size);

      for (const name of playersDB.keys()) {
        if (name === ws.playerName) {
          playersDB.delete(name);
          break;
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) {
        console.log('Terminating inactive connection');
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  const shutdownServer = () => {
    console.log('\nShutting down WebSocket server...');

    clearInterval(interval);

    wss.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: Commands.ERROR,
          message: 'Server shutting down',
        }),
      );
      client.terminate();
    });

    wss.close(() => {
      console.log('WebSocket server closed');
      playersDB.clear();
      roomsDB.clear();
      gamesDB.clear();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdownServer);
  process.on('SIGINT', shutdownServer);

  console.log(`WebSocket Server is running on port ${PORT}`);
};

export default createWSServer;
