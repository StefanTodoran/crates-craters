import { ImageSourcePropType } from "react-native";
import { Theme, colors, graphics } from "../Theme";
import { Direction, FlatTile, TileType } from "./types";

export interface Tool {
    label: string,
    icon: ImageSourcePropType,
    tile: FlatTile,
    theme?: Theme,
}

export const wallTool: Tool = {
    label: "Wall",
    icon: graphics.WALL_ICON,
    tile: { id: TileType.WALL },
    theme: colors.BLUE_THEME,
};

export const tools: Tool[] = [
    {
        label: "Crate",
        icon: graphics.CRATE,
        tile: { id: TileType.CRATE },
    },
    {
        label: "Crater",
        icon: graphics.CRATER,
        tile: { id: TileType.CRATER },
    },
    {
        label: "Metal Crate",
        icon: graphics.METAL_CRATE,
        tile: { id: TileType.METAL_CRATE },
        theme: colors.RED_THEME,
    },
    {
        label: "Spawn",
        icon: graphics.PLAYER,
        tile: { id: TileType.SPAWN },
    },
    {
        label: "Door",
        icon: graphics.DOOR,
        tile: { id: TileType.DOOR },
        theme: colors.GREEN_THEME,
    },
    {
        label: "Key",
        icon: graphics.KEY,
        tile: { id: TileType.KEY },
        theme: colors.GREEN_THEME,
    },
    {
        label: "Flag",
        icon: graphics.FLAG,
        tile: { id: TileType.FLAG },
        theme: colors.YELLOW_THEME,
    },
    {
        label: "Coin",
        icon: graphics.COIN,
        tile: { id: TileType.COIN },
        theme: colors.YELLOW_THEME,
    },
    {
        label: "Left",
        icon: graphics.ONE_WAY_LEFT,
        tile: { id: TileType.ONEWAY, orientation: Direction.LEFT },
        theme: colors.BLUE_THEME,
    },
    {
        label: "Right",
        icon: graphics.ONE_WAY_RIGHT,
        tile: { id: TileType.ONEWAY, orientation: Direction.RIGHT },
        theme: colors.BLUE_THEME,
    },
    {
        label: "Up",
        icon: graphics.ONE_WAY_UP,
        tile: { id: TileType.ONEWAY, orientation: Direction.UP },
        theme: colors.BLUE_THEME,
    },
    {
        label: "Down",
        icon: graphics.ONE_WAY_DOWN,
        tile: { id: TileType.ONEWAY, orientation: Direction.DOWN },
        theme: colors.BLUE_THEME,
    },
    wallTool,
    {
        label: "Ice Block",
        icon: graphics.ICE_BLOCK,
        tile: { id: TileType.ICE_BLOCK },
        theme: colors.BLUE_THEME,
    },
];
