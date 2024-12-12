import { useMemo } from "react";
import { Level, PageView, SharedLevel } from "../util/types";
import { graphics, purpleTheme } from "../Theme";
import { refreshLevelsFromServer } from "../util/database";

import LevelSelect from "./LevelSelect";
import UserLevels from "./UserLevels";
import Subpages from "../components/Subpages";

import OfficialIcon from "../assets/main_theme/official.png";
import SharedIcon from "../assets/main_theme/shared.png";
import { IndicatorIcon } from "../components/LevelCard";

interface Props {
    viewCallback: (newView: PageView, newPage?: number) => void,
    playLevelCallback: (uuid: string) => void,
    playSharedLevelCb: (obj?: SharedLevel) => void,
    scrollTo?: string,
    levels: Level[],
    elementHeight: number,
    storeElementHeightCallback: (height: number) => void,
}

export default function LevelsPage({
    viewCallback,
    playLevelCallback,
    playSharedLevelCb,
    scrollTo,
    levels,
    elementHeight,
    storeElementHeightCallback,
}: Props) {
    const pageComponents = [
        <LevelSelect
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
            allowResume
        />,
        <UserLevels
            viewCallback={viewCallback}
            playLevelCallback={playSharedLevelCb}
            scrollTo={scrollTo}
            elementHeight={elementHeight}
            storeElementHeightCallback={storeElementHeightCallback}
        />,
    ];

    const pageTabs = useMemo(() => {
        return [
            {
                label: "Official",
                color: purpleTheme.MAIN_COLOR,
                icon: OfficialIcon,
            },
            {
                label: "Shared",
                color: purpleTheme.MAIN_COLOR,
                icon: SharedIcon,
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