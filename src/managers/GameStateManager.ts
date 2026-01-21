export enum GameState {
  BOOT = 'boot',
  PRELOAD = 'preload',
  ATTRACT = 'attract',
  MENU = 'menu',
  TEAM_SELECT = 'team_select',
  GAMEPLAY = 'gameplay',
  PAUSED = 'paused',
  QUARTER_END = 'quarter_end',
  GAME_OVER = 'game_over',
}

export interface GameStateData {
  homeTeam?: string;
  awayTeam?: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: number;
  possession: 'home' | 'away';
}

type StateChangeCallback = (newState: GameState, previousState: GameState, data?: GameStateData) => void;

class GameStateManagerClass {
  private currentState: GameState = GameState.BOOT;
  private previousState: GameState = GameState.BOOT;
  private listeners: StateChangeCallback[] = [];
  private gameData: GameStateData = {
    homeScore: 0,
    awayScore: 0,
    quarter: 1,
    timeRemaining: 120,
    possession: 'home',
  };

  public getCurrentState(): GameState {
    return this.currentState;
  }

  public getPreviousState(): GameState {
    return this.previousState;
  }

  public getGameData(): GameStateData {
    return { ...this.gameData };
  }

  public setState(newState: GameState, data?: Partial<GameStateData>): void {
    if (newState === this.currentState) return;

    this.previousState = this.currentState;
    this.currentState = newState;

    if (data) {
      this.gameData = { ...this.gameData, ...data };
    }

    this.notifyListeners();
  }

  public updateGameData(data: Partial<GameStateData>): void {
    this.gameData = { ...this.gameData, ...data };
  }

  public resetGameData(): void {
    this.gameData = {
      homeScore: 0,
      awayScore: 0,
      quarter: 1,
      timeRemaining: 120,
      possession: 'home',
    };
  }

  public onStateChange(callback: StateChangeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      callback(this.currentState, this.previousState, this.gameData);
    });
  }

  public canTransitionTo(targetState: GameState): boolean {
    const validTransitions: Record<GameState, GameState[]> = {
      [GameState.BOOT]: [GameState.PRELOAD],
      [GameState.PRELOAD]: [GameState.MENU, GameState.ATTRACT],
      [GameState.ATTRACT]: [GameState.MENU],
      [GameState.MENU]: [GameState.TEAM_SELECT, GameState.GAMEPLAY, GameState.ATTRACT],
      [GameState.TEAM_SELECT]: [GameState.MENU, GameState.GAMEPLAY],
      [GameState.GAMEPLAY]: [GameState.PAUSED, GameState.QUARTER_END, GameState.GAME_OVER],
      [GameState.PAUSED]: [GameState.GAMEPLAY, GameState.MENU],
      [GameState.QUARTER_END]: [GameState.GAMEPLAY, GameState.GAME_OVER],
      [GameState.GAME_OVER]: [GameState.MENU, GameState.TEAM_SELECT],
    };

    return validTransitions[this.currentState]?.includes(targetState) ?? false;
  }
}

export const GameStateManager = new GameStateManagerClass();
