
export interface GameDataPoint {
  turn: number;
  player1Value: number;
  player2Value: number;
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface PlayerState {
  id: number;
  name: string;
  currentWeight: number;
  totalScore: number;
  color: string;
}
