import { useEffect, useMemo, useState } from "react";
import { Level, PageView } from "../util/types";
import { colors } from "../Theme";

import Subpages from "../components/Subpages";
import LevelSelect from "./LevelSelect";
import EditLevel from "./EditLevel";

import ListIcon from "../assets/main_theme/list.png";
import EditorIcon from "../assets/main_theme/editor.png";
import CreateIcon from "../assets/main_theme/create.png";
import CreateLevel from "./CreateLevel";

interface Props {
  viewCallback: (newView: PageView) => void,
  playLevelCallback: (uuid: string) => void,
  editorLevelCallback?: (uuid: string) => void,
  levels: Level[],
  editorLevel?: Level,
  elementHeight: number,
  storeElementHeightCallback: (height: number) => void,
}

export default function EditorPage({
  viewCallback,
  playLevelCallback,
  editorLevelCallback,
  levels,
  editorLevel,
  elementHeight,
  storeElementHeightCallback,
}: Props) {
  const [level, setLevel] = useState<Level>();

  useEffect(() => {
    setLevel(editorLevel);
  }, [editorLevel]);

  const pageComponents = [
    <LevelSelect
      viewCallback={viewCallback}
      playLevelCallback={playLevelCallback}
      editorLevelCallback={editorLevelCallback}
      levels={levels}
      scrollTo={editorLevel?.uuid}
      elementHeight={elementHeight}
      storeElementHeightCallback={storeElementHeightCallback}
      mode={PageView.EDIT}
    />,

    <EditLevel
      viewCallback={viewCallback}
      level={level!}
      levelCallback={setLevel}
      playtestLevel={() => { }}
      storeChanges={() => { }}
    />,

    <CreateLevel createLevelCallback={setLevel} />,
  ];

  const pageTabs = useMemo(() => {
    return [
      {
        label: "Levels",
        color: colors.RED_THEME.MAIN_COLOR,
        icon: ListIcon,
      },
      {
        label: "Editor",
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
    <Subpages pageComponents={pageComponents} pageTabs={pageTabs} />
  );
}