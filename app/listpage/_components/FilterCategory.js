import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import { ThemedText } from "../../../components/ThemedText";
import { TouchableRipple } from "react-native-paper";
import { SIZE } from "../../../constants/Constants";
import { Colors } from "../../../constants/Colors";

const FilterCategory = ({ genres, selectedGenre, handleSelection }) => {
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
                                    borderless
                                    rippleColor={Colors.dark.backgroundPress}
                                    style={{
                                        backgroundColor: selectedGenre.includes(
                                            genre
                                        )
                                            ? Colors.dark.backgroundPress
                                            : "transparent",
                                        borderRadius: SIZE(8),
                                        padding: SIZE(8),
                                        borderWidth: SIZE(1),
                                        borderColor:
                                            Colors.light.tabIconSelected,
                                    }}
                                >
                                    <ThemedText
                                        style={{
                                            color: selectedGenre.includes(genre)
                                                ? Colors.light.white
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

export default FilterCategory;

const styles = StyleSheet.create({});
