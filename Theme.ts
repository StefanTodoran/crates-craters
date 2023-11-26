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

const mainColors = {
  OFF_WHITE: "#FEFAFF",
  LIGHT_PURPLE: "#F9F0FC",
  MAIN_PURPLE: "#CCB7E5",
  MIDDLE_PURPLE: "#BEA9DF",
  DARK_PURPLE: "#B19CD8",
  TEXT_COLOR: "#493F59",
  NEAR_BLACK: "#15101A",

  MAIN_BLUE: "#97C2FE",
  MAIN_GREEN: "#AADFAB",
  DIM_GRAY: "#8A858D",

  MAIN_BLUE_TRANSPARENT(opacity: number) { return `rgba(129, 181, 254, ${opacity})`; },
  MAIN_PURPLE_TRANSPARENT(opacity: number) { return `rgba(204, 183, 229, ${opacity})`; },
  NEAR_BLACK_TRANSPARENT(opacity: number) { return `rgba(21, 16, 26, ${opacity})`; },
  OFF_WHITE_TRANSPARENT(opacity: number) { return `rgba(254, 250, 255, ${opacity})`; },
};

// const pirate_graphics = {
//   DOOR: require("./assets/main_theme/door.png"),
//   KEY: require("./assets/pirate_theme/key.png"),
//   CRATE: require("./assets/pirate_theme/crate.png"),
//   CRATER: require("./assets/main_theme/crater.png"),
//   COIN: require("./assets/pirate_theme/coin.png"),
//   FLAG: require("./assets/pirate_theme/flag.png"),
//   BOMB: require("./assets/main_theme/bomb.png"),
//   ONE_WAY_LEFT: require("./assets/main_theme/one_way_left.png"),
//   ONE_WAY_RIGHT: require("./assets/main_theme/one_way_right.png"),
//   ONE_WAY_UP: require("./assets/main_theme/one_way_up.png"),
//   ONE_WAY_DOWN: require("./assets/main_theme/one_way_down.png"),
//   EXPLOSION: require("./assets/main_theme/explosion.png"),
//   LITTLE_EXPLOSION: require("./assets/main_theme/little_explosion.png"),
//   PLAYER: require("./assets/pirate_theme/player.png"),
//   PLAYER_OUTLINED: require("./assets/pirate_theme/player_outlined.png"),
//   PLAYER_OUTLINED_DARK: require("./assets/pirate_theme/player_outlined_dark.png"),

//   THEME_ICON: require("./assets/main_theme/theme_icon.png"),
//   NIGHT_MODE_ICON: require("./assets/main_theme/night_icon.png"),
//   HAMMER_ICON: require("./assets/main_theme/hammer_icon.png"),
//   WALL_ICON: require("./assets/main_theme/wall_icon.png"),
//   SAVE_ICON: require("./assets/main_theme/save_icon.png"),
//   LOAD_ICON: require("./assets/main_theme/load_icon.png"),
//   DELETE_ICON: require("./assets/main_theme/delete_icon.png"),
//   OPTIONS_ICON: require("./assets/main_theme/options_icon.png"),
//   SHARE_ICON: require("./assets/main_theme/share_icon.png"),
//   LEFT_ICON: require("./assets/main_theme/left_icon.png"),
//   RIGHT_ICON: require("./assets/main_theme/right_icon.png"),
//   SUPPORT_ICON: require("./assets/main_theme/support_icon.png"),
//   AUDIO_ON_ICON: require("./assets/main_theme/audio_on_icon.png"),
//   AUDIO_OFF_ICON: require("./assets/main_theme/audio_off_icon.png"),
//   PLAY_ICON: require("./assets/main_theme/play_icon.png"),
//   DOOR_ICON: require("./assets/main_theme/door_icon.png"),
//   KEY_ICON: require("./assets/main_theme/key_icon.png"),
//   FLAG_ICON: require("./assets/main_theme/flag_icon.png"),

//   WIN_BANNER: require("./assets/main_theme/win_banner.png"),
//   LOGO: require("./assets/main_theme/logo.png"),
// };

// EXPORTING
export let theme = "main";
export let colors = mainColors;
export let graphics = mainGraphics;

// CHANGING THEME
// let current = 0;
// const rotation = ["main", "pirate"];
// const colors_rotation = [mainColors, mainColors];
// const graphics_rotation = [mainGraphics, pirate_graphics];

export function nextTheme() {
  // current = (current + 1 < rotation.length) ? current + 1 : 0;
  // theme = rotation[current];
  // colors = colors_rotation[current];
  // graphics = graphics_rotation[current];
  return theme;
}