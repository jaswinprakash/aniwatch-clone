import { MaterialIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    Image,
    ImageBackground,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import Modal from "react-native-modal";
import { TextInput, TouchableRipple } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiConfig } from "../../AxiosConfig";
import { ThemedText } from "../../components/ThemedText";
import { Colors } from "../../constants/Colors";
import { SIZE } from "../../constants/Constants";
import AppliedFilters from "./_components/AppliedFilters";
import FilterModal from "./_components/FilterModal";

const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);
    const [genres, setGenres] = useState();
    const [categories, setCategories] = useState([
        { id: "most-favorite", name: "Most Favorite" },
        { id: "most-popular", name: "Most Popular" },
        { id: "subbed-anime", name: "Subbed Anime" },
        { id: "dubbed-anime", name: "Dubbed Anime" },
        { id: "recently-updated", name: "Recently Updated" },
        { id: "recently-added", name: "Recently Added" },
        { id: "top-upcoming", name: "Top Upcoming" },
        { id: "top-airing", name: "Top Airing" },
        { id: "movie", name: "Movie" },
        { id: "special", name: "Special" },
        { id: "ova", name: "OVA" },
        { id: "ona", name: "ONA" },
        { id: "tv", name: "TV" },
        { id: "completed", name: "Completed" },
    ]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedGenre, setSelectedGenre] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

    const handleFilter = async (type) => {
        if (type === "clear") {
            setSelectedCategory("");
            setSelectedGenre("");
            handleSearch("filter", searchQuery);
        } else if (type === "apply") {
            handleSearch("filter", searchQuery);
        }

        setFilterModalVisible(false);
    };
    const handleSelection = (type, id) => {
        if (type === "genre") {
            setSelectedGenre((prev) =>
                Array.isArray(prev)
                    ? prev.includes(id)
                        ? prev.filter((g) => g !== id)
                        : [...prev, id]
                    : [id]
            );
        } else if (type === "category") {
            setSelectedCategory(id);
        }
    };

    const getHomeList = async () => {
        setFilterLoading(true);
        try {
            const response = await apiConfig.get("/api/v2/hianime/home");
            setGenres(response.data.data.genres);
            setFilterLoading(false);
        } catch (error) {
            console.log(error, "axios error - search - genre");
            setFilterLoading(false);
        }
    };

    useEffect(() => {
        getHomeList();
    }, []);

    const handleSearch = (type, query) => {
        setSearchQuery(query);
        setSearchLoading(true);
    };

    const debounce = (func, delay) => {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const debouncedSearch = useMemo(
        () =>
            debounce(async (query, genre, category) => {
                setSearchLoading(true);
                if (query) {
                    const formattedGenres =
                        Array.isArray(genre) && genre.length > 0
                            ? genre
                                  .map((g) =>
                                      g.toLowerCase().replace(/\s+/g, "-")
                                  )
                                  .join(",")
                            : "";

                    try {
                        const response = await apiConfig.get(
                            `/api/v2/hianime/search?q=${query}&type=${category}&genres=${formattedGenres}`
                        );
                        setCurrentPage(response.data.data.currentPage);
                        setHasNextPage(response.data.data.hasNextPage);
                        setSearchResults(response.data.data.animes);
                    } catch (error) {
                        console.log(error, "axios error - search perform");
                    } finally {
                        setSearchLoading(false);
                    }
                } else {
                    setSearchResults([]);
                    setSearchLoading(false);
                }
            }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery, selectedGenre, selectedCategory);

        return () => {
            debouncedSearch.cancel?.();
        };
    }, [searchQuery, selectedGenre, selectedCategory, debouncedSearch]);

    const handleLoadMore = async () => {
        if (hasNextPage) {
            setIsFetchingNextPage(true);
            try {
                const response = await apiConfig.get(
                    `/api/v2/hianime/search?q=${searchQuery}&type=${selectedCategory}&genres=${selectedGenre}&page=${
                        currentPage + 1
                    }`
                );
                setCurrentPage(response.data.data.currentPage);
                setHasNextPage(response.data.data.hasNextPage);
                setSearchResults((prev) => [
                    ...prev,
                    ...response.data.data.animes,
                ]);
            } catch (error) {
                console.log(error, "axios error - search load more");
            } finally {
                setIsFetchingNextPage(false);
            }
        }
    };

    const renderSearchResults = () => {
        // Case 1: No query entered
        if (searchQuery.length === 0) {
            return (
                <View style={styles.placeholderContainer}>
                    <MaterialIcons
                        name="search"
                        size={SIZE(50)}
                        color={Colors.light.tabIconSelected}
                    />
                    <ThemedText type="title" style={styles.placeholderText}>
                        Search for something...
                    </ThemedText>
                </View>
            );
        }

        // Case 2: Query entered but no results found
        if (searchResults?.length === 0 && !searchLoading) {
            return (
                <View style={styles.placeholderContainer}>
                    <MaterialIcons
                        name="search-off"
                        size={SIZE(50)}
                        color={Colors.light.tabIconSelected}
                    />
                    <ThemedText type="title" style={styles.placeholderText}>
                        No results found
                    </ThemedText>
                </View>
            );
        }

        // Case 3: Query entered and results are available
        return (
            <FlashList
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                data={searchResults}
                keyExtractor={(item, index) => index.toString()}
                estimatedItemSize={50}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isFetchingNextPage ? (
                        <LottieView
                            source={require("../../assets/lottie/loader2.json")}
                            autoPlay
                            loop
                            style={{
                                alignSelf: "center",
                                width: SIZE(100),
                                height: SIZE(100),
                            }}
                        />
                    ) : null
                }
                renderItem={({ item }) => (
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        onPress={() => {
                            router.navigate({
                                pathname: "infopage",
                                params: {
                                    id: item.id,
                                },
                            });
                        }}
                        style={[styles.animeItem, { marginBottom: SIZE(16) }]}
                    >
                        <ImageBackground
                            style={[
                                styles.animeItem,
                                { backgroundColor: "rgba(0, 0, 0, 0.2)" },
                            ]}
                            source={{ uri: item.poster }}
                            resizeMode="cover"
                            blurRadius={10}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <View>
                                    <Image
                                        style={styles.animePoster}
                                        source={{
                                            uri: item.poster,
                                        }}
                                        resizeMode="cover"
                                    />
                                </View>
                                <View style={{ width: "64%" }}>
                                    <ThemedText
                                        numberOfLines={2}
                                        type="title"
                                        style={styles.animeName}
                                    >
                                        {item.name}
                                    </ThemedText>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            gap: SIZE(5),
                                            marginBottom: SIZE(5),
                                        }}
                                    >
                                        {item.type && (
                                            <ThemedText
                                                type="subtitle"
                                                style={[
                                                    styles.animeInfo,
                                                    {
                                                        padding: SIZE(5),
                                                        backgroundColor:
                                                            Colors.light
                                                                .tabIconSelected,
                                                        borderRadius: SIZE(6),
                                                    },
                                                ]}
                                            >
                                                {item.type}
                                            </ThemedText>
                                        )}
                                        {item.duration && (
                                            <ThemedText
                                                type="subtitle"
                                                style={[
                                                    styles.animeInfo,
                                                    {
                                                        padding: SIZE(5),
                                                        backgroundColor:
                                                            Colors.light
                                                                .tabIconSelected,
                                                        borderRadius: SIZE(6),
                                                    },
                                                ]}
                                            >
                                                {item.duration}
                                            </ThemedText>
                                        )}
                                        {item.rating && (
                                            <ThemedText
                                                type="subtitle"
                                                style={[
                                                    styles.animeInfo,
                                                    {
                                                        padding: SIZE(5),
                                                        backgroundColor:
                                                            Colors.light
                                                                .tabIconSelected,
                                                        borderRadius: SIZE(6),
                                                    },
                                                ]}
                                            >
                                                {item.rating}
                                            </ThemedText>
                                        )}
                                    </View>
                                    {item.episodes && (
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                gap: SIZE(5),
                                            }}
                                        >
                                            {item.episodes.dub && (
                                                <ThemedText
                                                    type="subtitle"
                                                    style={[
                                                        styles.animeInfo,
                                                        {
                                                            padding: SIZE(5),
                                                            backgroundColor:
                                                                Colors.light
                                                                    .tabIconSelected,
                                                            borderRadius:
                                                                SIZE(6),
                                                        },
                                                    ]}
                                                >
                                                    DUB : {item.episodes.dub}
                                                </ThemedText>
                                            )}
                                            {item.episodes.dub && (
                                                <ThemedText
                                                    type="subtitle"
                                                    style={[
                                                        styles.animeInfo,
                                                        {
                                                            padding: SIZE(5),
                                                            backgroundColor:
                                                                Colors.light
                                                                    .tabIconSelected,
                                                            borderRadius:
                                                                SIZE(6),
                                                        },
                                                    ]}
                                                >
                                                    SUB : {item.episodes.sub}
                                                </ThemedText>
                                            )}
                                            {item.episodes.raw && (
                                                <ThemedText
                                                    type="subtitle"
                                                    style={[
                                                        styles.animeInfo,
                                                        {
                                                            padding: SIZE(5),
                                                            backgroundColor:
                                                                Colors.light
                                                                    .tabIconSelected,
                                                            borderRadius:
                                                                SIZE(6),
                                                        },
                                                    ]}
                                                >
                                                    RAW : {item.episodes.raw}
                                                </ThemedText>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </ImageBackground>
                    </TouchableRipple>
                )}
            />
        );
    };

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: Colors.dark.background }}
        >
            <View style={styles.searchContainer}>
                <TextInput
                    autoFocus
                    contentStyle={{
                        fontFamily: "Exo2Medium",
                        fontSize: SIZE(14),
                    }}
                    mode="outlined"
                    label="Search for anime..."
                    placeholder="Search"
                    placeholderTextColor={Colors.light.tabIconSelected}
                    value={searchQuery}
                    onChangeText={(text) => handleSearch("search", text)}
                    outlineStyle={{
                        borderColor: Colors.light.tabIconSelected,
                        borderRadius: SIZE(8),
                        fontSize: SIZE(10),
                        borderWidth: SIZE(1),
                    }}
                    outlineColor={Colors.light.tabIconSelected}
                    textColor={Colors.light.tabIconSelected}
                    theme={{
                        colors: {
                            primary: Colors.light.tabIconSelected,
                            onSurfaceVariant: Colors.light.tabIconSelected,
                        },
                        fonts: {
                            bodyLarge: {
                                fontFamily: "Exo2Medium",
                                fontSize: SIZE(10),
                                paddingBottom: SIZE(5),
                            },
                        },
                    }}
                    left={
                        <TextInput.Icon
                            icon="magnify"
                            color={Colors.light.tabIconSelected}
                            size={SIZE(24)}
                        />
                    }
                    right={
                        searchLoading ? (
                            <TextInput.Icon
                                icon={() => (
                                    <LottieView
                                        source={require("../../assets/lottie/loader2.json")}
                                        autoPlay
                                        loop
                                        style={{
                                            alignSelf: "center",
                                            width: SIZE(50),
                                            height: SIZE(50),
                                            marginBottom: SIZE(10),
                                        }}
                                    />
                                )}
                            />
                        ) : (
                            <TextInput.Icon
                                icon="filter"
                                color={Colors.light.tabIconSelected}
                                onPress={() => setFilterModalVisible(true)}
                            />
                        )
                    }
                    style={{
                        height: SIZE(40),
                        backgroundColor: "transparent",
                    }}
                />
            </View>
            <AppliedFilters
                selectedCategory={selectedCategory}
                selectedGenre={selectedGenre}
                categories={categories}
                genres={genres}
                handleSelection={handleSelection}
                handleFilter={handleFilter}
                setSelectedCategory={setSelectedCategory}
                handleSearch={handleSearch}
                searchQuery={searchQuery}
            />
            {searchLoading ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <LottieView
                        source={require("../../assets/lottie/loader2.json")}
                        autoPlay
                        loop
                        style={{
                            width: SIZE(100),
                            height: SIZE(100),
                        }}
                    />
                </View>
            ) : (
                <View style={{ paddingHorizontal: SIZE(16), flex: 1 }}>
                    {renderSearchResults()}
                </View>
            )}
            <Modal
                isVisible={filterModalVisible}
                onBackdropPress={() => {
                    setFilterModalVisible(false);
                }}
                onBackButtonPress={() => {
                    setFilterModalVisible(false);
                }}
                useNativeDriverForBackdrop={true}
                useNativeDriver={false}
                animationIn={"fadeInUp"}
                animationOut={"fadeOutDown"}
                style={{
                    margin: 0,
                    justifyContent: "flex-end",
                }}
            >
                <View
                    style={{
                        backgroundColor: Colors.dark.background,
                        borderWidth: SIZE(1),
                        borderColor: Colors.light.tabIconSelected,
                        padding: SIZE(16),
                        borderTopEndRadius: SIZE(20),
                        borderTopStartRadius: SIZE(20),
                        flex: 0.6,
                    }}
                >
                    <ScrollView>
                        <FilterModal
                            categories={categories}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            genres={genres}
                            selectedGenre={selectedGenre}
                            setSelectedGenre={setSelectedGenre}
                            handleFilter={handleFilter}
                            handleSelection={handleSelection}
                        />
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default SearchPage;

const styles = StyleSheet.create({
    searchContainer: {
        paddingHorizontal: SIZE(16),
        marginBottom: SIZE(16),
    },
    sectionContainer: {
        marginBottom: SIZE(30),
        height: SIZE(180),
    },
    sectionTitle: {
        fontSize: SIZE(20),
        marginBottom: SIZE(10),
        color: Colors.light.tabIconSelected,
    },
    animeItem: {
        marginRight: SIZE(10),
        flexDirection: "row",
        borderRadius: SIZE(10),
        width: "100%",
        overflow: "hidden",
    },
    animePoster: {
        width: SIZE(120),
        height: SIZE(170),
        borderRadius: SIZE(10),
        marginRight: SIZE(10),
    },
    animeName: {
        marginBottom: SIZE(5),
        fontSize: SIZE(30),
        color: Colors.light.tabIconSelected,
        textShadowColor: Colors.dark.black,
        textShadowOffset: {
            width: 1,
            height: 1,
        },
        textShadowRadius: 2,
    },
    animeInfo: {
        fontSize: SIZE(12),
        color: Colors.light.white,
        textShadowColor: Colors.dark.black,
        textShadowOffset: {
            width: 1,
            height: 1,
        },
        textShadowRadius: 2,
        lineHeight: SIZE(13),
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    placeholderText: {
        marginTop: SIZE(10),
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(18),
    },
});
