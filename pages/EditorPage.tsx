import { useCallback, useContext, useMemo } from "react";
import { ImageURISource } from "react-native";
import CreateIcon from "../assets/main_theme/create.png";
import EditorIcon from "../assets/main_theme/editor.png";
import { IndicatorIcon, StatChip } from "../components/LevelCard";
import Subpages, { SubpageTab } from "../components/Subpages";
import GlobalContext from "../GlobalContext";
import { colors, graphics } from "../Theme";
import { requestSubpage } from "../util/store";
import { Level, PageView, UserLevel } from "../util/types";
import CreateLevel from "./CreateLevel";
import LevelSelect from "./LevelSelect";
import ManageLevel from "./ManageLevel";

interface Props {
  viewCallback: (newView: PageView, pageNum?: number) => void,
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
  const { userCredential } = useContext(GlobalContext);
  const existingLevelNames = levels.map(level => level.name.toLowerCase());

  const regularEmptyListProps = {
    textLines: ["No custom levels created yet."],
  };

  const notSignedInEmtpyListProps = {
    textLines: ["No custom levels created yet.", "Log in or sign up to get started!"],
    onPress: () => viewCallback(PageView.STORE),
    buttonLabel: "Goto Accounts",
    buttonIcon: graphics.SHARE_ICON_RED,
  };

  // Your levels: whether you've beaten them (needed to share), size, and if shared.
  const editorStats = useCallback((level: Level): StatChip[] => {
    const stats: StatChip[] = level.bestSolution ?
      [{ label: `Best: ${level.bestSolution.length}`, icon: graphics.FLAG_ICON, accessibilityLabel: `Best solution: ${level.bestSolution.length} moves` }] :
      [{ label: "Not beaten yet", theme: colors.ORANGE_THEME }];
    stats.push({ label: `${level.board.width} × ${level.board.height}`, accessibilityLabel: `${level.board.width} by ${level.board.height} board` });
    if ((level as UserLevel).shared) stats.push({ label: "Shared", theme: colors.GREEN_THEME });
    return stats;
  }, []);

  const pageComponents = [
    <LevelSelect
      key={0}
      viewCallback={viewCallback}
      playLevelCallback={playLevelCallback}
      secondButtonProps={{
        text: "Manage",
        icon: graphics.HAMMER_ICON_RED,
        callback: (uuid: string) => {
          startEditingCallback(uuid);
          requestSubpage(1);
        },
      }}
      levels={!!userCredential ? levels : []}
      scrollTo={editorLevel?.uuid}
      elementHeight={elementHeight}
      indicatorIcon={IndicatorIcon.SHARED}
      getStats={editorStats}
      storeElementHeightCallback={storeElementHeightCallback}
      headerComponent={!!userCredential ? <CreateLevel createLevelCallback={createNewLevelCallback} existingLevelNames={existingLevelNames} /> : undefined}
      emptyListProps={{
        ...regularEmptyListProps,
        ...(!userCredential ? notSignedInEmtpyListProps : {}),
      }}
      theme={colors.RED_THEME}
    />,

    <ManageLevel
      key={1}
      level={editorLevel!} // The button to switch to this subpage is disabled if editorLevel is undefined.
      viewCallback={viewCallback}
      playLevelCallback={playLevelCallback}
    />,
  ];

  const pageTabs = useMemo((): SubpageTab[] => {
    return [
      {
        label: "Levels",
        color: colors.RED_THEME.MAIN_COLOR,
        icon: CreateIcon as ImageURISource,
        sfSymbol: "plus.square.fill",
      },
      {
        label: "Manage",
        color: colors.RED_THEME.MAIN_COLOR,
        icon: EditorIcon as ImageURISource,
        sfSymbol: "hammer.fill",
      },
    ];
  }, []);

  return (
    <Subpages
      pageComponents={pageComponents}
      pageTabs={pageTabs}
      // Manage needs a level to manage, and an account: signed out, the level list is
      // empty, but the last edited level would otherwise still be reachable here.
      disabledPages={[false, !editorLevel || !userCredential]}
    />
  );
}