import { useReducer } from "react";
import { Game, doGameMove, initializeGameObj } from "./logic";
import { Direction, Level, PlayMode } from "./types";

/**
 * The level being played and its game state. Lives in App so play can be resumed
 * after leaving the play page.
 *
 * Undo history is stored as checkpoints (the move count before each player action)
 * rather than full game clones: undoing replays the level's moves up to the last
 * checkpoint. A double-tap jump is one action, so it undoes in one step.
 */
export interface PlaySession {
  level?: Level,
  game?: Game,
  checkpoints: number[],
  mode: PlayMode,
}

export type PlayAction =
  | { type: "load", level: Level } // Start a fresh game of this level.
  | { type: "setMode", mode: PlayMode }
  | { type: "move", direction: Direction }
  | { type: "jump", path: Direction[] } // A double-tap jump, applied as one action.
  | { type: "undo" }
  | { type: "restart" };

export const initialPlaySession: PlaySession = { checkpoints: [], mode: PlayMode.STANDARD };

function replay(level: Level, moves: Direction[]): Game {
  let game = initializeGameObj(level);
  for (const move of moves) [game] = doGameMove(game, move);
  return game;
}

function applyMoves(state: PlaySession, moves: Direction[]): PlaySession {
  const { game } = state;
  if (!game || game.won) return state;

  let next = game;
  let changed = false;
  for (const move of moves) {
    const [result, stateChanged] = doGameMove(next, move);
    next = result;
    changed ||= stateChanged;
  }
  if (!changed) return state;

  return { ...state, game: next, checkpoints: [...state.checkpoints, game.moveHistory.length] };
}

export function playSessionReducer(state: PlaySession, action: PlayAction): PlaySession {
  switch (action.type) {
    case "load":
      return { ...state, level: action.level, game: initializeGameObj(action.level), checkpoints: [] };
    case "setMode":
      return state.mode === action.mode ? state : { ...state, mode: action.mode };
    case "move":
      return applyMoves(state, [action.direction]);
    case "jump":
      return applyMoves(state, action.path);
    case "undo": {
      if (!state.level || !state.game || state.checkpoints.length === 0) return state;
      const checkpoints = state.checkpoints.slice(0, -1);
      const moveCount = state.checkpoints[state.checkpoints.length - 1];
      return { ...state, game: replay(state.level, state.game.moveHistory.slice(0, moveCount)), checkpoints };
    }
    case "restart":
      if (!state.level) return state;
      return { ...state, game: initializeGameObj(state.level), checkpoints: [] };
  }
}

export function usePlaySession() {
  return useReducer(playSessionReducer, initialPlaySession);
}
