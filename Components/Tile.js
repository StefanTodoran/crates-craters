import React, {Component} from 'react';
import {View, Image} from "react-native";

import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

export class Tile extends Component {
  render() {
    const maxWidth = (width * 0.9) / 8;
    const maxHeight = (height * 0.8) / 14;
    const size = Math.min(maxWidth, maxHeight);
    return (
      <View style={{
        width: size,
        height: size,
        backgroundColor: this.props.color,
      }}>
        <Image source={this.props.img} style={{width: size, height: size}}/>
      </View>
    );
  }
}