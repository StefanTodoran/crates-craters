import React, {Component} from "react";
import {View} from "react-native";
import {MenuItem} from "./MenuItem";
import {GameBoard} from "./GameBoard";
import {Inventory} from "./Inventory";
import {StatusBar} from "expo-status-bar";

export class Level extends Component {
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
        return(
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
        )
    }
}