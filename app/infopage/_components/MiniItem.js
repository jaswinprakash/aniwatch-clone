import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { ThemedText } from "../../../components/ThemedText";
import { Colors } from "../../../constants/Colors";
import { SIZE } from "../../../constants/Constants";

const MIniItem = ({ data }) => {
    return (
        <View
            style={{
                borderRadius: SIZE(5),
                borderWidth: SIZE(1),
                borderColor: Colors.light.tabIconSelected,
                height: SIZE(30),
                minWidth: SIZE(30),
                paddingHorizontal: SIZE(5),
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <ThemedText
                type="subtitle"
                style={{
                    fontSize: SIZE(12),
                    color: Colors.light.tabIconSelected,
                }}
            >
                {data}
            </ThemedText>
        </View>
    );
};

export default MIniItem;

const styles = StyleSheet.create({});
