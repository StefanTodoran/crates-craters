import React, {Component} from "react";
import {StyleSheet, View} from "react-native";
import {MenuItem} from "./MenuItem";
import {GameBoard} from "./GameBoard";
import {Inventory} from "./Inventory";

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
    [0,8,0,2,5,0,4,0],
    [0,0,0,1,0,4,6,0],
    [1,1,1,1,0,0,5,0],
    [4,4,0,0,0,0,4,0],
    [6,5,0,0,0,4,0,0],
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
    [1,6,5,1,4,0,4,0],
    [5,4,0,3,5,0,4,4],
    [0,4,1,1,0,0,0,0],
    [0,4,2,0,0,1,0,4],
    [0,0,1,0,1,0,0,0],
    [8,0,5,4,0,0,5,5],
    [0,0,4,7,1,0,4,5],
    [1,5,1,2,1,0,4,4],
    [5,5,5,0,0,0,5,3],
    [0,0,5,1,0,1,0,1],
    [4,4,6,1,0,4,5,0],
    [0,4,1,1,5,5,1,0],
    [5,0,0,0,3,0,4,6],
];
const blankLevel = [
    [7,0,0,0,0,0,0,6],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
]

const walkables = [0,3,6,8];

const levels = {
    0: levelZero,
    1: levelOne,
    2: levelTwo,
    3: levelThree,
    4: levelFour,
};

for (let i = 5; i < 21; i++) {
    levels[i] = blankLevel;
}

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

export class LevelPage extends Component {
    state = {
        page: "select", // level select or playing level

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

    setPage = (page) => {
        this.setState({page: page});
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
            if (player.x > 1
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
                this.setPage("select");
                return;
            }
        }

        newBoard[player.y][player.x] = 7;
        const prevPlayer = findValInArray(this.state.board, 7);
        if (prevPlayer.x !== player.x || prevPlayer.y !== player.y) {
            this.setState({
                player: player,
                keys: this.state.keys + keys,
                coins: this.state.coins + coins,
                prevMove: fakeDeepCopy(prevMove),
                board: fakeDeepCopy(newBoard),
            });
        }
    }


    render() {
        switch (this.state.page) {
            case "select":
                const levelButtons = [];
                for (let i = 0; i < Object.keys(levels).length; i++) {
                    levelButtons.push(
                        <MenuItem style={styles.listButton} color={'#036bfc'}
                            key={`button_level_${i}`} value={i}
                            text={`level ${i}`} action={() => {
                                this.setLevel(i);
                                this.setPage("play");
                        }} />);
                }
                return (
                    <View style={styles.container}>
                        <View style={styles.navbar}>
                            <MenuItem style={styles.menuButton} color={'#036bfc'}
                                      text={"<- back to menu"} action={this.props.setPageCallback} value={"menu"}/>
                            <MenuItem style={styles.menuButton} color={'#036bfc'}
                                      text={"level select"} action={console.log} value={"boop!"} />
                        </View>
                        <View style={styles.buttonList}>
                            {levelButtons}
                        </View>
                    </View>
                );
            case "play":
                return (
                    <View style={styles.container}
                          onTouchStart={e => {
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

                              if (bti(up) + bti(down) + bti(left) + bti(right) === 1) {
                                  this.handleGesture(up, down, left, right);
                                  return;
                              }

                              const diff = Math.abs(vertDist) - Math.abs(horizDist);
                              if (diff > 0) {
                                  this.handleGesture(up, down, false, false);
                              } else {
                                  this.handleGesture(false, false, left, right);
                              }
                          }}>
                        <View style={styles.navbar}>
                            <MenuItem style={styles.menuButton} color={'#036bfc'}
                                      text={"<- level select"} action={this.setPage} value={"select"}/>
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
                                      value={null}/>
                        </View>
                        <GameBoard board={this.state.board}/>
                        <Inventory keys={this.state.keys} coins={this.state.coins} maxCoins={this.state.coinsNeeded}/>
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
    navbar: {
        flex: 1,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: clamp(width/15,15,25),
        // paddingBottom: clamp(width/15,15,25),
    },
    buttonList: {
        flex: 5,
        flexDirection: 'column',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        paddingHorizontal: clamp(width/12,20,30),
    },

    menuButton: {
        fontSize: clamp(width/15,15,25),
        textAlign: 'center',

        marginVertical: clamp(height/100, 4, 10),
        paddingVertical: clamp(height/100, 4, 10),

        width: clamp(width/3,100,300),
        borderWidth: 1,
        borderRadius: 5,
        borderColor: '#036bfc',
    },
    listButton: {
        fontSize: clamp(width/15,15,25),
        textAlign: 'center',

        marginVertical: clamp(height/100, 4, 10),
        marginHorizontal: clamp(width/50, 4, 10),
        paddingVertical: clamp(height/100, 4, 10),

        width: clamp(width/4,75,225),
        borderWidth: 1,
        borderRadius: 5,
        borderColor: '#036bfc',
    },
});
