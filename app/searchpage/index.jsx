import { ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { apiConfig } from "../../AxiosConfig";
import { SIZE, SIZES } from "../../constants/Constants";
import { Colors } from "../../constants/Colors";
import {
    ActivityIndicator,
    TextInput,
    TouchableRipple,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../components/ThemedText";
import { FlashList } from "@shopify/flash-list";
import FastImage from "@d11/react-native-fast-image";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import FilterModal from "./_components/FilterModal";
import Modal from "react-native-modal";
import AppliedFilters from "./_components/AppliedFilters";
import LottieView from "lottie-react-native";

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

    useEffect(() => {
        const performSearch = async () => {
            setSearchLoading(true);
            if (searchQuery) {
                const formattedGenres =
                    Array.isArray(selectedGenre) && selectedGenre.length > 0
                        ? selectedGenre
                              .map((genre) =>
                                  genre.toLowerCase().replace(/\s+/g, "-")
                              )
                              .join(",")
                        : "";

                try {
                    const response = await apiConfig.get(
                        `/api/v2/hianime/search?q=${searchQuery}&type=${selectedCategory}&genres=${formattedGenres}`
                    );
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
        };

        performSearch();
    }, [searchQuery, selectedGenre, selectedCategory]);

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
                showsVerticalScrollIndicator={false}
                data={searchResults}
                keyExtractor={(item, index) => index.toString()}
                estimatedItemSize={50}
                renderItem={({ item }) => (
                    <TouchableRipple
                        rippleColor="rgba(140, 82, 255, 0.5)"
                        borderless={true}
                        onPress={() => {
                            router.push({
                                pathname: "infopage",
                                params: {
                                    id: item.id,
                                },
                            });
                        }}
                        style={styles.animeItem}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <View>
                                <FastImage
                                    source={{
                                        uri: item.poster,
                                        priority: FastImage.priority.normal,
                                    }}
                                    style={styles.animePoster}
                                />
                            </View>
                            <View style={{ width: "70%" }}>
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
                                                    borderWidth: SIZE(1),
                                                    borderColor:
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
                                                    borderWidth: SIZE(1),
                                                    borderColor:
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
                                                    borderWidth: SIZE(1),
                                                    borderColor:
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
                                                        borderWidth: SIZE(1),
                                                        borderColor:
                                                            Colors.light
                                                                .tabIconSelected,
                                                        borderRadius: SIZE(6),
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
                                                        borderWidth: SIZE(1),
                                                        borderColor:
                                                            Colors.light
                                                                .tabIconSelected,
                                                        borderRadius: SIZE(6),
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
                                                        borderWidth: SIZE(1),
                                                        borderColor:
                                                            Colors.light
                                                                .tabIconSelected,
                                                        borderRadius: SIZE(6),
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
                        borderRadius: SIZE(10),
                        fontSize: SIZE(10),
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
                                    <ActivityIndicator
                                        size="small"
                                        color={Colors.light.tabIconSelected}
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
                        borderWidth: 1,
                        alignItems: "center",
                    }}
                >
                    <LottieView
                        source={require("../../assets/lottie/loader-3.json")}
                        autoPlay
                        loop
                        style={{
                            width: SIZE(200),
                            height: SIZE(200),
                        }}
                    />
                </View>
            ) : (
                <View style={{ padding: SIZE(16), flex: 1 }}>
                    {renderSearchResults()}
                </View>
            )}
            <Modal
                isVisible={filterModalVisible}
                onBackdropPress={() => {
                    setFilterModalVisible(false);
                    // handleFilter("clear");
                }}
                onBackButtonPress={() => {
                    setFilterModalVisible(false);
                    // handleFilter("clear");
                }}
                propagateSwipe={true}
                useNativeDriverForBackdrop={true}
                useNativeDriver={false}
                animationIn={"slideInUp"}
                animationOut={"slideOutDown"}
                animationInTiming={500}
                animationOutTiming={500}
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
                    {/* <View
                        style={{
                            flexDirection: "row",
                            gap: SIZE(10),
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: SIZE(14),
                        }}
                    >
                        <TouchableRipple
                            onPress={() => handleFilter("clear")}
                            style={{
                                backgroundColor: "rgba(140, 82, 255, 0.5)",
                                borderRadius: SIZE(10),
                                padding: SIZE(10),
                            }}
                        >
                            <ThemedText
                                style={{ fontSize: SIZE(14) }}
                                type="subtitle"
                            >
                                Clear Filters
                            </ThemedText>
                        </TouchableRipple>
                        <TouchableRipple
                            onPress={() => handleFilter("apply")}
                            style={{
                                backgroundColor: "rgba(140, 82, 255, 0.5)",
                                borderRadius: SIZE(10),
                                padding: SIZE(10),
                            }}
                        >
                            <ThemedText
                                style={{ fontSize: SIZE(14) }}
                                type="subtitle"
                            >
                                Apply Filters
                            </ThemedText>
                        </TouchableRipple>
                    </View> */}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default SearchPage;

const styles = StyleSheet.create({
    searchContainer: {
        paddingHorizontal: SIZE(16),
        paddingBottom: SIZE(11),
        borderBottomWidth: SIZE(0.5),
        borderBottomColor: Colors.light.tabIconSelected,
    },
    sectionContainer: {
        marginBottom: SIZE(30),
        height: SIZE(200),
    },
    sectionTitle: {
        fontSize: SIZE(20),
        marginBottom: SIZE(10),
        color: Colors.light.tabIconSelected,
    },
    animeItem: {
        marginRight: SIZE(10),
        flexDirection: "row",
        borderWidth: SIZE(1),
        borderColor: Colors.light.tabIconSelected,
        borderRadius: SIZE(10),
        marginBottom: SIZE(16),
        width: "100%",
    },
    animePoster: {
        width: SIZE(100),
        height: SIZE(150),
        borderRadius: SIZE(10),
        marginRight: SIZE(10),
    },
    animeName: {
        marginBottom: SIZE(5),
        fontSize: SIZE(20),
        color: Colors.light.tabIconSelected,
    },
    animeInfo: {
        fontSize: SIZE(12),
        color: Colors.light.tabIconSelected,
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
