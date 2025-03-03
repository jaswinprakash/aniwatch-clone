import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import { ThemedText } from "../../../components/ThemedText";
import { TouchableRipple } from "react-native-paper";
import { SIZE } from "../../../constants/Constants";
import { Colors } from "../../../constants/Colors";

const FilterModal = ({
    categories,
    selectedCategory,
    genres,
    selectedGenre,
    handleSelection,
}) => {
    return (
        <View>
            <View style={{ gap: SIZE(20) }}>
                <View>
                    <ThemedText
                        type="subtitle"
                        style={{
                            color: Colors.light.tabIconSelected,
                            marginBottom: SIZE(10),
                        }}
                    >
                        Categories:
                    </ThemedText>
                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: SIZE(10),
                        }}
                    >
                        {categories?.map((category, index) => (
                            <View key={index}>
                                <TouchableRipple
                                    onPress={() =>
                                        handleSelection("category", category.id)
                                    }
                                    style={{
                                        backgroundColor:
                                            selectedCategory === category.id
                                                ? "rgba(140, 82, 255, 0.5)"
                                                : "transparent",
                                        borderRadius: SIZE(10),
                                        padding: SIZE(10),
                                        borderWidth: SIZE(1),
                                        borderColor:
                                            Colors.light.tabIconSelected,
                                    }}
                                >
                                    <ThemedText
                                        style={{
                                            color:
                                                selectedCategory === category.id
                                                    ? "#fff"
                                                    : Colors.light
                                                          .tabIconSelected,
                                        }}
                                    >
                                        {category.name}
                                    </ThemedText>
                                </TouchableRipple>
                            </View>
                        ))}
                    </View>
                </View>
                <View>
                    <ThemedText
                        type="subtitle"
                        style={{
                            color: Colors.light.tabIconSelected,
                            marginBottom: SIZE(10),
                        }}
                    >
                        Genres:
                    </ThemedText>
                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: SIZE(10),
                        }}
                    >
                        {genres?.map((genre, index) => (
                            <View key={index}>
                                <TouchableRipple
                                    onPress={() =>
                                        handleSelection("genre", genre)
                                    }
                                    style={{
                                        backgroundColor: selectedGenre.includes(
                                            genre
                                        )
                                            ? "rgba(140, 82, 255, 0.5)"
                                            : "transparent",
                                        borderRadius: SIZE(10),
                                        padding: SIZE(10),
                                        borderWidth: SIZE(1),
                                        borderColor:
                                            Colors.light.tabIconSelected,
                                    }}
                                >
                                    <ThemedText
                                        style={{
                                            color: selectedGenre.includes(genre)
                                                ? "#fff"
                                                : Colors.light.tabIconSelected,
                                        }}
                                    >
                                        {genre}
                                    </ThemedText>
                                </TouchableRipple>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
};

export default FilterModal;

const styles = StyleSheet.create({});
