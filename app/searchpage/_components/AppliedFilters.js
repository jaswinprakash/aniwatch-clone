import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../../../components/ThemedText";
import { TouchableRipple } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../../constants/Colors";
import { SIZE } from "../../../constants/Constants";

const AppliedFilters = ({
    selectedCategory,
    selectedGenre,
    categories,
    genres,
    handleSelection,
    handleFilter,
    setSelectedCategory,
    handleSearch,
    searchQuery,
}) => {
    // If no filters are applied, don't render anything
    if (!selectedCategory && (!selectedGenre || selectedGenre.length === 0)) {
        return null;
    }

    // Find the category name for the selected category ID
    const categoryName = selectedCategory
        ? categories.find((cat) => cat.id === selectedCategory)?.name
        : null;

    // Get the genre names
    const genreItems = Array.isArray(selectedGenre) ? selectedGenre : [];

    const handleClearAll = () => {
        handleFilter("clear");
    };

    return (
        <View style={styles.container}>
            <View style={styles.filtersContainer}>
                {categoryName && (
                    <View style={styles.filterItem}>
                        <ThemedText type="subtitle" style={styles.filterText}>
                            {categoryName}
                        </ThemedText>
                        <TouchableRipple
                            style={styles.removeIcon}
                            onPress={() => {
                                setSelectedCategory("");
                                handleSearch("filter", searchQuery);
                            }}
                            borderless
                            rippleColor="rgba(140, 82, 255, 0.5)"
                        >
                            <MaterialIcons
                                name="close"
                                size={SIZE(16)}
                                color={Colors.light.tabIconSelected}
                            />
                        </TouchableRipple>
                    </View>
                )}

                {genreItems.map((genre) => (
                    <View key={genre} style={styles.filterItem}>
                        <ThemedText type="subtitle" style={styles.filterText}>
                            {genre}
                        </ThemedText>
                        <TouchableRipple
                            style={styles.removeIcon}
                            onPress={() => {
                                handleSelection("genre", genre);
                                handleSearch("filter", searchQuery);
                            }}
                            borderless
                            rippleColor="rgba(140, 82, 255, 0.5)"
                        >
                            <MaterialIcons
                                name="close"
                                size={SIZE(16)}
                                color={Colors.light.tabIconSelected}
                            />
                        </TouchableRipple>
                    </View>
                ))}
            </View>

            <TouchableRipple
                style={styles.clearAllButton}
                onPress={handleClearAll}
                borderless
                rippleColor="rgba(140, 82, 255, 0.5)"
            >
                <View style={styles.clearAllContent}>
                    <MaterialIcons
                        name="clear-all"
                        size={SIZE(16)}
                        color={Colors.light.tabIconSelected}
                    />
                    <ThemedText type="subtitle" style={styles.clearAllText}>
                        Clear All
                    </ThemedText>
                </View>
            </TouchableRipple>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SIZE(16),
        paddingVertical: SIZE(8),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: SIZE(0.5),
        borderBottomColor: Colors.light.tabIconSelected,
    },
    filtersContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        flex: 1,
        gap: SIZE(6),
    },
    filterItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(140, 82, 255, 0.3)",
        borderRadius: SIZE(6),
        paddingHorizontal: SIZE(8),
        paddingVertical: SIZE(4),
        marginBottom: SIZE(4),
    },
    filterText: {
        fontSize: SIZE(12),
        color: Colors.light.tabIconSelected,
        marginRight: SIZE(4),
    },
    removeIcon: {
        borderRadius: SIZE(12),
        padding: SIZE(2),
    },
    clearAllButton: {
        borderRadius: SIZE(6),
        padding: SIZE(4),
    },
    clearAllContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    clearAllText: {
        fontSize: SIZE(12),
        color: Colors.light.tabIconSelected,
        marginLeft: SIZE(2),
    },
});

export default AppliedFilters;
