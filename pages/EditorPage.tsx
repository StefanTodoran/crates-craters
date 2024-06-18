import { useMemo } from "react";
import { Level, PageView, UserLevel } from "../util/types";
import { colors, graphics } from "../Theme";
import { doPageChange } from "../util/events";

import Subpages from "../components/Subpages";
import LevelSelect from "./LevelSelect";
import CreateLevel from "./CreateLevel";
import ManageLevel from "./ManageLevel";

import ListIcon from "../assets/main_theme/list.png";
import EditorIcon from "../assets/main_theme/editor.png";
import CreateIcon from "../assets/main_theme/create.png";

interface Props {
  viewCallback: (newView: PageView) => void,
  playLevelCallback: (uuid: string) => void,
  startEditingCallback: (uuid: string) => void,
  createNewLevelCallback: (newLevel: UserLevel) => void,
  levels: Level[],
  editorLevel?: UserLevel,
  elementHeight: number,
  storeElementHeightCallback: (height: number) => void,
}

export default function EditorPage({
  viewCallback,
  playLevelCallback,
  startEditingCallback,
  createNewLevelCallback,
  levels,
  editorLevel,
  elementHeight,
  storeElementHeightCallback,
}: Props) {
  const pageComponents = [
    <LevelSelect
      viewCallback={viewCallback}
      playLevelCallback={playLevelCallback}
      secondButtonProps={{
        text: "Manage",
        icon: graphics.HAMMER_ICON_RED,
        callback: (uuid: string) => {
          startEditingCallback(uuid);
          doPageChange(1);
        },
      }}
      levels={levels}
      scrollTo={editorLevel?.uuid}
      elementHeight={elementHeight}
      storeElementHeightCallback={storeElementHeightCallback}
      emptyListProps={{
        textLines: ["No custom levels created yet!"],
        onPress: () => doPageChange(2),
        buttonLabel: "Create New Level",
        buttonIcon: graphics.METAL_CRATE,
      }}
      theme={colors.RED_THEME}
    />,

    <ManageLevel level={editorLevel!} viewCallback={viewCallback} />, // The button to switch to this subpage is disabled if editorLevel is undefined.
    <CreateLevel createLevelCallback={createNewLevelCallback} />,
  ];

  const pageTabs = useMemo(() => {
    return [
      {
        label: "Levels",
        color: colors.RED_THEME.MAIN_COLOR,
        icon: ListIcon,
      },
      {
        label: "Manage",
        color: colors.RED_THEME.MAIN_COLOR,
        icon: EditorIcon,
      },
      {
        label: "New",
        color: colors.RED_THEME.MAIN_COLOR,
        icon: CreateIcon,
      },
    ];
  }, []);

  return (
    <Subpages
      pageComponents={pageComponents}
      pageTabs={pageTabs}
      disabledPages={[false, !editorLevel, false]}
    />
  );
}