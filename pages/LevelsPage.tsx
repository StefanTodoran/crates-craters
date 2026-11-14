import { useCallback, useMemo } from "react";
import { ImageURISource } from "react-native";
import OfficialIcon from "../assets/main_theme/official.png";
import SharedIcon from "../assets/main_theme/shared.png";
import { Difficulty, IndicatorIcon, StatChip, difficultyThemes } from "../components/LevelCard";
import Subpages, { SubpageTab } from "../components/Subpages";
import { graphics, purpleTheme } from "../Theme";
import { refreshLevelsFromServer } from "../util/database";
import { Level, PageView, SharedLevel } from "../util/types";
import { showSolution } from "../util/store";
import LevelSelect from "./LevelSelect";
import UserLevels from "./UserLevels";

/** Official levels are ordered by difficulty: the first third Easy, then Medium, then Hard. */
function officialDifficulty(index: number, total: number): Difficulty {
    const fraction = index / Math.max(1, total);
    return fraction < 1 / 3 ? "Easy" : fraction < 2 / 3 ? "Medium" : "Hard";
}

interface Props {
    viewCallback: (newView: PageView, newPage?: number) => void,
    playLevelCallback: (uuid: string) => void,
    playSharedLevelCb: (obj?: SharedLevel) => void,
    scrollTo?: string,
    levels: Level[],
    elementHeight: number,
    userLevels: SharedLevel[],
    setUserLevels: (levels: SharedLevel[]) => void,
    storeElementHeightCallback: (height: number) => void,
}

export default function LevelsPage({
    viewCallback,
    playLevelCallback,
    playSharedLevelCb,
    scrollTo,
    levels,
    elementHeight,
    userLevels,
    setUserLevels,
    storeElementHeightCallback,
}: Props) {
    // Difficulty by position in the list, and the best solution once solved.
    const levelIndex = useMemo(() => new Map(levels.map((level, index) => [level.uuid, index])), [levels]);
    const officialStats = useCallback((level: Level): StatChip[] => {
        const difficulty = officialDifficulty(levelIndex.get(level.uuid) ?? 0, levels.length);
        const stats: StatChip[] = [{ label: difficulty, theme: difficultyThemes[difficulty] }];
        if (level.bestSolution) stats.push({
            label: `Best: ${level.bestSolution.length}`,
            icon: graphics.FLAG_ICON,
            accessibilityLabel: `Best solution: ${level.bestSolution.length} moves`,
        });
        return stats;
    }, [levelIndex, levels.length]);

    const pageComponents = [
        <LevelSelect
            key={0}
            viewCallback={viewCallback}
            playLevelCallback={playLevelCallback}
            levels={levels}
            onRefresh={refreshLevelsFromServer}
            scrollTo={scrollTo}
            elementHeight={elementHeight}
            storeElementHeightCallback={storeElementHeightCallback}
            footerText={`Showing ${levels.length} of ${levels.length} levels`}
            emptyListProps={{
                textLines: ["Could not yet download levels!", "Check your internet connection, then try again."],
                buttonLabel: "Retry Download",
                buttonIcon: graphics.CRATE,
            }}
            indicatorIcon={IndicatorIcon.COMPLETION}
            isOfficial
            allowResume
            getStats={officialStats}
            // Solved levels can replay the player's best solution.
            secondButtonProps={{
                text: (uuid) => levels.find(level => level.uuid === uuid)?.bestSolution ? "Solution" : undefined,
                icon: graphics.KEY_PURPLE,
                callback: (uuid) => {
                    const level = levels.find(level => level.uuid === uuid);
                    if (!level?.bestSolution) return;
                    showSolution(level, PageView.LEVELS, 0);
                    viewCallback(PageView.SOLUTION);
                },
            }}
        />,
        <UserLevels
            key={1}
            viewCallback={viewCallback}
            playLevelCallback={playSharedLevelCb}
            scrollTo={scrollTo}
            userLevels={userLevels}
            setUserLevels={setUserLevels}
            elementHeight={elementHeight}
            storeElementHeightCallback={storeElementHeightCallback}
        />,
    ];

    const pageTabs = useMemo((): SubpageTab[] => {
        return [
            {
                label: "Official",
                color: purpleTheme.MAIN_COLOR,
                icon: OfficialIcon as ImageURISource,
                sfSymbol: "flag.checkered",
            },
            {
                label: "Shared",
                color: purpleTheme.MAIN_COLOR,
                icon: SharedIcon as ImageURISource,
                sfSymbol: "person.2.fill",
            },
        ];
    }, []);

    return (
        <Subpages
            pageComponents={pageComponents}
            pageTabs={pageTabs}
            disabledPages={[false, false]}
        />
    );
}