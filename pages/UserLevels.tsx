import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Modal, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from "react-native";
import Toast from "../util/toast";
import FilterChip from "../components/FilterChip";
import InputLine from "../components/InputLine";
import { IndicatorIcon } from "../components/LevelCard";
import SimpleButton from "../components/SimpleButton";
import SliderBar from "../components/SliderBar";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics, purpleTheme } from "../Theme";
import { ExplicitOrder, QueryFilter, attemptUserLevel, likeUserLevel, queryUserLevels } from "../util/database";
import { useDebounce } from "../util/hooks";
import { getData, metadataKeys, parseCompressedBoardData } from "../util/loader";
import { areSetsEqual } from "../util/Set";
import { Level, PageView, SharedLevel } from "../util/types";
import LevelSelect from "./LevelSelect";

enum Filter {
    POPULAR = "Popular",
    UNBEATEN = "Unsolved",
    UNPLAYED = "New to You",
    LIKED = "Liked",
    NEWEST = "Newest",
    COMPLETED = "Completed",
    PLAYED = "Played Before",
    UNATTEMPTED = "No Attempts",
}

const mutualExclusions = [
    new Set([Filter.UNBEATEN, Filter.UNATTEMPTED]),
    new Set([Filter.LIKED, Filter.UNPLAYED, Filter.PLAYED, Filter.COMPLETED]),
    new Set([Filter.NEWEST, Filter.POPULAR]),
];

const difficultyRanges = {
    "Easy": [0.95, 1],
    "Medium": [0.5, 0.95],
    "Hard": [0, 0.5],
} as Record<string, [number, number]>;

const lengthRanges = {
    "Short": [0, 50],
    "Normal": [50, 100],
    "Long": [100, Infinity],
} as Record<string, [number, number]>;

function getRange(value: number, ranges: Record<Filter, [number, number]>): string {
    for (const [rank, range] of Object.entries(ranges)) {
        if (value > range[0] && value <= range[1]) return rank;
    }
    // Called during render, so never throw: bad server data shouldn't crash the list.
    console.warn(`Value ${value} is outside of ranges`, ranges);
    return "Unknown";
}

interface SearchParams {
    filters: Set<Filter>,
    lengthFilterEnabled: boolean,
    minSolutionLength: number,
    maxSolutionLength: number,
    winrateFilterEnabled: boolean,
    minWinrate: number,
    maxWinrate: number,
}

interface LocalLevelLists {
    likedLevels: string[],
    attemptedLevels: string[],
    completedLevels: string[],
}

function didParamsChange(a: SearchParams, b: SearchParams) {
    return !areSetsEqual(a.filters, b.filters) ||
        a.lengthFilterEnabled !== b.lengthFilterEnabled ||
        a.winrateFilterEnabled !== b.winrateFilterEnabled ||
        a.minSolutionLength !== b.minSolutionLength ||
        a.maxSolutionLength !== b.maxSolutionLength ||
        a.minWinrate !== b.minWinrate ||
        a.maxWinrate !== b.maxWinrate;
}

/** Turns the search filters into a shared levels query (see queryUserLevels). */
export function buildUserLevelQuery(params: SearchParams, lists: LocalLevelLists) {
    const { filters } = params;

    const orderFields: ExplicitOrder[] = [];
    if (filters.has(Filter.POPULAR)) orderFields.push({ field: "likes", order: "desc" });
    orderFields.push({ field: "shared", order: filters.has(Filter.NEWEST) ? "desc" : "asc" });

    const filterFields: QueryFilter[] = [{ field: "public", operator: "==", value: true }];
    if (filters.has(Filter.UNATTEMPTED)) {
        filterFields.push({ field: "attempts", operator: "==", value: 0 });
    }
    if (filters.has(Filter.UNBEATEN)) {
        filterFields.push({ field: "wins", operator: "==", value: 0 });
        filterFields.push({ field: "attempts", operator: "!=", value: 0 });
    }
    if (params.lengthFilterEnabled) {
        filterFields.push({ field: "best", operator: ">", value: params.minSolutionLength });
        filterFields.push({ field: "best", operator: "<=", value: params.maxSolutionLength });
    }
    if (params.winrateFilterEnabled) {
        filterFields.push({ field: "winrate", operator: ">=", value: params.minWinrate / 100 });
        filterFields.push({ field: "winrate", operator: "<=", value: params.maxWinrate / 100 });
    }

    // Liked/Played/Completed restrict results to a known list of level ids, and
    // Unplayed excludes one. Ids are document names (documents have no "uuid"
    // field; parseQuerySnapshot adds it client-side), so match on "__name__".
    let includeIds: string[] | undefined;
    if (filters.has(Filter.LIKED)) includeIds = lists.likedLevels;
    if (filters.has(Filter.PLAYED)) includeIds = lists.attemptedLevels;
    if (filters.has(Filter.COMPLETED)) includeIds = lists.completedLevels;
    const excludeIds = filters.has(Filter.UNPLAYED) ? lists.attemptedLevels : [];

    return { orderFields, filterFields, includeIds, excludeIds };
}

interface Props {
    viewCallback: (newView: PageView, newPage?: number) => void,
    playLevelCallback: (level?: SharedLevel) => void,
    scrollTo?: string,
    elementHeight: number,
    userLevels: SharedLevel[],
    setUserLevels: (levels: SharedLevel[]) => void,
    storeElementHeightCallback: (height: number) => void,
}

export default function UserLevels({
    viewCallback,
    playLevelCallback,
    scrollTo,
    elementHeight,
    userLevels,
    setUserLevels,
    storeElementHeightCallback,
}: Props) {
    const { darkMode, userCredential } = useContext(GlobalContext);

    const win = useWindowDimensions();
    // The full filters panel is a native sheet (swipe down to dismiss on iOS).
    const [modalOpen, setModalOpen] = useState(false);
    const toggleModal = () => setModalOpen(open => !open);

    // Read from storage only when the shown levels change (e.g. after a like), not on
    // every render: these parse JSON, and renders happen on each search keystroke.
    const localLists = useMemo((): LocalLevelLists => ({
        likedLevels: getData(metadataKeys.likedLevels) || [],
        attemptedLevels: getData(metadataKeys.attemptedLevels) || [],
        completedLevels: getData(metadataKeys.completedLevels) || [],
    }), [userLevels]);
    const { likedLevels } = localLists;
    const scrollRef = useRef<FlatList<Filter>>(null);

    const [filters, setFilters] = useState(new Set<Filter>());
    const toggleFilter = (filter: Filter) => {
        const newFilters = new Set(filters);
        const alreadyEnabled = newFilters.has(filter);

        mutualExclusions.forEach(exclusionSet => {
            if (exclusionSet.has(filter)) {
                exclusionSet.forEach(item => newFilters.delete(item));
            }
        });

        alreadyEnabled ? newFilters.delete(filter) : newFilters.add(filter);
        setFilters(newFilters);
    };

    useEffect(() => {
        scrollRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [filters]);

    const [lengthFilterEnabled, setLengthFilterEnabled] = useState(false);
    const [minSolutionLength, setMinSolutionLength] = useState(50);
    const [maxSolutionLength, setMaxSolutionLength] = useState(150);

    const [winrateFilterEnabled, setWinrateFilterEnabled] = useState(false);
    const [minWinrate, setMinWinrate] = useState(25);
    const [maxWinrate, setMaxWinrate] = useState(95);

    const [numLoaded, setNumLoaded] = useState(10);
    const [matchingCount, setMatchingCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    const [loading, setLoading] = useState(false);

    const inactiveFilters = new Set(Object.values(Filter).filter(item => !filters.has(item)));
    mutualExclusions.forEach(exclusionSet => {
        filters.forEach(activeFilter => {
            if (exclusionSet.has(activeFilter)) {
                exclusionSet.forEach(toExclude => {
                    if (toExclude === activeFilter) return;
                    inactiveFilters.delete(toExclude);
                });
            }
        });
    });
    const validFilters = [...filters, ...inactiveFilters];

    const params: SearchParams = {
        filters,
        lengthFilterEnabled,
        minSolutionLength,
        maxSolutionLength,
        winrateFilterEnabled,
        minWinrate,
        maxWinrate,
    };
    const prevParams = useRef<SearchParams>(params);

    // Incremented per fetch, so a slow older response can't overwrite a newer one.
    const latestRequest = useRef(0);
    const fetchLevels = async () => {
        const requestId = ++latestRequest.current;
        setLoading(true);
        try {
            const { orderFields, filterFields, includeIds, excludeIds } = buildUserLevelQuery(params, localLists);
            const { data, count } = await queryUserLevels(orderFields, filterFields, numLoaded, includeIds, excludeIds);
            if (requestId !== latestRequest.current) return true; // A newer fetch superseded this one.

            setMatchingCount(count);
            setUserLevels(data.filter(doc => doc.public).flatMap(doc => {
                try {
                    // A level document is close to, but not exactly, a SharedLevel: it has
                    // no created/downloads/official fields and `shared` is a Timestamp.
                    // Nothing reads those on fetched levels.
                    const level = {
                        ...doc,
                        board: parseCompressedBoardData(doc.board),
                        completed: localLists.completedLevels.includes(doc.uuid),
                    } as unknown as SharedLevel;
                    return [level];
                } catch (error) {
                    // Skip malformed levels instead of breaking the whole list.
                    console.warn("Skipping malformed shared level:", doc.uuid, error);
                    return [];
                }
            }));

            setLoading(false);
            return true;
        } catch (error) {
            console.warn("Failed to fetch shared levels:", error);
            if (requestId === latestRequest.current) setLoading(false);
            return false;
        }
    };

    const debouncedFetchLevels = useDebounce(fetchLevels, 1000);
    useEffect(() => {
        if (userLevels.length === 0) fetchLevels();
    }, []); // Fetch levels on mount.

    // Refetch when the filters change (debounced, as chips are often tapped in a row),
    // or when the filter modal closes with changed sliders. Not while the modal is open.
    useEffect(() => {
        if (modalOpen) return;
        if (didParamsChange(params, prevParams.current)) debouncedFetchLevels();
        prevParams.current = params;
    }, [filters, numLoaded]);
    useEffect(() => {
        if (modalOpen) return;
        if (didParamsChange(params, prevParams.current)) fetchLevels();
        prevParams.current = params;
    }, [modalOpen]);

    const filteredLevels = useMemo(() => {
        if (!searchQuery) return userLevels;
        const query = searchQuery.toLowerCase();
        return userLevels.filter(level => level.name.toLowerCase().includes(query) || level.user_name.toLowerCase().includes(query));
    }, [userLevels, searchQuery]);

    const getStats = useCallback((level: Level) => {
        const targetLevel = level as SharedLevel;
        const stats = [];

        const winrate = Math.min(100, Math.round(100 * targetLevel.wins / targetLevel.attempts));
        if (isNaN(winrate)) stats.push("No attempts yet!");
        else if (targetLevel.wins === 0) stats.push("Never beaten!");
        else stats.push(`${winrate}% solve rate (${getRange(winrate / 100, difficultyRanges)})`);

        const solnLen = targetLevel.bestSolution!.length;
        stats.push(`${getRange(solnLen, lengthRanges)} solution`);
        stats.push(`(Best: ${solnLen} moves)`);

        if (userCredential && targetLevel.user_uid === userCredential.user.uid) {
            stats.push("Made by you!");
        }

        return stats;
    }, [userCredential]);

    return (
        <>
            <LevelSelect
                headerComponent={<View style={{ width: win.width }}>
                    <View style={{ marginHorizontal: "5%", flexDirection: "row", alignItems: "center", marginBottom: normalize(10) }}>
                        <InputLine
                            label={"Search"}
                            value={searchQuery}
                            onChange={setSearchQuery}
                            darkMode={darkMode}
                            fullBorder
                            doFlex
                        />
                        <SimpleButton
                            icon={graphics.FILTER_ICON}
                            onPress={toggleModal}
                            extraMargin={[10, 0, 0, 0]}
                            square
                            main
                        />
                    </View>
                    <FlatList
                        horizontal
                        ref={scrollRef}
                        // overScrollMode="never"
                        showsHorizontalScrollIndicator={false}
                        style={{ flexGrow: 0 }}
                        contentContainerStyle={styles.filterChipsRow}
                        data={validFilters}
                        renderItem={({ item, index }) => <FilterChip
                            key={index}
                            text={item}
                            active={filters.has(item)}
                            onPress={() => toggleFilter(item)}
                            disabled={loading}
                        />}
                    />
                </View>}
                footerText={`Showing ${filteredLevels.length} of ${Math.max(matchingCount, filteredLevels.length)} levels`}

                viewCallback={(newView: PageView) => viewCallback(newView, 1)}
                resumeLevelCallback={playLevelCallback}
                playLevelCallback={(uuid: string) => {
                    const level = filteredLevels.find(level => level.uuid === uuid)!;
                    playLevelCallback(level);
                    // TODO: Add attempt tracking for official levels too.
                    attemptUserLevel(uuid, userCredential?.user.uid);
                }}
                secondButtonProps={{
                    text: (uuid: string) => {
                        const likeCount = filteredLevels.find(lvl => lvl.uuid === uuid)!.likes;
                        return (likedLevels.includes(uuid) ? "Liked" : "Like") + ` (${likeCount})`;
                    },
                    disabled: (uuid: string) => {
                        return !userCredential ||
                            likedLevels.includes(uuid) ||
                            filteredLevels.find(lvl => lvl.uuid === uuid)!.user_uid === userCredential.user.uid
                    },
                    icon: graphics.LIKE_ICON,
                    callback: async (uuid: string) => {
                        const success = await likeUserLevel(uuid, userCredential!.user.uid);
                        if (!success) {
                            Toast.show({
                                type: "error",
                                text1: "Couldn't like level.",
                                text2: "Please check your connection and try again.",
                            });
                            return;
                        }
                        setUserLevels(userLevels.map(lvl =>
                            lvl.uuid === uuid ? { ...lvl, likes: lvl.likes + 1 } : lvl
                        ));
                    },
                }
                }
                getStats={getStats}
                levels={filteredLevels}
                scrollTo={scrollTo}
                allowResume
                elementHeight={elementHeight}
                storeElementHeightCallback={storeElementHeightCallback}
                indicatorIcon={IndicatorIcon.COMPLETION}
                onRefresh={fetchLevels}
                overrideRefreshing={loading}
                onEndReached={() => {
                    // If this triggers, there are no more levels to load!
                    if (numLoaded > filteredLevels.length) return;
                    setNumLoaded(numLoaded + 10);
                }}
                emptyListProps={{
                    textLines: ["Could not find any good matches for your search.", "Try widening your search to use less filters."],
                }}
                theme={purpleTheme}
                noNumber
            />

            <Modal
                visible={modalOpen}
                presentationStyle="pageSheet"
                animationType="slide"
                onRequestClose={() => setModalOpen(false)} // Swipe down (iOS) or back button (Android).
            >
            <ScrollView
                style={{ backgroundColor: darkMode ? colors.NEAR_BLACK : colors.OFF_WHITE }}
                contentContainerStyle={styles.modal}
            >
                <View style={styles.section}>
                    <Text style={TextStyles.subtitle(darkMode)}>
                        All Filters
                    </Text>

                    <View style={styles.wrappedList}>
                        {Object.values(Filter).map((filter, index) => <FilterChip
                            key={index}
                            text={filter}
                            active={filters.has(filter)}
                            onPress={() => toggleFilter(filter)}
                            disabled={loading || !validFilters.includes(filter)}
                            verticalMargin
                        />)}
                    </View>

                    <Text style={[TextStyles.paragraph(darkMode), { marginBottom: 0 }]}>Desired Solution Length</Text>
                    <Switch value={lengthFilterEnabled} onValueChange={setLengthFilterEnabled} accessibilityLabel="Length filter" style={styles.filterSwitch} trackColor={{ true: purpleTheme.MAIN_COLOR }} />
                    {lengthFilterEnabled && <>
                        <SliderBar
                            label="Minimum" value={minSolutionLength} units={" moves"}
                            minValue={1} maxValue={Math.max(maxSolutionLength - 1, 2)} changeCallback={setMinSolutionLength}
                            showSteppers
                        />
                        <SliderBar
                            label="Maximum" value={maxSolutionLength} units={" moves"}
                            minValue={Math.max(minSolutionLength, 2)} maxValue={250} changeCallback={setMaxSolutionLength}
                            showSteppers
                        />
                    </>}

                    <View style={{ marginTop: normalize(25) }} />
                    <Text style={[TextStyles.paragraph(darkMode), { marginBottom: 0 }]}>Desired Winrate</Text>
                    <Switch value={winrateFilterEnabled} onValueChange={setWinrateFilterEnabled} accessibilityLabel="Winrate filter" style={styles.filterSwitch} trackColor={{ true: purpleTheme.MAIN_COLOR }} />
                    {winrateFilterEnabled && <>
                        <SliderBar
                            label="Minimum" value={minWinrate} units={"%"}
                            minValue={0} maxValue={Math.max(maxWinrate - 1, 1)} changeCallback={setMinWinrate}
                            showSteppers
                        />
                        <SliderBar
                            label="Maximum" value={maxWinrate} units={"%"}
                            minValue={Math.max(minWinrate, 2)} maxValue={100} changeCallback={setMaxWinrate}
                            showSteppers
                        />
                    </>}
                </View>

                <View style={styles.section}>
                    <SimpleButton
                        icon={graphics.FILTER_ICON}
                        text={"Apply Filters"}
                        onPress={toggleModal}
                        extraMargin={[0, 0, 30, 0]}
                        square
                        main
                    />
                </View>
            </ScrollView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    filterChipsRow: {
        paddingHorizontal: "5%",
        marginTop: "1%",
        marginBottom: "1%",
    },
    section: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        marginTop: normalize(6),
        marginBottom: normalize(18),
    },
    modal: {
        flexGrow: 1,
        paddingTop: normalize(24),
        paddingBottom: normalize(24),
        alignItems: "center",
        justifyContent: "space-between",
    },
    filterSwitch: {
        marginVertical: normalize(8),
    },
    wrappedList: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignItems: "center",
        width: "100%",
        paddingHorizontal: "5%",
        marginBottom: normalize(25),
    },
});
