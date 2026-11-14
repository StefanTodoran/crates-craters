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

const isTutorial = (level: Level) => level.official && level.introduces !== undefined;

/**
 * Official difficulty: tutorials are "Tutorial", and the rest go by position (they're
 * ordered by difficulty): the last three are Hard, and before that the first half Easy
 * and the second half Medium.
 */
function officialDifficulties(levels: Level[]): Map<string, Difficulty> {
    const ranked = levels.filter(level => !isTutorial(level));
    const hardFrom = Math.max(0, ranked.length - 3);
    const mediumFrom = Math.ceil(hardFrom / 2);
    const result = new Map<string, Difficulty>();
    levels.forEach(level => { if (isTutorial(level)) result.set(level.uuid, "Tutorial"); });
    ranked.forEach((level, index) =>
        result.set(level.uuid, index >= hardFrom ? "Hard" : index >= mediumFrom ? "Medium" : "Easy"));
    return result;
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
    // Difficulty, and the best solution once solved.
    const difficulties = useMemo(() => officialDifficulties(levels), [levels]);
    const officialStats = useCallback((level: Level): StatChip[] => {
        const difficulty = difficulties.get(level.uuid) ?? "Easy";
        const stats: StatChip[] = [{ label: difficulty, theme: difficultyThemes[difficulty] }];
        if (level.bestSolution) stats.push({
            label: `Best: ${level.bestSolution.length}`,
            icon: graphics.FLAG_ICON,
            accessibilityLabel: `Best solution: ${level.bestSolution.length} moves`,
        });
        return stats;
    }, [difficulties]);

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