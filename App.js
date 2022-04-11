import { StatusBar } from 'expo-status-bar';
import {Modal, StyleSheet, Text, View} from 'react-native';
import {Component} from "react";
import {MenuItem} from "./Components/MenuItem";
import {LevelPage} from "./Components/LevelPage";
import {Tile} from "./Components/Tile";

// icon asset imports
import door from './assets/tiles/door.png';
import key from './assets/tiles/key.png';
import crate from './assets/tiles/crate.png';
import crater from './assets/tiles/crater.png';
import coin from './assets/tiles/coin.png';
import flag from './assets/tiles/flag.png';
// *****

import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

export default class App extends Component {
  state = {
    page: "menu",
    modalVisible: false,
  };

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
          <View style={{width: "100%", height: "100%"}}>
            <LevelPage setPageCallback={this.setPage}/>
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
    borderRadius: 12,

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
    borderRadius: 5,
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
