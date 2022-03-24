import { StatusBar } from 'expo-status-bar';
import {Modal, StyleSheet, Text, View} from 'react-native';
import {Component} from "react";
import {MenuItem} from "./Components/MenuItem";

import { Dimensions } from 'react-native';
import {GameBoard} from "./Components/GameBoard";
const { width, height } = Dimensions.get('window');

// wall -> 1
// door -> 2, key -> 3
// crate -> 4, crater -> 5
// crystal -> 6
// spawn -> 7, exit -> 8
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
  [0,0,1,0,1,0,0,0],
  [0,6,1,8,1,0,6,0],
  [4,0,5,5,0,4,4,4],
  [0,0,1,0,1,0,0,0],
  [4,0,1,0,1,0,4,0],
  [0,4,1,0,1,0,5,4],
  [0,0,1,0,1,5,0,0],
  [0,0,4,7,4,0,0,0],
  [6,4,1,4,1,0,0,0],
  [1,1,1,0,1,1,1,1],
  [6,5,1,0,5,4,0,6],
  [4,0,0,0,4,0,4,0],
  [0,4,0,0,5,4,0,0],
  [0,0,4,0,4,0,4,6],
];
const levelThree = [
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

const levels = {
  1: levelOne,
  2: levelTwo,
  3: levelThree,
  4: levelFour,
};

export default class App extends Component {
  state = {
    page: "menu",
    modalVisible: false,
    level: 1,
  };

  forDebugONLY_setLevel = (level) => {
    this.setState({level: this.state.level + 1});
  }

  setPage = (page) => {
    this.setState({page: page});
  }

  setModalVisible = (visible) => {
    this.setState({ modalVisible: visible });
  }

  render() {
    const { modalVisible } = this.state;

    switch (this.state.page) {
      case "play":
        return (
          <View style={styles.container}>
            <View style={styles.navbar}>
              <MenuItem style={styles.menuButton} color={'#036bfc'}
                        text={"< back"} action={this.setPage} value={"menu"} />
              <MenuItem style={styles.menuButton} color={'#036bfc'}
                        text={`level ${this.state.level}`} action={this.forDebugONLY_setLevel} value={this.state.level} />
            </View>
            <GameBoard board={levels[this.state.level]}/>
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
                  <Text style={styles.modalText}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The objective of the game is simple: collect all of the magic crystals.
                    There are, however, a number of obstacles in your way. The primary one are doors. All doors start off
                    locked, and must be unlocked with a key. Any key can unlock any door, but each key is single use. The
                    second obstacle are crates and craters. You can walk on neither of these tiles. However, if there is either
                    an empty space or a crater behind a crate, you can push it. If you push a crate into a crater, it "fills" the
                    crater, creating a walkable tile. Good luck out there!
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
    alignItems: "center",
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
