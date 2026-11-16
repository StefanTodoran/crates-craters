import { useCallback, useContext, useMemo } from "react";
import { ImageURISource, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import OfficialIcon from "../assets/main_theme/official.png";
import SharedIcon from "../assets/main_theme/shared.png";
import { Difficulty, IndicatorIcon, StatChip, difficultyThemes } from "../components/LevelCard";
import Subpages, { SubpageTab } from "../components/Subpages";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors, graphics, purpleTheme } from "../Theme";
import { refreshLevelsFromServer } from "../util/database";
import { Level, OfficialLevel, PageView, SharedLevel } from "../util/types";
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
        if ((level as OfficialLevel).isNew && !level.completed) stats.unshift({ label: "New", theme: colors.GREEN_THEME });
        if (level.bestSolution) stats.push({
            label: `Best: ${level.bestSolution.length}`,
            icon: graphics.FLAG_ICON,
            accessibilityLabel: `Best solution: ${level.bestSolution.length} moves`,
        });
        return stats;
    }, [difficulties]);

    const completedCount = levels.filter(level => level.completed).length;

    const pageComponents = [
        <LevelSelect
            key={0}
            headerComponent={levels.length > 0 ? <ProgressBar completed={completedCount} total={levels.length} /> : undefined}
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

/** How many official levels have been beaten, above the official level list. */
function ProgressBar({ completed, total }: { completed: number, total: number }) {
    const { darkMode } = useContext(GlobalContext);
    const win = useWindowDimensions();
    const fraction = total > 0 ? completed / total : 0;
    const textColor = darkMode ? purpleTheme.MAIN_COLOR : purpleTheme.TINT_COLOR;

    return (
        <View style={{ width: win.width }} accessible accessibilityLabel={`${completed} of ${total} levels completed`}>
            <View style={styles.progress}>
                <View style={styles.progressLabels}>
                    <Text allowFontScaling={false} style={[styles.progressText, { color: textColor }]}>Progress</Text>
                    <Text allowFontScaling={false} style={[styles.progressText, { color: textColor }]}>{completed} / {total}</Text>
                </View>
                <View style={[styles.track, { backgroundColor: darkMode ? purpleTheme.NEAR_BLACK : purpleTheme.LIGHT_COLOR, borderColor: purpleTheme.MAIN_COLOR }]}>
                    <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    progress: {
        marginHorizontal: "5%",
        marginBottom: normalize(10),
        gap: normalize(6),
    },
    progressLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    progressText: {
        fontFamily: "Montserrat-Medium",
        fontSize: normalize(13),
    },
    track: {
        height: normalize(10),
        borderRadius: normalize(5),
        borderWidth: 1,
        overflow: "hidden",
    },
    fill: {
        height: "100%",
        backgroundColor: purpleTheme.MAIN_COLOR,
    },
});
