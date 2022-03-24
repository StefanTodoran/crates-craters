import React, {Component} from 'react';
import {Pressable, Text} from "react-native";

export class MenuItem extends Component {
  doAction = () => {
    this.props.action(this.props.value);
  }

  render() {
    return (
      <Pressable style={this.props.style} onPress={this.doAction}>
        <Text style={{color: this.props.color, textAlign: 'center'}}>{this.props.text}</Text>
      </Pressable>
    );
  }
}