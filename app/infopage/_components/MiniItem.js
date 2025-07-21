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
                backgroundColor: Colors.light.tabIconSelected,
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
                    color: Colors.light.white,
                    textShadowColor: Colors.dark.black,
                    textShadowOffset: {
                        width: 1,
                        height: 1,
                    },
                    textShadowRadius: 2,
                    lineHeight: SIZE(13),
                }}
            >
                {data}
            </ThemedText>
        </View>
    );
};

export default React.memo(MIniItem);

const styles = StyleSheet.create({});
