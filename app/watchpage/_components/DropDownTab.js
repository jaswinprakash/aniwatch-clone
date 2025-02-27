import { StyleSheet } from "react-native";
import React from "react";
import { TouchableRipple } from "react-native-paper";
import { Colors } from "../../../constants/Colors";
import { SIZE } from "../../../constants/Constants";
import { ThemedText } from "../../../components/ThemedText";

const DropDownTab = ({ item, activeSubTab, setActiveSubTab }) => {
    return (
        <>
            <TouchableRipple
                rippleColor="rgba(140, 82, 255, 0.5)"
                borderless={true}
                style={[
                    styles.subTabButton,
                    activeSubTab === item?.serverName && styles.activeSubTab,
                ]}
                onPress={() => setActiveSubTab(item?.serverName)}
            >
                <ThemedText
                    style={[
                        styles.subTabText,
                        activeSubTab === item?.serverName &&
                            styles.activeSubText,
                    ]}
                >
                    {item?.serverName}
                </ThemedText>
            </TouchableRipple>
        </>
    );
};

export default DropDownTab;

const styles = StyleSheet.create({
    subTabButton: {
        padding: SIZE(8),
        borderWidth: SIZE(1),
        borderRadius: SIZE(6),
        borderColor: Colors.light.tabIconSelected,
    },
    activeSubTab: { backgroundColor: Colors.light.tabIconSelected },
    subTabText: { fontSize: SIZE(16), color: Colors.light.tabIconSelected },
    activeSubText: { color: "#fff" },
});
