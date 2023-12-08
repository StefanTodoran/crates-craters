// MAIN THEME
const mainGraphics = {
  DOOR: require("./assets/main_theme/door.png"),
  KEY: require("./assets/main_theme/key.png"),
  CRATE: require("./assets/main_theme/crate.png"),
  CRATER: require("./assets/main_theme/crater.png"),
  COIN: require("./assets/main_theme/coin.png"),
  FLAG: require("./assets/main_theme/flag.png"),
  BOMB: require("./assets/main_theme/bomb.png"),
  ONE_WAY_LEFT: require("./assets/main_theme/one_way_left.png"),
  ONE_WAY_RIGHT: require("./assets/main_theme/one_way_right.png"),
  ONE_WAY_UP: require("./assets/main_theme/one_way_up.png"),
  ONE_WAY_DOWN: require("./assets/main_theme/one_way_down.png"),
  EXPLOSION: require("./assets/main_theme/explosion.png"),
  LITTLE_EXPLOSION: require("./assets/main_theme/little_explosion.png"),
  PLAYER: require("./assets/main_theme/player.png"),
  PLAYER_OUTLINED: require("./assets/main_theme/player_outlined.png"),
  PLAYER_OUTLINED_DARK: require("./assets/main_theme/player_outlined_dark.png"),

  THEME_ICON: require("./assets/main_theme/theme_icon.png"),
  NIGHT_MODE_ICON: require("./assets/main_theme/night_icon.png"),
  HAMMER_ICON: require("./assets/main_theme/hammer_icon.png"),
  WALL_ICON: require("./assets/main_theme/wall_icon.png"),
  SAVE_ICON: require("./assets/main_theme/save_icon.png"),
  LOAD_ICON: require("./assets/main_theme/load_icon.png"),
  DELETE_ICON: require("./assets/main_theme/delete_icon.png"),
  OPTIONS_ICON: require("./assets/main_theme/options_icon.png"),
  SHARE_ICON: require("./assets/main_theme/share_icon.png"),
  LEFT_ICON: require("./assets/main_theme/left_icon.png"),
  RIGHT_ICON: require("./assets/main_theme/right_icon.png"),
  SUPPORT_ICON: require("./assets/main_theme/support_icon.png"),
  AUDIO_ON_ICON: require("./assets/main_theme/audio_on_icon.png"),
  AUDIO_OFF_ICON: require("./assets/main_theme/audio_off_icon.png"),
  PLAY_ICON: require("./assets/main_theme/play_icon.png"),
  DOOR_ICON: require("./assets/main_theme/door_icon.png"),
  KEY_ICON: require("./assets/main_theme/key_icon.png"),
  FLAG_ICON: require("./assets/main_theme/flag_icon.png"),

  WIN_BANNER: require("./assets/main_theme/win_banner.png"),
  LOGO: require("./assets/main_theme/logo.png"),
};

export interface Theme {
  OFF_WHITE: string,
  LIGHT_COLOR: string,
  MAIN_COLOR: string,
  MIDDLE_COLOR: string,
  DARK_COLOR: string,
  NEAR_BLACK: string,
  MAIN_TRANSPARENT: (opacity: number) => string,
}

export const purpleTheme: Theme = {
  OFF_WHITE: "#FEFAFF",
  LIGHT_COLOR: "#F9F0FC",
  MAIN_COLOR: "#CCB7E5",
  MIDDLE_COLOR: "#BEA9DF",
  DARK_COLOR: "#B19CD8",
  NEAR_BLACK: "#15101A",
  MAIN_TRANSPARENT: (opacity: number) => `rgba(204, 183, 229, ${opacity})`,
}

const blueTheme: Theme = {
  OFF_WHITE: "#FCFDFF",
  LIGHT_COLOR: "#EFF6FF",
  MAIN_COLOR: "#97C2FE",
  MIDDLE_COLOR: "#81B5FE",
  DARK_COLOR: "#6AA7FD",
  NEAR_BLACK: "#101219",
  MAIN_TRANSPARENT: (opacity: number) => `rgba(129, 181, 254, ${opacity})`,
}

const greenTheme: Theme = {
  OFF_WHITE: "#FAFFFA",
  LIGHT_COLOR: "#EEFCEE",
  MAIN_COLOR: "#B8E5B9",
  MIDDLE_COLOR: "#9BD99D",
  DARK_COLOR: "#8AD092",
  NEAR_BLACK: "#0E160E",
  MAIN_TRANSPARENT: (opacity: number) => `rgba(184, 229, 185, ${opacity})`,
}

const redTheme: Theme = {
  OFF_WHITE: "#FFFCFC",
  LIGHT_COLOR: "#FFF0F0",
  MAIN_COLOR: "#F79C9C",
  MIDDLE_COLOR: "#FA8484",
  DARK_COLOR: "#FA6B6B",
  NEAR_BLACK: "#170D0D",
  MAIN_TRANSPARENT: (opacity: number) => `rgba(247, 156, 156, ${opacity})`,
}

const mainColors = {
  OFF_WHITE: purpleTheme.OFF_WHITE,
  LIGHT_PURPLE: purpleTheme.LIGHT_COLOR,
  MAIN_PURPLE: purpleTheme.MAIN_COLOR,
  MIDDLE_PURPLE: purpleTheme.MIDDLE_COLOR,
  DARK_PURPLE: purpleTheme.DARK_COLOR,
  NEAR_BLACK: purpleTheme.NEAR_BLACK,

  TEXT_COLOR: "#493F59",
  DIM_GRAY: "#8A858D",
  LIGHT_GRAY: "#8A858D33",

  BLUE_THEME: blueTheme,
  GREEN_THEME: greenTheme,
  RED_THEME: redTheme,

  MAIN_PURPLE_TRANSPARENT: purpleTheme.MAIN_TRANSPARENT,
  NEAR_BLACK_TRANSPARENT: (opacity: number) => `rgba(21, 16, 26, ${opacity})`,
  OFF_WHITE_TRANSPARENT: (opacity: number) => `rgba(254, 250, 255, ${opacity})`,
};

// EXPORTING
export let theme = "main";
export let colors = mainColors;
export let graphics = mainGraphics;