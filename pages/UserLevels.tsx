import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Toast from "react-native-toast-message";
import FilterChip from "../components/FilterChip";
import InputLine, { INPUT_LABEL_ROOM } from "../components/InputLine";
import { Difficulty, IndicatorIcon, StatChip, difficultyThemes } from "../components/LevelCard";
import BottomSheet from "../components/BottomSheet";
import SimpleButton from "../components/SimpleButton";
import SliderBar from "../components/SliderBar";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics, purpleTheme } from "../Theme";
import { ExplicitOrder, QueryFilter, attemptUserLevel, likeUserLevel, queryUserLevels } from "../util/database";
import { hapticLike } from "../util/haptics";
import { useDebounce } from "../util/hooks";
import { getAppState, setEditorLevel } from "../util/store";
import { getData, metadataKeys, parseCompressedBoardData } from "../util/loader";
import { areSetsEqual } from "../util/Set";
import { Level, PageView, SharedLevel, UserLevel } from "../util/types";
import LevelSelect, { CardActions } from "./LevelSelect";

enum Filter {
    POPULAR = "Popular",
    UNBEATEN = "Unsolved",
    UNPLAYED = "New to You",
    LIKED = "Liked",
    NEWEST = "Newest",
    COMPLETED = "Completed",
    PLAYED = "Played Before",
    UNATTEMPTED = "No Attempts",
    YOURS = "Yours", // Your own shared levels. Excludes every other filter.
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

function getRange(value: number, ranges: Record<string, [number, number]>): string {
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
    uid?: string, // The signed-in user, for Yours.
}

// The solve rate says little until a few people have tried a level.
const MIN_ATTEMPTS_FOR_DIFFICULTY = 5;

/** A colored pill: New (too few attempts), Unbeaten, or Easy, Medium or Hard by solve rate. */
function difficultyChip(level: SharedLevel): StatChip {
    if (level.attempts < MIN_ATTEMPTS_FOR_DIFFICULTY) return { label: "New", theme: colors.BLUE_THEME, accessibilityLabel: "New: few attempts so far" };
    if (level.wins === 0) return { label: "Unsolved", theme: colors.ORANGE_THEME };
    const difficulty = getRange(Math.min(1, level.wins / level.attempts), difficultyRanges);
    return { label: difficulty, theme: difficultyThemes[difficulty as Difficulty] };
}

/** The solve rate, colored like the difficulty pill; only once the difficulty is known. */
function solveRateChip(level: SharedLevel): StatChip | undefined {
    if (level.attempts < MIN_ATTEMPTS_FOR_DIFFICULTY || level.wins === 0) return;
    const rate = Math.round(100 * Math.min(1, level.wins / level.attempts));
    return { label: `${rate}% solved`, theme: difficultyChip(level).theme, accessibilityLabel: `${rate}% solve rate` };
}

const bestLength = (level: SharedLevel) => level.bestSolution?.length ?? level.best;
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const bestChip = (level: SharedLevel): StatChip =>
    ({ label: `Best: ${bestLength(level)}`, icon: graphics.FLAG_ICON, accessibilityLabel: `Best solution: ${bestLength(level)} moves` });
const likesChip = (level: SharedLevel): StatChip =>
    ({ label: plural(level.likes, "like"), icon: graphics.LIKE_ICON });

/** When a level was shared: a date string, or a Firestore Timestamp on fetched levels. */
function sharedDate(level: SharedLevel): Date | undefined {
    const shared = level.shared as unknown;
    if (typeof shared === "string") return new Date(shared);
    if (shared && typeof (shared as { toDate?: unknown }).toDate === "function") return (shared as { toDate: () => Date }).toDate();
    return undefined;
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
    if (filters.has(Filter.YOURS)) {
        // Equality filters only, so no composite index is needed; sorted newest first after fetching.
        filterFields.push({ field: "user_uid", operator: "==", value: lists.uid ?? "" });
        return { orderFields: [], filterFields, includeIds: undefined, excludeIds: [] };
    }
    if (filters.has(Filter.UNATTEMPTED)) {
        filterFields.push({ field: "attempts", operator: "==", value: 0 });
    }
    if (filters.has(Filter.UNBEATEN)) {
        // Nobody has solved it yet, whether or not anyone has tried. Also ordered by
        // attempts (after the share date, so in effect only a tiebreak), which matches
        // the indexes built for the earlier "attempts != 0" version of this query.
        filterFields.push({ field: "wins", operator: "==", value: 0 });
        orderFields.push({ field: "attempts", order: orderFields[orderFields.length - 1].order });
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

    const uid = userCredential?.user.uid;
    const isOwnLevel = (uuid: string) =>
        !!uid && filteredLevels.find(lvl => lvl.uuid === uuid)?.user_uid === uid;
    // Sharing creates a new doc id, kept on the local level as db_id (missing if shared from another device).
    const findLocalLevel = (uuid: string) =>
        getAppState().levels.find(level => !level.official && (level as UserLevel).db_id === uuid) as UserLevel | undefined;

    const win = useWindowDimensions();
    // The full filters panel is a native sheet (swipe down to dismiss on iOS).
    const [modalOpen, setModalOpen] = useState(false);
    const toggleModal = () => {
        setModalOpen(!modalOpen);
    };

    // Read from storage only when the shown levels change (e.g. after a like), not on
    // every render: these parse JSON, and renders happen on each search keystroke.
    const localLists = useMemo((): LocalLevelLists => ({
        likedLevels: getData(metadataKeys.likedLevels) || [],
        attemptedLevels: getData(metadataKeys.attemptedLevels) || [],
        completedLevels: getData(metadataKeys.completedLevels) || [],
        uid,
    }), [userLevels, uid]);
    const { likedLevels } = localLists;

    // Likes show at once, before the server answers (and roll back if it fails).
    const [optimisticLikes, setOptimisticLikes] = useState(new Set<string>());
    const isLiked = (uuid: string) => likedLevels.includes(uuid) || optimisticLikes.has(uuid);
    const canLike = (uuid: string) => !!uid && !isOwnLevel(uuid);
    const latestLevels = useRef(userLevels);
    latestLevels.current = userLevels;
    const changeLikes = (uuid: string, delta: number) => setUserLevels(latestLevels.current.map(lvl =>
        lvl.uuid === uuid ? { ...lvl, likes: lvl.likes + delta } : lvl
    ));
    const likeLevel = async (uuid: string) => {
        if (!uid || isLiked(uuid) || isOwnLevel(uuid)) return;
        hapticLike();
        setOptimisticLikes(likes => new Set(likes).add(uuid));
        changeLikes(uuid, 1);

        const success = await likeUserLevel(uuid, uid);
        if (success) return;
        setOptimisticLikes(likes => { const next = new Set(likes); next.delete(uuid); return next; });
        changeLikes(uuid, -1);
        Toast.show({
            type: "error",
            text1: "Couldn't like level.",
            text2: "Please check your connection and try again.",
        });
    };

    const manageLevel = (uuid: string) => {
        const localLevel = findLocalLevel(uuid);
        if (!localLevel) return;
        setEditorLevel(localLevel);
        viewCallback(PageView.MANAGE, 1);
    };

    const playLevel = (uuid: string) => {
        const level = filteredLevels.find(level => level.uuid === uuid);
        if (!level) return;
        playLevelCallback(level);
        // TODO: Add attempt tracking for official levels too.
        attemptUserLevel(uuid, uid);
    };

    const scrollRef = useRef<FlatList<Filter>>(null);

    const [filters, setFilters] = useState(new Set<Filter>());
    const toggleFilter = (filter: Filter) => {
        const alreadyEnabled = filters.has(filter);
        if (filter === Filter.YOURS) return setFilters(new Set(alreadyEnabled ? [] : [Filter.YOURS]));

        const newFilters = new Set(filters);
        newFilters.delete(Filter.YOURS);

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
    const [loadFailed, setLoadFailed] = useState(false);

    // Yours needs an account, and while it's on, the other filters are hidden.
    const allFilters = Object.values(Filter).filter(filter => filter !== Filter.YOURS || !!uid);
    const inactiveFilters = new Set(filters.has(Filter.YOURS) ? [] : allFilters.filter(item => !filters.has(item)));
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
            if (filters.has(Filter.YOURS)) data.sort((a, b) =>
                (sharedDate(b as unknown as SharedLevel)?.getTime() ?? 0) - (sharedDate(a as unknown as SharedLevel)?.getTime() ?? 0));

            setMatchingCount(count);
            setLoadFailed(false);
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
            if (requestId !== latestRequest.current) return false;
            // Don't leave the previous results up under filters they don't match.
            setUserLevels([]);
            setMatchingCount(0);
            setLoadFailed(true);
            setLoading(false);
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

    // Card chips. The best solution only shows once a player has beaten the level: until
    // then it would be the creator's own solution, which gives too much away.
    const getStats = useCallback((level: Level): StatChip[] => {
        const shared = level as SharedLevel;
        return [difficultyChip(shared), solveRateChip(shared), shared.wins > 0 ? bestChip(shared) : undefined, likesChip(shared)]
            .filter(chip => chip !== undefined);
    }, []);

    const getSubtitle = useCallback((level: Level) => {
        const shared = level as SharedLevel;
        return uid && shared.user_uid === uid ? "by you" : undefined;
    }, [uid]);

    // When it was shared, then plays and wins, in small print under the pills.
    const getFootnote = useCallback((level: Level) => {
        const shared = level as SharedLevel;
        const date = sharedDate(shared);
        const when = date ? `Shared ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · ` : "";
        return `${when}${plural(shared.attempts, "play")} · ${plural(shared.wins, "win")}`;
    }, []);

    const cardActions: CardActions = {
        isLiked,
        canLike,
        onLike: likeLevel,
        // Manage your own levels; unavailable if shared from another device (no local copy).
        canManage: (uuid: string) => isOwnLevel(uuid) ? !!findLocalLevel(uuid) : undefined,
        onManage: manageLevel,
    };

    // What the list shows: the active filters, and how many levels match.
    const activeLabels = [...filters].map(String);
    if (!filters.has(Filter.YOURS)) {
        if (lengthFilterEnabled) activeLabels.push(`${minSolutionLength}–${maxSolutionLength} moves`);
        if (winrateFilterEnabled) activeLabels.push(`${minWinrate}–${maxWinrate}% solved`);
    }
    if (searchQuery) activeLabels.push(`"${searchQuery}"`);
    const shownCount = searchQuery ? filteredLevels.length : Math.max(matchingCount, filteredLevels.length);
    const summary = [...activeLabels, plural(shownCount, "level")].join(" · ");
    const clearFilters = () => {
        setFilters(new Set());
        setLengthFilterEnabled(false);
        setWinrateFilterEnabled(false);
        setSearchQuery("");
    };

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
                        {/* The field reserves room above its outline for the raised
                            label; match it so the button centers on the outline. */}
                        <View style={{ marginTop: INPUT_LABEL_ROOM }}>
                            <SimpleButton
                                icon={graphics.FILTER_ICON}
                                onPress={toggleModal}
                                extraMargin={[10, 0, 0, 0]}
                                square
                                main
                            />
                        </View>
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
                    <View style={styles.summaryRow}>
                        <Text allowFontScaling={false} numberOfLines={1} style={[styles.summary, { color: darkMode ? purpleTheme.MAIN_COLOR : purpleTheme.TINT_COLOR }]}>
                            {summary}
                        </Text>
                        {activeLabels.length > 0 && <Pressable onPress={clearFilters} hitSlop={10} accessibilityRole="button">
                            <Text allowFontScaling={false} style={[styles.clear, { color: purpleTheme.DARK_COLOR }]}>Clear</Text>
                        </Pressable>}
                    </View>
                </View>}
                footerText={`Showing ${filteredLevels.length} of ${Math.max(matchingCount, filteredLevels.length)} levels`}

                viewCallback={(newView: PageView) => viewCallback(newView, 1)}
                resumeLevelCallback={playLevelCallback}
                playLevelCallback={playLevel}
                cardActions={cardActions}
                getStats={getStats}
                getSubtitle={getSubtitle}
                getFootnote={getFootnote}
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
                    textLines: loadFailed ? ["Couldn't load levels.", "Check your connection, then pull to refresh."] :
                        filters.has(Filter.YOURS) ?
                        ["You haven't shared any levels yet.", "Share one from its page in the editor."] :
                        ["Could not find any good matches for your search.", "Try widening your search to use less filters."],
                }}
                theme={purpleTheme}
                noNumber
            />

            <BottomSheet visible={modalOpen} onClose={() => setModalOpen(false)} contentStyle={styles.modal}>
                {/* Apply sits at the top: the sheet resizes while it's dragged between
                    heights, and a button pinned to the bottom jumped around with it. */}
                <View style={styles.sheetHeader}>
                    <Text allowFontScaling={false} style={[TextStyles.subtitle(darkMode), styles.sheetTitle]}>
                        Filters
                    </Text>
                    <SimpleButton
                        icon={graphics.FILTER_ICON}
                        text={"Apply"}
                        onPress={toggleModal}
                        main
                    />
                </View>

                <View style={styles.section}>

                    <View style={styles.wrappedList}>
                        {allFilters.map((filter, index) => <FilterChip
                            key={index}
                            text={filter}
                            active={filters.has(filter)}
                            onPress={() => toggleFilter(filter)}
                            disabled={loading || !validFilters.includes(filter)}
                            verticalMargin
                        />)}
                    </View>

                    <View style={styles.rangeRow}>
                        <Text allowFontScaling={false} style={[TextStyles.paragraph(darkMode), styles.rangeLabel]}>Solution Length</Text>
                        <FilterChip
                            text={lengthFilterEnabled ? "Limited" : "Any"}
                            active={lengthFilterEnabled}
                            onPress={() => setLengthFilterEnabled(!lengthFilterEnabled)}
                        />
                    </View>
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

                    <View style={[styles.rangeRow, { marginTop: normalize(20) }]}>
                        <Text allowFontScaling={false} style={[TextStyles.paragraph(darkMode), styles.rangeLabel]}>Solve Rate</Text>
                        <FilterChip
                            text={winrateFilterEnabled ? "Limited" : "Any"}
                            active={winrateFilterEnabled}
                            onPress={() => setWinrateFilterEnabled(!winrateFilterEnabled)}
                        />
                    </View>
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
            </BottomSheet>
        </>
    );
}

const styles = StyleSheet.create({
    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: "5%",
        marginTop: normalize(6),
        gap: normalize(12),
    },
    summary: {
        flex: 1,
        fontFamily: "Montserrat-Regular",
        fontSize: normalize(13),
    },
    clear: {
        fontFamily: "Montserrat-Medium",
        fontSize: normalize(14),
    },
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
        paddingTop: normalize(20),
        paddingBottom: normalize(40),
        alignItems: "center",
    },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "90%",
    },
    sheetTitle: {
        marginVertical: 0,
    },
    rangeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "90%",
        marginBottom: normalize(4),
    },
    rangeLabel: {
        marginVertical: 0,
    },
    wrappedList: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignItems: "center",
        width: "100%",
        paddingHorizontal: "4%",
        marginBottom: normalize(20),
    },
});
