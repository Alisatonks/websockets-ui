import WebSocket from 'ws';

export interface RegistrationData {
  name: string;
  password: string;
}

export interface Player {
  password: string;
  index: number;
}

export interface PlayerInRoom {
  name: string;
  index: number;
  session: WebSocket;
}

export interface ExtendedWebSocket extends WebSocket {
  playerName?: string;
}

export interface Room {
  roomId: number;
  playersInRoom: PlayerInRoom[];
}

export enum Commands {
  REGISTRATION = 'reg',
  CREATE_ROOM = 'create_room',
  ADD_USER_TO_ROOM = 'add_user_to_room',
  UPDATE_ROOM = 'update_room',
  CREATE_GAME = 'create_game',
  ADD_SHIPS = 'add_ships',
  START_GAME = 'start_game',
  ATTACK = 'attack',
  TURN = 'turn',
  ERROR = 'error',
  DISCONNECT = 'disconnect',
}

export interface Position {
  x: number;
  y: number;
}

export enum Size {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'LARGE',
  HUGE = 'HUGE',
}

export interface Ships {
  position: Position;
  direction: boolean;
  length: number;
  type: Size;
}

export interface ShipsResponse {
  gameId: number;
  ships: Ships[];
  indexPlayer: number;
}
export interface ShipCells {
  x: number;
  y: number;
  hit: boolean;
}

export type ShipCellsArray = ShipCells[];

export interface PlayerData {
  id: number | string;
  ships: Ships[];
  ready: boolean;
  session: WebSocket;
  shipsCells: ShipCellsArray[];
}

export interface Game {
  gameId: number | string;
  players: PlayerData[];
  currentTurnPlayerId: number | string | null;
}
