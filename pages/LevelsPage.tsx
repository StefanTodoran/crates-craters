import { useMemo } from "react";
import { ImageURISource } from "react-native";
import OfficialIcon from "../assets/main_theme/official.png";
import SharedIcon from "../assets/main_theme/shared.png";
import { IndicatorIcon } from "../components/LevelCard";
import Subpages from "../components/Subpages";
import { graphics, purpleTheme } from "../Theme";
import { refreshLevelsFromServer } from "../util/database";
import { Level, PageView, SharedLevel } from "../util/types";
import LevelSelect from "./LevelSelect";
import UserLevels from "./UserLevels";

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

    const pageTabs = useMemo(() => {
        return [
            {
                label: "Official",
                color: purpleTheme.MAIN_COLOR,
                icon: OfficialIcon as ImageURISource,
            },
            {
                label: "Shared",
                color: purpleTheme.MAIN_COLOR,
                icon: SharedIcon as ImageURISource,
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