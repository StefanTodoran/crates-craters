import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, ImageSourcePropType, ImageStyle, StyleSheet, Text, View } from "react-native";
import BackButton from "../assets/BackButton";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics, Theme } from "../Theme";
import { Tutorial } from "../util/types";
import SimpleButton from "./SimpleButton";

interface TutorialContentPage {
  title: string,
  titleColor: string,
  theme?: Theme,
  content: string,
  images: ImageSourcePropType[],
  spaceImages?: boolean,
}

const tutorials: { [key in Tutorial]: TutorialContentPage } = {
  [Tutorial.MOVEMENT]:
  {
    title: "Movement",
    titleColor: colors.MAIN_PURPLE,
    content: "Swipe anywhere on the board in any direction to move one tile in that direction. You cannot move diagonally.",
    images: [graphics.MOVEMENT_HINT_ICON],
  },
  [Tutorial.OBJECTIVE]: {
    title: "Objective",
    titleColor: colors.YELLOW_THEME.MIDDLE_COLOR,
    theme: colors.YELLOW_THEME,
    content: "The goal of the game is to collect all of the coins and reach the finish flag. This is the only requirement to win.",
    images: [graphics.FLAG, graphics.COIN],
  },
  [Tutorial.CRATES_CRATERS]: {
    title: "Crates & Craters",
    titleColor: colors.MAIN_PURPLE,
    content: "The primary obstacle are crates and craters. You can't walk on either of these tiles. However, if there is either an empty space or a crater behind a crate, you can \"walk into it\" to push it. If you push a crate into a crater, it fills in the crater, creating a walkable tile.",
    images: [graphics.CRATE, graphics.CRATER],
  },
  [Tutorial.ONEWAY_TILES]: {
    title: "One-Way Tiles",
    titleColor: colors.BLUE_THEME.MAIN_COLOR,
    theme: colors.BLUE_THEME,
    content: "One-way tiles cannot be entered from the sides with the bar (opposite direction of the arrows), but can be entered from every other side. Crates can also be pushed through following the same rules as the player.",
    images: [graphics.ONE_WAY_ONE_DIR, graphics.ONE_WAY_OPPOSITE_SIDES, graphics.ONE_WAY_CORNER],
    spaceImages: true,
  },
  // [Tutorial.FILTERS]: {
  //   title: "Filters",
  //   titleColor: colors.ORANGE_THEME.MAIN_COLOR,
  //   theme: colors.ORANGE_THEME,
  //   content: "Filter tiles are completely pass-through tiles for the player, but block any type of pushable tiles from entering them.",
  //   images: [graphics.FILTER],
  // },
  [Tutorial.DOORS_KEYS]: {
    title: "Doors & Keys",
    titleColor: colors.GREEN_THEME.MIDDLE_COLOR,
    theme: colors.GREEN_THEME,
    content: "Doors are a solid tile, like walls. The player can unlock any door using any key by walking into the door, consuming the key. An opened door is replaced by an empty tile.",
    images: [graphics.DOOR, graphics.KEY],
  },
  [Tutorial.BOMBS]: {
    title: "Bombs",
    titleColor: colors.RED_THEME.MAIN_COLOR,
    theme: colors.RED_THEME,
    content: "Bombs can be pushed similarly to crates, but cannot fill in craters. After a set number of turns, the fuse expires and the bomb explodes directly (not diagonally) adjacent crates.",
    images: [graphics.LITTLE_EXPLOSION, graphics.BOMB, graphics.EXPLOSION],
  },
  [Tutorial.METAL_CRATES]: {
    title: "Metal Crates",
    titleColor: colors.RED_THEME.MAIN_COLOR,
    theme: colors.RED_THEME,
    content: "Metal crates are solid pushable tiles similar to crates, but they cannot be blown up by bombs and cannot fill in craters.",
    images: [graphics.EXPLOSION, graphics.METAL_CRATE],
  },
  [Tutorial.ICE_BLOCKS]: {
    title: "Ice Blocks",
    titleColor: colors.BLUE_THEME.MAIN_COLOR,
    theme: colors.BLUE_THEME,
    content: "Ice blocks are solid pushable tiles similar to crates, but when pushed they slide until they come into contact with a non-empty tile.",
    images: [graphics.ONE_WAY_ONE_DIR, graphics.ICE_BLOCK],
  },
  [Tutorial.MISC]: {
    title: "Miscellaneous",
    titleColor: colors.MAIN_PURPLE,
    content: "From the main menu you can undo any number of moves. Also, if there is a tile you could navigate to you can double tap on that tile to skip to that position.",
    images: [graphics.SKIP_HINT_ICON],
  },
};

interface Props {
  introduces: Tutorial[],
  hideTutorial: () => void,
  onlyContent?: boolean,
}

export default function TutorialHint({ introduces, hideTutorial, onlyContent }: Props) {
  const { darkMode } = useContext(GlobalContext);

  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState: number, callback?: () => void) => {
    Animated.timing(anim, {
      toValue: animState,
      duration: 250,
      useNativeDriver: true
    }).start(callback);
  }
  useEffect(() => {
    setAnimTo(1);
  }, []);

  const tutorial = useMemo(() => {
    const pages: TutorialContentPage[] = [];
    introduces.forEach(hint => {
      if (hint in tutorials) pages.push(tutorials[hint]);
    });
    return pages;
  }, [introduces]);

  const [page, setPage] = useState(0);
  const maxPage = tutorial.length - 1;

  if (tutorial.length === 0) return <></>;
  if (onlyContent) {
    return (
      <>
        <Text style={TextStyles.subtitle(darkMode, tutorial[page].titleColor)}>
          {tutorial[page].title}
        </Text>
        <Text style={TextStyles.paragraph(darkMode)}>
          {tutorial[page].content}
        </Text>

        <View style={styles.row}>
          {tutorial[page].images.map((image, index) => {
            let iconStyle: ImageStyle = styles.icon;
            if (tutorial[page].images.length === 1) iconStyle = styles.bigIcon;
            if (index > 0 && tutorial[page].spaceImages) iconStyle = styles.spacedIcon;
            return <Image key={index} style={iconStyle} source={image} />;
          })}
        </View>
      </>
    );
  }
  return (
    <Animated.View style={[
      styles.container,
      {
        backgroundColor: darkMode ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)",
        transform: [{
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [normalize(100), 0],
          }),
        }],
        opacity: anim,
      }
    ]}>
      <Text style={TextStyles.subtitle(darkMode, tutorial[page].titleColor)}>
        {tutorial[page].title}
      </Text>
      <Text style={TextStyles.paragraph(darkMode)}>
        {tutorial[page].content}
      </Text>

      <View style={styles.row}>
        {tutorial[page].images.map((image, index) => {
          let iconStyle: ImageStyle = styles.icon;
          if (tutorial[page].images.length === 1) iconStyle = styles.bigIcon;
          if (index > 0 && tutorial[page].spaceImages) iconStyle = styles.spacedIcon;
          return <Image key={index} style={iconStyle} source={image} />;
        })}
      </View>

      <View style={styles.row}>
        <SimpleButton
          onPress={() => setPage(page - 1)}
          Svg={BackButton}
          extraMargin={[8, 0]}
          disabled={page === 0}
          theme={tutorial[page].theme}
          square
        />
        {page < maxPage && <SimpleButton
          onPress={() => setPage(page + 1)}
          text="Next"
          Svg={BackButton}
          theme={tutorial[page].theme}
          svgProps={{ flipped: true, fillColor: colors.OFF_WHITE }}
          square
          extraMargin={[8, 0]}
          main
        />}
        {page === maxPage && <SimpleButton
          onPress={() => setAnimTo(0, hideTutorial)}
          theme={tutorial[page].theme}
          icon={graphics.PLAY_ICON}
          text="Close"
          extraMargin={[8, 0]}
          main
        />}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: normalize(24),
    paddingBottom: normalize(24),
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: normalize(16),
  },
  icon: {
    height: normalize(40),
    width: normalize(40),
    marginVertical: normalize(10),
  },
  spacedIcon: {
    height: normalize(40),
    width: normalize(40),
    marginVertical: normalize(10),
    marginHorizontal: normalize(10),
  },
  bigIcon: {
    height: normalize(90),
    width: normalize(90),
  },
});