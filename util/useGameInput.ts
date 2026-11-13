import { useContext, useMemo, useRef, useState } from "react";
import { Animated, GestureResponderEvent, PanResponder, PanResponderGestureState, useWindowDimensions } from "react-native";
import GlobalContext from "../GlobalContext";
import { useBoardPosition } from "./hooks";
import { Game, Position, canMoveTo, doGameMove } from "./logic";
import { Direction } from "./types";

/**
 * The drag preview offset, in pixels. These are Animated values driven straight from
 * the gesture, so dragging updates the player preview without re-rendering anything.
 * magnitude is max(|x|, |y|), used to scale the player up as it is dragged.
 */
export interface TouchAnim {
  x: Animated.Value,
  y: Animated.Value,
  magnitude: Animated.Value,
  epoch: number, // Increments with each swap, so Player can make React refresh its drag-driven views.
}

interface Options {
  game: Game,
  tileSize: number,
  onMove: (direction: Direction) => void,
  onJump: (path: Direction[]) => void, // Called after the jump's path animation finishes.
}

/**
 * Handles the play page's gestures: swipes become moves, and a double tap on a tile
 * jumps the player there along the shortest path (with a press and path animation).
 */
export function useGameInput({ game, tileSize, onMove, onJump }: Options) {
  const { dragSensitivity, doubleTapDelay } = useContext(GlobalContext);
  const win = useWindowDimensions();

  // The responder is created once, so it reads everything that changes through this.
  const latest = useRef({ game, tileSize, onMove, onJump, dragSensitivity, doubleTapDelay, swipeDistance: win.width / 10 });
  latest.current = { game, tileSize, onMove, onJump, dragSensitivity, doubleTapDelay, swipeDistance: win.width / 10 };

  // The drag offset belongs to the current game. Dragging updates the views directly
  // (outside React), so React never knows they moved: when a move rendered a zero
  // offset, React saw no change from its last render and left the stale offset on the
  // view, drawing the player past its new tile. Resetting with setValue instead was a
  // separate native update that could land a frame before or after the new board.
  // So a move swaps in fresh zeroed values (a new epoch) in the same render as the
  // moved game, and Player uses the epoch to force React to re-send those views' styles.
  const [touch, setTouchAnim] = useState(() => newTouchAnim(0));
  const touchRef = useRef(touch);

  const { boardRef, boardPosition, remeasure } = useBoardPosition();

  // Double tap tracking: the previous tap's time and tile, since a double tap must hit
  // the same tile twice within doubleTapDelay.
  const prevTouchTime = useRef(Date.now());
  const prevTouchPos = useRef<Position>(undefined);
  const [touchPos, setTouchPos] = useState({ y: -1, x: -1 });
  const pressAnim = useRef(new Animated.Value(0)).current;

  const [pathFollowed, setPathFollowed] = useState<Position[]>([]);
  const pathAnim = useRef(new Animated.Value(0)).current;
  // Input is ignored while jumping, since the jump is computed from the game as it
  // was when it started.
  const isJumping = useRef(false);

  const panResponder = useMemo(() => {
    const enabled = () => !latest.current.game.won;

    function setTouch(x: number, y: number) {
      const touch = touchRef.current;
      touch.x.setValue(x);
      touch.y.setValue(y);
      touch.magnitude.setValue(Math.max(Math.abs(x), Math.abs(y)));
    }

    function startJump(game: Game, pressX: number, pressY: number) {
      isJumping.current = true;
      setTouchPos({ x: pressX, y: pressY });
      prevTouchPos.current = undefined;

      Animated.timing(pressAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start(() => {
        Animated.timing(pressAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();

        const path = canMoveTo(game, pressX, pressY);
        if (!path) {
          isJumping.current = false;
          return;
        }

        const visitedSquares: Position[] = [];
        let current = game;
        for (const move of path) {
          [current] = doGameMove(current, move);
          visitedSquares.push(current.player);
        }

        setPathFollowed(visitedSquares);
        Animated.timing(pathAnim, {
          toValue: 1,
          duration: 200 + (visitedSquares.length * 25),
          useNativeDriver: true,
        }).start(() => {
          Animated.timing(pathAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setPathFollowed([]);
            latest.current.onJump(path);
            isJumping.current = false;
          });
        });
      });
    }

    function onGestureStart(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
      const { game, tileSize, doubleTapDelay } = latest.current;
      setTouch(0, 0);

      remeasure(); // Async: keeps the position fresh for subsequent taps.
      const pressX = Math.floor((gestureState.x0 - boardPosition.current.x) / tileSize);
      const pressY = Math.floor((gestureState.y0 - boardPosition.current.y) / tileSize);

      const isDoubleTap =
        Date.now() - prevTouchTime.current < doubleTapDelay &&
        prevTouchPos.current?.x === pressX &&
        prevTouchPos.current?.y === pressY;

      // Wait for a jump to finish before allowing another.
      if (isDoubleTap && !isJumping.current) {
        startJump(game, pressX, pressY);
      } else {
        prevTouchPos.current = { x: pressX, y: pressY };
        prevTouchTime.current = Date.now();
      }
    }

    function onGestureMove(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
      const sensitivity = latest.current.dragSensitivity / 100; // Stored as a percent, e.g. 60.
      let dragY = Math.abs(gestureState.dy) * sensitivity;
      let dragX = Math.abs(gestureState.dx) * sensitivity;

      // Dampen the minor axis so the preview leans toward one direction.
      if (dragX > dragY) {
        dragY /= Math.max(2, dragX - dragY);
      } else {
        dragX /= Math.max(2, dragY - dragX);
      }

      setTouch(Math.sign(gestureState.dx) * dragX, Math.sign(gestureState.dy) * dragY);
    }

    function onGestureEnd(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
      const distance = latest.current.swipeDistance;
      const { dx, dy } = gestureState;
      const vertical = Math.abs(dy) > Math.abs(dx);
      const along = vertical ? dy : dx;
      if (Math.abs(along) <= distance || isJumping.current) { // Not a swipe.
        setTouch(0, 0);
        return;
      }

      // Fast successive swipes shouldn't count as a double tap.
      prevTouchPos.current = undefined;

      const direction = vertical ?
        (along < 0 ? Direction.UP : Direction.DOWN) :
        (along < 0 ? Direction.LEFT : Direction.RIGHT);
      const { game, onMove } = latest.current;
      if (!doGameMove(game, direction)[1]) { // Invalid move: nothing re-renders, so just reset.
        setTouch(0, 0);
        return;
      }
      const fresh = newTouchAnim(touchRef.current.epoch + 1);
      touchRef.current = fresh;
      setTouchAnim(fresh); // Batched with the move's state update.
      onMove(direction);
    }

    return PanResponder.create({
      onStartShouldSetPanResponder: enabled,
      onStartShouldSetPanResponderCapture: enabled,
      onMoveShouldSetPanResponder: enabled,
      onMoveShouldSetPanResponderCapture: enabled,
      onPanResponderTerminationRequest: enabled,
      onShouldBlockNativeResponder: enabled,

      onPanResponderGrant: onGestureStart,
      onPanResponderMove: onGestureMove,
      onPanResponderRelease: onGestureEnd,
      onPanResponderTerminate: onGestureEnd,
    });
  }, []);

  return {
    panHandlers: panResponder.panHandlers,
    touch,
    boardRef,
    remeasure,
    touchPos,
    pressAnim,
    pathFollowed,
    pathAnim,
  };
}

function newTouchAnim(epoch: number): TouchAnim {
  return { x: new Animated.Value(0), y: new Animated.Value(0), magnitude: new Animated.Value(0), epoch };
}
