import { useContext, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import GlobalContext from "../GlobalContext";
import { areSetsEqual } from "../util/Set";
import { graphics, purpleTheme } from "../Theme";
import { PageView, SharedLevel } from "../util/types";
import { getData, metadataKeys, parseCompressedBoardData } from "../util/loader";
import { ExplicitOrder, QueryFilter, attemptUserLevel, createFirebaseQuery, getEntriesFromQuery, getEntryCountFromQuery, likeUserLevel } from "../util/database";

import LevelSelect from "./LevelSelect";
import InputLine from "../components/InputLine";
import FilterChip from "../components/FilterChip";
import Toast from "react-native-toast-message";

enum Filter {
    POPULAR = "Popular",
    UNBEATEN = "Unbeaten",
    UNPLAYED = "New to You",
    LIKED = "Liked",
    NEWEST = "Newest",
    EASY = "Easy",
    MEDIUM = "Medium",
    HARD = "Hard",
    SHORT = "Short",
    NORMAL = "Normal",
    LONG = "Long",
    COMPLETED = "Completed",
    PLAYED = "Played Before",
}

const mutualExclusions = [
    new Set([Filter.EASY, Filter.MEDIUM, Filter.HARD, Filter.UNBEATEN, Filter.COMPLETED]),
    new Set([Filter.LIKED, Filter.UNPLAYED, Filter.PLAYED, Filter.COMPLETED]),
    new Set([Filter.LIKED, Filter.UNPLAYED, Filter.PLAYED, Filter.COMPLETED]),
    new Set([Filter.SHORT, Filter.NORMAL, Filter.LONG]),
];

type difficultyFilter = Filter.EASY | Filter.MEDIUM | Filter.HARD;
const difficultyRanges = {
    [Filter.EASY]: [0.95, 1],
    [Filter.MEDIUM]: [0.5, 0.95],
    [Filter.HARD]: [0, 0.5],
} as Record<Filter, [number, number]>;

type lengthFilter = Filter.SHORT | Filter.NORMAL | Filter.LONG;
const lengthRanges = {
    [Filter.SHORT]: [0, 50],
    [Filter.NORMAL]: [50, 100],
    [Filter.LONG]: [100, Infinity],
} as Record<Filter, [number, number]>;

function getRange(value: number, ranges: Record<Filter, [number, number]>): string {
    for (const [rank, range] of Object.entries(ranges)) {
        if (value > range[0] && value <= range[1]) return rank;
    }
    throw new Error(`Invalid value ${value} for ranges ${ranges}`);
}

interface Props {
    viewCallback: (newView: PageView) => void,
    playLevelCallback: (level: SharedLevel) => void,
    scrollTo?: string,
    elementHeight: number,
    storeElementHeightCallback: (height: number) => void,
}

export default function UserLevels({
    viewCallback,
    playLevelCallback,
    scrollTo,
    elementHeight,
    storeElementHeightCallback,
}: Props) {
    const { darkMode, userCredential } = useContext(GlobalContext);
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

    const [numLoaded, setNumLoaded] = useState(10);
    const [matchingCount, setMatchingCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    const [loading, setLoading] = useState(true);
    const [userLevels, setUserLevels] = useState<SharedLevel[]>([]);

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

    const prevFilters = useRef(new Set<Filter>());
    const fetchLevels = async () => {
        setLoading(true);
        try {
            const orderFields: ExplicitOrder[] = [];
            if (filters.has(Filter.POPULAR)) orderFields.push({ field: "likes", order: "desc" });
            orderFields.push({ field: "shared", order: filters.has(Filter.NEWEST) ? "desc" : "asc" });

            const filterFields: QueryFilter[] = [];
            if (filters.has(Filter.UNBEATEN)) filterFields.push({ field: "wins", operator: "==", value: 0 });

            const filterInList = (operator: "in"|"not-in", list: string[]) => {
                const nonEmptyList = list.length === 0 ? [null] : list;
                // TODO: The following needs chunking, since we can have at most 30 disjunctions.
                filterFields.push({ field: "uuid", operator: operator, value: nonEmptyList });
            };
            
            if (filters.has(Filter.LIKED)) filterInList("in", likedLevels);
            if (filters.has(Filter.PLAYED)) filterInList("in", attemptedLevels);
            if (filters.has(Filter.UNPLAYED)) filterInList("not-in", attemptedLevels);
            if (filters.has(Filter.COMPLETED)) filterInList("in", completedLevels);

            const difficulties: difficultyFilter[] = [Filter.EASY, Filter.MEDIUM, Filter.HARD];
            for (let i = 0; i < difficulties.length; i++) {
                const difficulty = difficulties[i];
                const range = difficultyRanges[difficulty];

                if (filters.has(difficulty)) {
                    filterFields.push({ field: "winrate", operator: ">", value: range[0] });
                    filterFields.push({ field: "winrate", operator: "<=", value: range[1] });
                    break;
                }
            }
            
            const lengths: lengthFilter[] = [Filter.SHORT, Filter.NORMAL, Filter.LONG];
            for (let i = 0; i < difficulties.length; i++) {
                const length = lengths[i];
                const range = lengthRanges[length];

                if (filters.has(length)) {
                    filterFields.push({ field: "best", operator: ">", value: range[0] });
                    filterFields.push({ field: "best", operator: "<=", value: range[1] });
                    break;
                }
            }

            console.log(">>> QUERY", numLoaded, orderFields, filterFields);
            const query = createFirebaseQuery("userLevels", numLoaded, orderFields, filterFields);

            const data = await getEntriesFromQuery(query);
            const count = await getEntryCountFromQuery(query);

            console.log(">>> RECIEVED", count, data);
            setMatchingCount(count);
            setUserLevels(data.map(doc => {
                return {
                    ...doc,
                    board: parseCompressedBoardData(doc.board),
                };
            }));

            setLoading(false);
            return true;
        } catch {
            setLoading(false);
            return false;
        }
    };

    useEffect(() => { fetchLevels(); }, []);
    useEffect(() => {
        if (!areSetsEqual(filters, prevFilters.current)) fetchLevels();
        prevFilters.current = filters;
    }, [filters, numLoaded, searchQuery]);

    return (
        <LevelSelect
            headerComponent={<>
                <View style={{
                    marginHorizontal: "5%",
                    marginTop: userLevels.length === 0 ? "5%" : 0,
                    width: userLevels.length === 0 ? "90%" : undefined,
                }}>
                    <InputLine
                        label={"Search"}
                        value={searchQuery}
                        onChange={setSearchQuery}
                        // disabled={userLevels.length === 0}
                        darkMode={darkMode}
                        fullBorder
                    />
                </View>
                <FlatList
                    horizontal
                    ref={scrollRef}
                    overScrollMode="never"
                    showsHorizontalScrollIndicator={false}
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={styles.filterChipsRow}
                    // data={Object.values(Filter)}
                    data={validFilters}
                    renderItem={({ item, index }) => <FilterChip
                        key={index}
                        text={item}
                        active={filters.has(item)}
                        onPress={() => toggleFilter(item)}
                    // disabled={userLevels.length === 0}
                    />}
                />
            </>}
            footerText={`Showing ${userLevels.length}/${matchingCount} levels`}

            viewCallback={viewCallback}
            playLevelCallback={(uuid: string) => {
                const level = userLevels.find(level => level.uuid === uuid)!;
                playLevelCallback(level);
                attemptUserLevel(uuid);
                viewCallback(PageView.PLAY);
            }}
            secondButtonProps={{
                text: (uuid: string) => likedLevels.includes(uuid) ? "Liked" : "Like",
                disabled: (uuid: string) => !userCredential || likedLevels.includes(uuid),
                icon: graphics.LIKE_ICON,
                callback: async (uuid: string, index: number) => {
                    const success = await likeUserLevel(uuid, userCredential!.user.email!);
                    if (!success) {
                        Toast.show({
                            type: "error",
                            text1: "Couldn't like level.",
                            text2: "Please check your connection and try again.",
                        });
                    }
                    const newUserLevels = [...userLevels];
                    newUserLevels[index].likes += 1;
                    setUserLevels(newUserLevels);
                },
            }
            }
            // @ts-expect-error
            getStats={(targetLevel: SharedLevel) => {
                const stats = [`${targetLevel.likes} likes`];

                let winrate = Math.round(100 * targetLevel.wins / targetLevel.attempts);
                if (isNaN(winrate)) stats.push("No attempts yet!");
                else if (targetLevel.wins === 0) stats.push("Never beaten!");
                else stats.push(`${winrate}% solve rate (${getRange(winrate / 100, difficultyRanges)})`);

                stats.push(getRange(targetLevel.best!, lengthRanges) + " solution");

                return stats;
            }}
            levels={userLevels}
            scrollTo={scrollTo}
            allowResume
            elementHeight={elementHeight}
            storeElementHeightCallback={storeElementHeightCallback}
            onRefresh={fetchLevels}
            overrideRefreshing={loading}
            onEndReached={() => {
                // If this triggers, there are no more levels to load!
                if (numLoaded > userLevels.length) return;
                setNumLoaded(numLoaded + 10);
            }}
            emptyListProps={{
                textLines: ["Could not find any matching levels for your search.", "Note that search terms must match whole words."],
                padBottom: true,
            }}
            theme={purpleTheme}
            noNumber
        />
    );
}

const styles = StyleSheet.create({
    filterChipsRow: {
        paddingHorizontal: "5%",
        marginTop: "1%",
        marginBottom: "1%",
    },
});