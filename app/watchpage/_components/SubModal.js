import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import React from "react";
import { SIZE } from "../../../constants/Constants";
import { Colors } from "../../../constants/Colors";
import { ThemedText } from "../../../components/ThemedText";

const SubModal = ({ data, handleChange, handleSet, selectedItem, quality }) => {
    return (
        <View style={[styles.modalContainer]}>
            <FlatList
                data={data}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.subtitleItem,
                            {
                                backgroundColor: (
                                    !quality
                                        ? selectedItem?.label === item.label
                                        : selectedItem === item
                                )
                                    ? Colors.light.tabIconSelected
                                    : "transparent",
                            },
                        ]}
                        onPress={() => handleChange(item)} // Pass the item to handleChange
                    >
                        <ThemedText
                            type="default"
                            style={[
                                styles.subtitleText,
                                {
                                    color: (
                                        !quality
                                            ? selectedItem?.label === item.label
                                            : selectedItem === item
                                    )
                                        ? "#fff"
                                        : Colors.light.tabIconSelected,
                                },
                            ]}
                        >
                            {quality ? item : item.label}
                        </ThemedText>
                    </TouchableOpacity>
                )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={handleSet}>
                <ThemedText type="default" style={styles.closeButtonText}>
                    Close
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
};

export default SubModal;

const styles = StyleSheet.create({
    modalContainer: {
        width: SIZE(150),
        maxHeight: SIZE(200),
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        position: "absolute",
        top: SIZE(15),
        bottom: 0,
        right: SIZE(80),
        zIndex: 2000,
        borderRadius: SIZE(10),
    },
    subtitleItem: {
        padding: SIZE(10),
        borderBottomWidth: SIZE(1),
        borderBottomColor: "#444",
        borderRadius: SIZE(8),
    },
    subtitleText: {
        fontSize: SIZE(16),
        backgroundColor: "transparent",
        color: Colors.light.tabIconSelected,
    },
    closeButton: {
        marginVertical: SIZE(10),
        padding: SIZE(5),
        backgroundColor: Colors.light.tabIconSelected,
        borderRadius: SIZE(8),
        alignItems: "center",
        marginHorizontal: SIZE(10),
    },
    closeButtonText: {
        color: "#FFFFFF",
        fontSize: SIZE(16),
    },
});
