import React, {Component} from 'react';
import {View} from "react-native";
import {Tile} from "./Tile";
import {WallTile} from "./WallTile";

import door from '../assets/tiles/door.png';
import key from '../assets/tiles/key.png';
import crate from '../assets/tiles/crate.png';
import crater from '../assets/tiles/crater.png';
import coin from '../assets/tiles/coin.png';
import player from '../assets/tiles/player.png';
import flag from '../assets/tiles/flag.png';

export class GameBoard extends Component {
  render() {
    const board = [];
    const dimensions = [ this.props.board.length, this.props.board[0].length ];

    for (let i = 0; i < dimensions[0]; i++) {
      const row = [];
      for (let j = 0; j < dimensions[1]; j++) {
        if (this.props.board[i][j] === 1) { // a wall
          // const top = (i > 0) ? (this.props.board[i - 1][j] === 1) : true;
          // console.log(i,j,imax);
          // const bot = (i < imax) ? (this.props.board[i][j] === 1) : true;
          // const left = (j > 0) ? (this.props.board[i][j - 1] === 1) : true;
          // const right = (j < jmax) ? (this.props.board[i][j + 1] === 1) : true;
          //
          // const borderSize = 3;
          // const border = {
          //   "top": (top) ? 0 : borderSize,
          //   "bottom": (bot) ? 0 : borderSize,
          //   "left": (left) ? 0 : borderSize,
          //   "right": (right) ? 0 : borderSize,
          // }
          const borderColor = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j))? '#b1d1ff' : '#a1c8ff';
          // const fillColor = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j))? '#d0e4ff' : '#c0daff';
          const fillColor = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j))? '#c0daff' : '#b1d1ff';

          row.push(<WallTile key={`tile<${i},${j}>`} borderSize={5} color={fillColor} borderColor={borderColor}/>);
        } else {
          const tile = getTileSRC(this.props.board[i][j]);
          const color = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j))? '#fcfdff' : '#f0f6ff';
          row.push(<Tile key={`tile<${i},${j}>`} color={color} img={tile}/>);
        }
      }
      board.push(<View key={`row<${i}>`} style={{flexDirection: 'row', margin: 0}}>{row}</View>);
    }

    return (
      <View style={{
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#4290FD",
        // borderRadius: 3,
      }}>
        {board}
      </View>
    );
  }
}

function isEven(num){ return num % 2 === 0; }

function getTileSRC(val) {
  switch (val) {
    case 2:
      return door;
    case 3:
      return key;
    case 4:
      return crate;
    case 5:
      return crater;
    case 6:
      return coin;
    case 7:
      return player;
    case 8:
      return flag;
  }
  return 0;
}