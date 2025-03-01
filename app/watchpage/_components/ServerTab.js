import { StyleSheet, View } from "react-native";
import React from "react";
import { ThemedText } from "../../../components/ThemedText";
import { Colors } from "../../../constants/Colors";
import { SIZE } from "../../../constants/Constants";
import { TouchableRipple } from "react-native-paper";

const ServerTab = ({ activeTab, setActiveTab, servers }) => {
    return (
        <View style={styles.tabContainer}>
            {servers?.sub?.length > 0 && (
                <TouchableRipple
                    rippleColor="rgba(140, 82, 255, 0.5)"
                    borderless={true}
                    style={[
                        styles.tabButton,
                        activeTab === "sub" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("sub")}
                >
                    <ThemedText
                        style={[
                            styles.tabText,
                            activeTab === "sub" && styles.activeText,
                        ]}
                    >
                        SUB
                    </ThemedText>
                </TouchableRipple>
            )}
            {servers?.dub?.length > 0 && (
                <TouchableRipple
                    rippleColor="rgba(140, 82, 255, 0.5)"
                    borderless={true}
                    style={[
                        styles.tabButton,
                        activeTab === "dub" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("dub")}
                >
                    <ThemedText
                        style={[
                            styles.tabText,
                            activeTab === "dub" && styles.activeText,
                        ]}
                    >
                        DUB
                    </ThemedText>
                </TouchableRipple>
            )}
            {servers?.raw?.length > 0 && (
                <TouchableRipple
                    rippleColor="rgba(140, 82, 255, 0.5)"
                    borderless={true}
                    style={[
                        styles.tabButton,
                        activeTab === "raw" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("raw")}
                >
                    <ThemedText
                        style={[
                            styles.tabText,
                            activeTab === "raw" && styles.activeText,
                        ]}
                    >
                        Raw
                    </ThemedText>
                </TouchableRipple>
            )}
        </View>
    );
};

export default ServerTab;

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: SIZE(10),
    },
    tabButton: {
        padding: SIZE(10),
        flex: 1,
        alignItems: "center",
        borderBottomWidth: SIZE(2),
        borderColor: "transparent",
    },
    activeTab: { borderColor: Colors.light.tabIconSelected },
    tabText: { fontSize: SIZE(18), color: "#333" },
    activeText: { color: Colors.light.tabIconSelected },
});
