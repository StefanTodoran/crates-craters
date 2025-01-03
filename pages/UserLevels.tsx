import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, FlatList, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import FilterChip from "../components/FilterChip";
import InputLine from "../components/InputLine";
import { IndicatorIcon } from "../components/LevelCard";
import SimpleButton from "../components/SimpleButton";
import SliderBar from "../components/SliderBar";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { graphics, purpleTheme } from "../Theme";
import { ExplicitOrder, QueryFilter, attemptUserLevel, createFirebaseQuery, getEntriesFromQuery, getEntryCountFromQuery, likeUserLevel } from "../util/database";
import { useDebounce } from "../util/hooks";
import { getData, metadataKeys, parseCompressedBoardData } from "../util/loader";
import { areSetsEqual } from "../util/Set";
import { PageView, SharedLevel } from "../util/types";
import LevelSelect from "./LevelSelect";

const win = Dimensions.get("window");

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
    throw new Error(`Invalid value ${value} for ranges ${ranges}`);
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

    const [modalOpen, setModalOpen] = useState(false);
    const fadeModalAnim = useRef(new Animated.Value(0)).current;
    const toggleModal = useCallback(() => {
        const start = (modalOpen) ? 1 : 0;
        const end = (modalOpen) ? 0 : 1;
        const modalWasOpen = modalOpen;

        if (!modalWasOpen) { // If modal was not open
            setModalOpen(true); // Set modal to open
        }

        fadeModalAnim.setValue(start);
        Animated.timing(fadeModalAnim, {
            toValue: end,
            duration: 200,
            useNativeDriver: true
        }).start(() => {
            if (modalWasOpen) {
                setModalOpen(false);
            }
        });
    }, [modalOpen]);

    const likedLevels = getData(metadataKeys.likedLevels) || [];
    const attemptedLevels = getData(metadataKeys.attemptedLevels) || [];
    const completedLevels = getData(metadataKeys.completedLevels) || [];
    const scrollRef = useRef<any>();

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
        scrollRef.current.scrollToOffset({ offset: 0, animated: false });
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

    const prevParams = useRef<SearchParams>({
        filters: new Set<Filter>(),
        lengthFilterEnabled: false,
        minSolutionLength: 50,
        maxSolutionLength: 150,
        winrateFilterEnabled: false,
        minWinrate: 25,
        maxWinrate: 95,
    });
    const fetchLevels = async (
        filters: Set<Filter>,
        numLoaded: number,
        likedLevels: string[],
        attemptedLevels: string[],
        completedLevels: string[],
    ) => {
        setLoading(true);
        try {
            const orderFields: ExplicitOrder[] = [];
            if (filters.has(Filter.POPULAR)) orderFields.push({ field: "likes", order: "desc" });
            orderFields.push({ field: "shared", order: filters.has(Filter.NEWEST) ? "desc" : "asc" });

            const filterFields: QueryFilter[] = [];
            filterFields.push({ field: "public", operator: "==", value: true });
            if (filters.has(Filter.UNATTEMPTED)) {
                filterFields.push({ field: "attempts", operator: "==", value: 0 });
            }
            if (filters.has(Filter.UNBEATEN)) {
                filterFields.push({ field: "wins", operator: "==", value: 0 });
                filterFields.push({ field: "attempts", operator: "!=", value: 0 });
            }

            const filterInList = (operator: "in" | "not-in" | "array-contains-any", list: string[], field: string = "uuid") => {
                if (list.length === 0) return;
                // TODO: The following needs chunking, since we can have at most 30 disjunctions.
                filterFields.push({ field: field, operator: operator, value: list });
            };

            if (filters.has(Filter.LIKED)) filterInList("in", likedLevels);
            if (filters.has(Filter.PLAYED)) filterInList("in", attemptedLevels);
            if (filters.has(Filter.UNPLAYED)) filterInList("not-in", attemptedLevels);
            if (filters.has(Filter.COMPLETED)) filterInList("in", completedLevels);

            // if (searchQuery) {
            //     const keywords = [...searchQuery.toLowerCase().split(/\s+/)];
            //     filterInList("array_contains_any", keywords, "keywords");
            // }

            if (lengthFilterEnabled) {
                filterFields.push({ field: "best", operator: ">", value: minSolutionLength });
                filterFields.push({ field: "best", operator: "<=", value: maxSolutionLength });
            }
            if (winrateFilterEnabled) {
                filterFields.push({ field: "winrate", operator: ">=", value: minWinrate / 100 });
                filterFields.push({ field: "winrate", operator: "<=", value: maxWinrate / 100 });
            }

            // console.log(filterFields);
            const query = createFirebaseQuery("userLevels", numLoaded, orderFields, filterFields);
            const data = await getEntriesFromQuery(query);
            const count = await getEntryCountFromQuery(query);

            setMatchingCount(count);
            setUserLevels(data.filter(doc => doc.public).map(doc => {
                return {
                    ...doc,
                    board: parseCompressedBoardData(doc.board),
                    completed: completedLevels.includes(doc.uuid),
                };
            }));

            setLoading(false);
            return true;
        } catch {
            setLoading(false);
            return false;
        }
    };
    const parametrizedFetchLevels = () => fetchLevels(filters, numLoaded, likedLevels, attemptedLevels, completedLevels);
    const didParamsChange = () => {
        if (!areSetsEqual(filters, prevParams.current.filters)) return true;
        if (lengthFilterEnabled !== prevParams.current.lengthFilterEnabled) return true;
        if (winrateFilterEnabled !== prevParams.current.winrateFilterEnabled) return true;
        if (minSolutionLength !== prevParams.current.minSolutionLength) return true;
        if (maxSolutionLength !== prevParams.current.maxSolutionLength) return true;
        if (minWinrate !== prevParams.current.minWinrate) return true;
        if (maxWinrate !== prevParams.current.maxWinrate) return true;
        return false;
    };

    const debouncedFetchLevels = useDebounce(parametrizedFetchLevels, 1000);
    useEffect(() => { 
        if (userLevels.length === 0) parametrizedFetchLevels();
    }, []); // Fetch levels on mount.
    useEffect(() => {
        if (modalOpen) return;
        if (didParamsChange()) debouncedFetchLevels();
        prevParams.current = {
            filters,
            lengthFilterEnabled,
            minSolutionLength,
            maxSolutionLength,
            winrateFilterEnabled,
            minWinrate,
            maxWinrate,
        };
    }, [filters, numLoaded]); // }, [filters, numLoaded, searchQuery]);
    useEffect(() => {
        if (modalOpen) return;
        if (didParamsChange()) parametrizedFetchLevels();
        prevParams.current = {
            filters,
            lengthFilterEnabled,
            minSolutionLength,
            maxSolutionLength,
            winrateFilterEnabled,
            minWinrate,
            maxWinrate,
        };
    }, [modalOpen]);

    let filteredLevels = userLevels;
    if (searchQuery) filteredLevels = userLevels.filter(level => level.name.toLowerCase().includes(searchQuery.toLowerCase()) || level.user_name.toLowerCase().includes(searchQuery.toLowerCase()));

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
                footerText={`Showing ${filteredLevels.length} of ${matchingCount} levels`}

                viewCallback={(newView: PageView) => viewCallback(newView, 1)}
                resumeLevelCallback={playLevelCallback}
                playLevelCallback={(uuid: string) => {
                    const level = filteredLevels.find(level => level.uuid === uuid)!;
                    playLevelCallback(level);
                    // TODO: Add attempt tracking for official levels too.
                    attemptUserLevel(uuid, userCredential?.user.email);
                }}
                secondButtonProps={{
                    text: (uuid: string) => {
                        const likeCount = filteredLevels.find(lvl => lvl.uuid === uuid)!.likes;
                        return (likedLevels.includes(uuid) ? "Liked" : "Like") + ` (${likeCount})`;
                    },
                    disabled: (uuid: string) => {
                        return !userCredential ||
                            likedLevels.includes(uuid) ||
                            filteredLevels.find(lvl => lvl.uuid === uuid)!.user_email === userCredential.user.email
                    },
                    icon: graphics.LIKE_ICON,
                    callback: async (uuid: string) => {
                        const success = await likeUserLevel(uuid, userCredential!.user.email!);
                        if (!success) {
                            Toast.show({
                                type: "error",
                                text1: "Couldn't like level.",
                                text2: "Please check your connection and try again.",
                            });
                        }
                        const newUserLevels = [...userLevels];
                        const index = newUserLevels.findIndex(lvl => lvl.uuid === uuid);
                        newUserLevels[index].likes += 1;
                        setUserLevels(newUserLevels);
                    },
                }
                }
                // @ts-expect-error
                getStats={(targetLevel: SharedLevel) => {
                    const stats = [];

                    let winrate = Math.round(100 * targetLevel.wins / targetLevel.attempts);
                    if (isNaN(winrate)) stats.push("No attempts yet!");
                    else if (targetLevel.wins === 0) stats.push("Never beaten!");
                    else stats.push(`${winrate}% solve rate (${getRange(winrate / 100, difficultyRanges)})`);

                    const solnLen = targetLevel.bestSolution!.length;
                    stats.push(`${getRange(solnLen, lengthRanges)} solution`);
                    stats.push(`(Best: ${solnLen} moves)`);

                    if (userCredential && targetLevel.user_email === userCredential.user.email) {
                        stats.push("Made by you!");
                    }

                    return stats;
                }}
                levels={filteredLevels}
                scrollTo={scrollTo}
                allowResume
                elementHeight={elementHeight}
                storeElementHeightCallback={storeElementHeightCallback}
                indicatorIcon={IndicatorIcon.COMPLETION}
                onRefresh={parametrizedFetchLevels}
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

            {modalOpen && <Animated.View style={[
                styles.modal,
                {
                    opacity: fadeModalAnim,
                    backgroundColor: darkMode ? "rgba(0, 0, 0, 0.95)" : "rgba(255, 255, 255, 0.95)",
                },
            ]}>
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
                    <SimpleButton
                        text={lengthFilterEnabled ? "Disable Length Filter" : "Enable Length Filter"}
                        onPress={() => setLengthFilterEnabled(!lengthFilterEnabled)}
                    />
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
                    <SimpleButton
                        text={winrateFilterEnabled ? "Disable Winrate Filter" : "Enable Winrate Filter"}
                        onPress={() => setWinrateFilterEnabled(!winrateFilterEnabled)}
                    />
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
            </Animated.View>}
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
        ...StyleSheet.absoluteFillObject,
        paddingTop: normalize(12),
        paddingBottom: normalize(12),
        alignItems: "center",
        justifyContent: "space-between",
        height: "100%",
        width: "100%",
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
