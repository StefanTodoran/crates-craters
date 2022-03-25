import { StatusBar } from 'expo-status-bar';
import {Modal, StyleSheet, Text, View} from 'react-native';
import {Component} from "react";
import {MenuItem} from "./Components/MenuItem";
import {GameBoard} from "./Components/GameBoard";
import {Inventory} from "./Components/Inventory";
import {Tile} from "./Components/Tile";

import door from './assets/tiles/door.png';
import key from './assets/tiles/key.png';
import crate from './assets/tiles/crate.png';
import crater from './assets/tiles/crater.png';
import coin from './assets/tiles/coin.png';
import player from './assets/tiles/player.png';
import flag from './assets/tiles/flag.png';
import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

// TODO: get & parse these from a txt file rather than hard coding them in

// wall -> 1
// door -> 2, key -> 3
// crate -> 4, crater -> 5
// coin -> 6
// spawn/player -> 7, exit -> 8
const levelZero = [
  [0,0,0,1,0,0,0,0],
  [0,8,0,2,0,0,4,0],
  [0,0,0,1,0,4,0,0],
  [1,1,1,1,0,0,5,0],
  [4,4,0,0,0,0,4,0],
  [6,5,0,0,0,0,0,0],
  [0,1,1,1,1,0,7,0],
  [0,0,3,1,6,0,0,0],
];
const levelOne = [
  [0,0,2,0,1,1,1,3],
  [0,0,1,0,1,0,0,5],
  [8,0,1,0,2,0,4,0],
  [0,0,1,0,1,6,0,4],
  [1,1,1,0,1,1,1,1],
  [1,1,1,0,1,1,6,0],
  [1,1,0,4,5,1,1,0],
  [1,1,5,7,0,1,1,0],
  [1,3,4,4,4,0,1,0],
  [1,1,0,0,0,0,1,0],
  [1,1,4,4,0,0,1,0],
  [0,0,0,0,4,5,1,0],
  [1,1,1,1,2,1,1,0],
  [1,1,1,3,0,0,0,0],
];
const levelTwo = [
  [0,0,1,8,1,1,1,1],
  [0,6,1,2,1,0,6,0],
  [4,0,5,5,0,4,4,4],
  [0,0,1,0,1,0,0,0],
  [4,0,1,0,1,0,4,0],
  [0,4,1,0,1,0,5,4],
  [0,0,1,0,1,5,0,0],
  [0,0,4,7,4,0,0,0],
  [6,4,1,4,1,0,0,0],
  [1,1,1,0,1,1,1,1],
  [6,5,1,0,5,4,0,3],
  [4,0,0,0,4,0,4,0],
  [0,4,0,0,5,4,0,0],
  [0,0,4,0,4,0,4,6],
];
const levelThree = [
  [3,0,5,0,0,1,6,3],
  [4,4,0,4,4,1,1,2],
  [4,0,4,0,0,0,0,5],
  [0,4,1,1,1,8,0,0],
  [4,0,1,6,1,1,1,0],
  [0,5,1,5,1,0,1,0],
  [0,0,2,7,0,0,0,0],
  [0,0,1,4,4,4,1,4],
  [0,0,1,0,0,0,1,0],
  [5,0,1,1,2,1,1,0],
  [0,6,1,0,0,1,0,0],
  [0,4,1,0,0,0,0,0],
  [0,0,1,1,6,1,3,4],
  [0,0,1,1,0,1,1,1],
];
const levelFour = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
];

const walkables = [0,3,6,8];

const levels = {
  0: levelZero,
  1: levelOne,
  2: levelTwo,
  3: levelThree,
  4: levelFour,
};

// finds the first instance of a value in the given 2d array.
// returns an object with x and y values, which are NaN & NaN if the value does
// not exist in the array.
function findValInArray(array, val) {
  const dimensions = [ array.length, array[0].length ];

  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (array[i][j] === val) {
        return {y: i, x: j};
      }
    }
  }

  return {y: NaN, x: NaN};
}

// finds and returns the number of instances of a value in the given 2d array.
function countTimesInArray(array, val) {
  const dimensions = [ array.length, array[0].length ];
  let count = 0;
  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (array[i][j] === val) {
        count++;
      }
    }
  }

  return count;
}

// bti or bool to int
// returns 0 or 1 for false or true respectively
function bti(bool) {
  return bool === true ? 1 : 0;
}

// NOT an actual deep copy, but since we just need to use it for objects that contains
// numbers and arrays of numbers, it should be ok. BE WARNED: THIS FUNCTION IS DANGEROUS!
function fakeDeepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default class App extends Component {
  state = {
    page: "menu",
    modalVisible: false,

    level: 0,
    board: levels[0],

    player: {x: NaN, y: NaN},
    prevMove: null,

    keys: 0,
    coins: 0,
    coinsNeeded: 0,
  };

  componentDidMount() {
    this.initializeLevelState();
  }

  setLevel = (level) => {
    this.setState({level: level, board: levels[level], keys: 0, coins: 0, prevMove: null},
      () => {
        this.initializeLevelState();
      }
    );
  }

  initializeLevelState = () => {
    const pos = findValInArray(levels[this.state.level], 7);
    const coins = countTimesInArray(levels[this.state.level], 6);
    this.setState({player: pos, coinsNeeded: coins});
  }

  setPage = (page) => {
    this.setState({page: page});
  }

  setModalVisible = (visible) => {
    this.setState({ modalVisible: visible });
  }

  handleGesture = (up, down, left, right) => {
    let player = fakeDeepCopy(this.state.player);
    const prevMove = {
      player: fakeDeepCopy(player),
      board: fakeDeepCopy(this.state.board),
      coins: this.state.coins,
      keys: this.state.keys,
    };
    const dimensions = [ this.state.board.length, this.state.board[0].length ];
    let newBoard = fakeDeepCopy(this.state.board);
    newBoard[player.y][player.x] = 0;
    let keys = 0;

    if (up) {
      // if moving to an empty tile, key tile, or coin tile
      if (player.y > 0
          && walkables.includes(this.state.board[player.y - 1][player.x])) {
        player.y--;
      } else
      // if moving to a door tile and in possession of at least 1 key
      if (player.y > 0
          && this.state.board[player.y - 1][player.x] === 2
          && this.state.keys > 0) {
        player.y--;
        keys--;
      } else
      // if pushing a crate to an empty tile
      if (player.y > 1
          && this.state.board[player.y - 1][player.x] === 4
          && this.state.board[player.y - 2][player.x] === 0) {
        newBoard[player.y - 2][player.x] = 4;
        player.y--;
      } else
      // if pushing a crate into a crater
      if (player.y > 1
          && this.state.board[player.y - 1][player.x] === 4
          && this.state.board[player.y - 2][player.x] === 5) {
        newBoard[player.y - 2][player.x] = 0; // TODO: add filled in crater tile
        player.y--;
      }
    }

    if (down) {
      // if moving to an empty tile, key tile, or coin tile
      if (player.y < dimensions[0] - 1
          && walkables.includes(this.state.board[player.y + 1][player.x])) {
        player.y++;
      } else
      // if moving to a door tile and in possession of at least 1 key
      if (player.y < dimensions[0] - 1
          && this.state.board[player.y + 1][player.x] === 2
          && this.state.keys > 0) {
        player.y++;
        keys--;
      } else
      // if pushing a crate to an empty tile
      if (player.y < dimensions[0] - 2
          && this.state.board[player.y + 1][player.x] === 4
          && this.state.board[player.y + 2][player.x] === 0) {
        newBoard[player.y + 2][player.x] = 4;
        player.y++;
      } else
      // if pushing a crate into a crater
      if (player.y < dimensions[0] - 2
          && this.state.board[player.y + 1][player.x] === 4
          && this.state.board[player.y + 2][player.x] === 5) {
        newBoard[player.y + 2][player.x] = 0;
        player.y++;
      }
    }

    if (left) {
      // if moving to an empty tile, key tile, or coin tile
      if (player.x > 0
          && walkables.includes(this.state.board[player.y][player.x - 1])) {
        player.x--;
      } else
      // if moving to a door tile and in possession of at least 1 key
      if (player.x > 0
          && this.state.board[player.y][player.x - 1] === 2
          && this.state.keys > 0) {
        player.x--;
        keys--;
      } else
      // if pushing a crate to an empty tile
      if (player.x > 1
          && this.state.board[player.y][player.x - 1] === 4
          && this.state.board[player.y][player.x - 2] === 0) {
        newBoard[player.y][player.x - 2] = 4;
        player.x--;
      } else
      // if pushing a crate into a crater
      if (player.y > 1
          && this.state.board[player.y][player.x - 1] === 4
          && this.state.board[player.y][player.x - 2] === 5) {
        newBoard[player.y][player.x - 2] = 0; // TODO: add filled in crater tile
        player.x--;
      }
    }

    if (right) {
      // if moving to an empty tile, key tile, or coin tile
      if (player.x < dimensions[1] - 1
          && walkables.includes(this.state.board[player.y][player.x + 1])) {
        player.x++;
      } else
      // if moving to a door tile and in possession of at least 1 key
      if (player.x < dimensions[1] - 1
          && this.state.board[player.y][player.x + 1] === 2
          && this.state.keys > 0) {
        player.x++;
        keys--;
      } else
      // if pushing a crate to an empty tile
      if (player.x < dimensions[1] - 2
          && this.state.board[player.y][player.x + 1] === 4
          && this.state.board[player.y][player.x + 2] === 0) {
        newBoard[player.y][player.x + 2] = 4;
        player.x++;
      } else
      // if pushing a crate into a crater
      if (player.x < dimensions[1] - 2
          && this.state.board[player.y][player.x + 1] === 4
          && this.state.board[player.y][player.x + 2] === 5) {
        newBoard[player.y][player.x + 2] = 0; // TODO: add filled in crater tile
        player.x++;
      }
    }

    keys += (this.state.board[player.y][player.x] === 3) ? 1 : 0;
    const coins = (this.state.board[player.y][player.x] === 6) ? 1 : 0;

    if (this.state.board[player.y][player.x] === 8) {
      if (this.state.coins < this.state.coinsNeeded) {
        player = prevMove.player;
      } else {
        this.setLevel(this.state.level + 1);
        return;
      }
    }

    newBoard[player.y][player.x] = 7;
    this.setState({
      player: player,
      keys: this.state.keys + keys,
      coins: this.state.coins + coins,
      prevMove: fakeDeepCopy(prevMove),
      board: fakeDeepCopy(newBoard),
    });
  }

  render() {
    const { modalVisible } = this.state;

    switch (this.state.page) {
      case "play":
        return (
          <View style={styles.container}
            onTouchStart={ e => {
              this.touchY = e.nativeEvent.pageY;
              this.touchX = e.nativeEvent.pageX;
            }}
            onTouchEnd={e => {
              const distance = 35; // TODO: probably set this based on screen size later

              const vertDist = this.touchY - e.nativeEvent.pageY;
              const horizDist = this.touchX - e.nativeEvent.pageX;

              const up = (vertDist > distance);
              const down = (vertDist < -distance);
              const left = (horizDist > distance);
              const right = (horizDist < -distance);

              console.log(up,down,left,right);
              if (bti(up) + bti(down) + bti(left) + bti(right) === 1) {
                this.handleGesture(up, down, left, right);
                return;
              }

              const diff = Math.abs(vertDist) - Math.abs(horizDist);
              if (diff > 0) {
                this.handleGesture(up, down, false, false);
                return;
              } else {
                this.handleGesture(false, false, left, right);
                return;
              }
            }}>
            <View style={styles.navbar}>
              <MenuItem style={styles.menuButton} color={'#036bfc'}
                        text={"<- back to menu"} action={this.setPage} value={"menu"} />
              <MenuItem style={styles.menuButton} color={'#036bfc'}
                        text={(this.state.prevMove == null) ? "no moves to undo" : "undo last move"}
                        action={(this.state.prevMove == null) ? console.log : () => {
                          const prevMove = fakeDeepCopy(this.state.prevMove);
                          this.setState({
                            player: prevMove.player,
                            board: prevMove.board,
                            coins: prevMove.coins,
                            keys: prevMove.keys,
                            prevMove: null,
                          });
                        }}
                        value={null} />
            </View>
            <GameBoard board={this.state.board}/>
            <Inventory keys={this.state.keys} coins={this.state.coins} maxCoins={this.state.coinsNeeded}/>
            <StatusBar hidden={true} />
          </View>
        );
      case "editor":
        return (
          <View style={styles.container}>
            <View style={styles.navbar}>
              <MenuItem style={styles.menuButton} color={'#036bfc'}
                        text={"< back"} action={this.setPage} value={"menu"} />
              <MenuItem style={styles.menuButton} color={'#036bfc'}
                        text={"level editor"} action={console.log} value={"editor page"} />
            </View>
            <View style={{height: height/2}} />
            <StatusBar hidden={true} />
          </View>
        );
      case "online":
        return (
          <View style={styles.container}>
            <View style={styles.navbar}>
              <MenuItem style={styles.menuButton} color={'#036bfc'}
                        text={"< back"} action={this.setPage} value={"menu"} />
              <MenuItem style={styles.menuButton} color={'#036bfc'}
                        text={"browse levels"} action={console.log} value={"editor page"} />
            </View>
            <View style={{height: height/2}} />
            <StatusBar hidden={true} />
          </View>
        );
      default:
        return (
          <View style={styles.container}>
            <Text style={styles.title}>crates & craters</Text>

            <MenuItem style={styles.menuButton} color={'#036bfc'}
                      text={"play offline"} action={this.setPage} value={"play"} />
            <MenuItem style={styles.menuButton} color={'#036bfc'}
                      text={"level editor"} action={this.setPage} value={"editor"} />
            <MenuItem style={styles.menuButton} color={'#036bfc'}
                      text={"online levels"} action={this.setPage} value={"online"} />
            <MenuItem style={styles.menuButton} color={'#036bfc'}
                      text={"how to play"} action={this.setModalVisible} value={true} />

            <View style={{height: height/5}} />

            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => {
                this.setModalVisible(!modalVisible);
              }}
            >
              <View style={styles.container}>
                <View style={styles.modalView}>

                  <Text style={styles.modalTitle}>how to play</Text>

                  <Text style={styles.modalText}>
                    The objective of the game is simple: collect all of the coins, before making your way to the
                    finish flag.
                  </Text>
                  <View style={styles.modalRow}>
                    <Tile color={"#fff"} img={flag}/><Tile color={"#fff"} img={coin}/>
                  </View>

                  <Text style={styles.modalText}>
                    There are, however, a number of obstacles in your way. The first one are doors. All doors
                    start off locked, and must be unlocked with a key. Any key can unlock any door, but each key
                    is single use.
                  </Text>
                  <View style={styles.modalRow}>
                    <Tile color={"#fff"} img={door}/><Tile color={"#fff"} img={key}/>
                  </View>

                  <Text style={styles.modalText}>
                    The primary obstacle are crates and craters. You can't walk on either of these
                    tiles. However, if there is either an empty space or a crater behind a crate, you can push
                    it. If you push a crate into a crater, it "fills" the crater, creating a walkable tile.
                  </Text>
                  <View style={styles.modalRow}>
                    <Tile color={"#fff"} img={crate}/><Tile color={"#fff"} img={crater}/>
                  </View>

                  <Text style={styles.modalText}>
                    You can undo ONE move. Swipe in any direction to move one tile in that direction. You cannot move diagonally.
                    Good luck out there!
                  </Text>
                  <MenuItem style={styles.menuButton} color={'#036bfc'}
                            text={"close"} action={this.setModalVisible} value={false} />

                </View>
              </View>
            </Modal>
            <StatusBar hidden={true} />

          </View>
        );
    }
  }
}

// Clamp number between two values with the following line:
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    borderRadius: 6,

    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",

    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  navbar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: clamp(width/15,15,25),
    paddingBottom: clamp(width/15,15,25),
  },

  menuButton: {
    fontSize: clamp(width/15,15,25),
    textAlign: 'center',

    marginVertical: clamp(height/100, 4, 10),
    paddingVertical: clamp(height/100, 4, 10),

    width: clamp(width/3,100,300),
    borderWidth: 1,
    borderRadius: 3,
    borderColor: '#036bfc',
  },
  navbarButton: {
    fontSize: clamp(width/15,15,25),
    textAlign: 'center',
  },


  title: {
    fontSize: clamp(width/10,25,40),
    paddingVertical: clamp(height/50, 10, 20),
    color: '#036bfc',
  },
  modalRow: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalText: {
    fontSize: clamp(width/50,14,20),
    paddingVertical: 10,
    textAlign: 'left',
  },
  modalTitle: {
    fontSize: clamp(width/15,16,25),
    textAlign: 'center',
    color: '#036bfc',
  },
});
