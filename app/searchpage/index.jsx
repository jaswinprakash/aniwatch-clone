import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { apiConfig } from "../../AxiosConfig";
import { SIZE } from "../../constants/Constants";
import { Colors } from "../../constants/Colors";
import {
    ActivityIndicator,
    TextInput,
    TouchableRipple,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { FlashList } from "@shopify/flash-list";
import FastImage from "@d11/react-native-fast-image";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const handleSearch = async (query) => {
        setSearchLoading(true);
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const response = await apiConfig.get(
                    `/api/v2/hianime/search/suggestion?q=${query}`
                );
                setSearchResults(response.data.data.suggestions);
            } catch (error) {
                console.log(error, "axios error");
            } finally {
                setSearchLoading(false);
            }
        } else {
            setSearchResults([]);
            setSearchLoading(false);
        }
    };

    const renderSearchResults = () => {
        if (searchResults.length === 0) return null;

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
                                pathname: "watchpage",
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
                                <ThemedText
                                    type="subtitle"
                                    style={styles.animeInfo}
                                >
                                    {item.moreInfo.join(" • ")}
                                </ThemedText>
                            </View>
                        </View>
                    </TouchableRipple>
                )}
            />
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#151718" }}>
            <View style={styles.searchContainer}>
                <TextInput
                    contentStyle={{
                        fontFamily: "Exo2Medium",
                        fontSize: SIZE(14),
                    }}
                    mode="outlined"
                    label="Search for anime..."
                    placeholder="Search"
                    placeholderTextColor={Colors.light.tabIconSelected}
                    value={searchQuery}
                    onChangeText={handleSearch}
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
                        ) : null
                    }
                    style={{
                        height: SIZE(40),
                        backgroundColor: "transparent",
                    }}
                />
            </View>
            <View style={{ padding: SIZE(16), flex: 1 }}>
                {searchQuery && renderSearchResults()}
            </View>
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
        width: SIZE(100),
        height: SIZE(150),
        borderRadius: SIZE(10),
        marginRight: SIZE(10),
    },
    animeName: {
        marginTop: SIZE(5),
        fontSize: SIZE(20),
        color: Colors.light.tabIconSelected,
    },
    animeInfo: {
        fontSize: SIZE(12),
        color: "#666",
    },
});
