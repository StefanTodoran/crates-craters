import React, {Component} from 'react';
import {View, Text} from "react-native";
import {Tile} from "./Tile";

import key from '../assets/tiles/key.png';
import coin from '../assets/tiles/coin.png';

import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

export class Inventory extends Component {
  render() {
    const size = clamp(width/20,10,30);
    const keys = [];

    for (let i = 0; i < this.props.keys; i++) {
      keys.push(<Tile key={i} color={"#fff"} img={key}/>);
    }

    return (
      <View style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: clamp(width/20,5,15),
      }}>
        <View style={{flexDirection: 'row'}}>{keys}</View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={{fontSize: size, color: '#81B5FE'}}>{this.props.coins}/{this.props.maxCoins}</Text>
          <Tile color={"#fff"} img={coin}/>
        </View>
      </View>
    );
  }
}

// Clamp number between two values with the following line:
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);