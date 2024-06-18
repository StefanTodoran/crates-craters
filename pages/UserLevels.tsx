import { useContext, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { SharedLevel } from "../util/types";
import GlobalContext from "../GlobalContext";
import { graphics, purpleTheme } from "../Theme";
import { getData, metadataKeys, parseCompressedBoardData } from "../util/loader";
import { ExplicitOrder, QueryFilter, createFirebaseQuery, getEntriesFromQuery, getEntryCountFromQuery, likeUserLevel } from "../util/database";

import LevelSelect from "./LevelSelect";
import InputLine from "../components/InputLine";
import FilterChip from "../components/FilterChip";
import Toast from "react-native-toast-message";

enum Filter {
    LIKED = "Liked", // Done
    NEWEST = "Newest", // Done
    OLDEST = "Oldest", // Done
    POPULAR = "Popular",
    UNBEATEN = "Unbeaten",
    EASY = "Easy",
    MEDIUM = "Medium",
    HARD = "Hard",
    UNPLAYED = "New to You",
}

const mutualExclusions = [
    new Set([Filter.EASY, Filter.MEDIUM, Filter.HARD, Filter.UNBEATEN]),
    new Set([Filter.NEWEST, Filter.OLDEST]),
];

interface Props {
    elementHeight: number,
    storeElementHeightCallback: (height: number) => void,
}

export default function UserLevels({
    elementHeight,
    storeElementHeightCallback,
}: Props) {
    const { darkMode } = useContext(GlobalContext);
    const likedLevels = getData(metadataKeys.likedLevels) || [];
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

    const fetchLevels = async () => {
        try {
            const orderFields: ExplicitOrder[] = [];
            orderFields.push({ field: "shared", order: filters.has(Filter.NEWEST) ? "desc" : "asc"});
            // if (filters.has(Filter.POPULAR)) orderFields.unshift("likes");

            const filterFields: QueryFilter[] = [];
            if (filters.has(Filter.UNPLAYED)) filterFields.push({ field: "attempts", operator: "==", value: 0 });

            const query = createFirebaseQuery("userLevels", numLoaded, orderFields, filterFields);
            console.log("SENDING QUERY", numLoaded, orderFields, filterFields);
            
            const data = await getEntriesFromQuery(query);
            const count = await getEntryCountFromQuery(query);

            console.log("RECIEVED", count, data);
            setMatchingCount(count);
            setUserLevels(data.map(doc => {
                return {
                    ...doc,
                    board: parseCompressedBoardData(doc.board),
                };
            }));
            return true;
        } catch {
            return false;
        }
    };

    useEffect(() => {
        fetchLevels();
    }, [filters, numLoaded, searchQuery]);

    let totalCount = matchingCount;
    let filteredLevels = userLevels;

    if (filters.has(Filter.LIKED)) {
        filteredLevels = filteredLevels.filter(level => likedLevels.includes(level.uuid));
        totalCount = likedLevels.length;
    }

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
                        disabled={userLevels.length === 0}
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
                        disabled={userLevels.length === 0}
                    />}
                />
            </>}
            footerText={`Showing ${filteredLevels.length}/${totalCount} levels`}

            viewCallback={() => { }}
            playLevelCallback={() => {
                // Start playing, mark attempted on server.
            }}
            secondButtonProps={{
                text: (uuid: string) => likedLevels.includes(uuid) ? "Liked" : "Like",
                disabled: (uuid: string) => likedLevels.includes(uuid),
                icon: graphics.LIKE_ICON,
                callback: async (uuid: string, index: number) => {
                    const success = await likeUserLevel(uuid);
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

                let winrate = (100 * targetLevel.wins / targetLevel.attempts);
                if (isNaN(winrate)) stats.push("No attempts yet!");
                else stats.push(`${Math.round(winrate)}% winrate`);

                return stats;
            }}
            levels={filteredLevels}
            elementHeight={elementHeight}
            storeElementHeightCallback={storeElementHeightCallback}
            onRefresh={fetchLevels}
            onEndReached={() => {
                // If this triggers, there are no more levels to load!
                if (numLoaded > userLevels.length) return;
                setNumLoaded(numLoaded + 10);
            }}
            emptyListProps={{
                textLines: ["Unable to load user levels from server!", "Check your internet connection, then try again."],
                buttonLabel: "Retry Download",
                buttonIcon: graphics.CRATE,
                onPress: fetchLevels,
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