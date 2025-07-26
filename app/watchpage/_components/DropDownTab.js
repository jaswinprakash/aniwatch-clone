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
                rippleColor={Colors.dark.backgroundPress}
                borderless={true}
                style={[
                    styles.subTabButton,
                    activeSubTab === item?.serverName && styles.activeSubTab,
                ]}
                onPress={() => setActiveSubTab(item?.serverName)}
            >
                <ThemedText
                    type="subtitle"
                    style={[
                        styles.subTabText,
                        activeSubTab === item?.serverName &&
                            styles.activeSubText,
                    ]}
                >
                    {item?.serverName?.toUpperCase()}
                </ThemedText>
            </TouchableRipple>
        </>
    );
};

export default  React.memo(DropDownTab);

const styles = StyleSheet.create({
    subTabButton: {
        padding: SIZE(8),
        borderWidth: SIZE(1),
        borderRadius: SIZE(6),
        borderColor: Colors.light.tabIconSelected,
    },
    activeSubTab: { backgroundColor: Colors.light.tabIconSelected },
    subTabText: { fontSize: SIZE(16), color: Colors.light.tabIconSelected },
    activeSubText: {
        color: Colors.light.white,
        textShadowColor: Colors.dark.black,
        textShadowOffset: {
            width: 1,
            height: 1,
        },
        textShadowRadius: 2,
    },
});
