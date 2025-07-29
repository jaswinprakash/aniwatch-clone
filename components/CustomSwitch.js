import React from "react";
import { StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { Colors } from "../constants/Colors";
import { SIZE } from "../constants/Constants";

const CustomSwitch = ({ value, onValueChange }) => {
    const trackColor = {
        false: "#f44336",
        true: "#3AFF6F",
    };
    const thumbColor = value ? Colors.light.tabIconSelected : "#fff";
    const iosBackgroundColor = Colors.dark.backgroundPress;

    // Pre-calculate all SIZE values
    const sizeValues = {
        trackWidth: SIZE(40),
        thumbSize: SIZE(18),
        thumbRadius: SIZE(9),
        thumbStart: SIZE(1),
        thumbEnd: SIZE(19),
        trackHeight: SIZE(20),
        trackRadius: SIZE(10),
        containerHeight: SIZE(24),
        shadowOffset: SIZE(1),
        shadowRadius: SIZE(1.5),
        thumbTop: SIZE(1),
    };

    const progress = useSharedValue(value ? 1 : 0);

    React.useEffect(() => {
        progress.value = withTiming(value ? 1 : 0, { duration: 200 });
    }, [value, progress]);

    const thumbStyle = useAnimatedStyle(() => {
        "worklet";
        return {
            transform: [
                {
                    translateX:
                        sizeValues.thumbStart +
                        progress.value *
                            (sizeValues.thumbEnd - sizeValues.thumbStart),
                },
            ],
            backgroundColor: thumbColor,
        };
    });

    const trackStyle = useAnimatedStyle(() => {
        "worklet";
        return {
            width: sizeValues.trackWidth,
            height: sizeValues.trackHeight,
            borderRadius: sizeValues.trackRadius,
            backgroundColor: interpolateColor(
                progress.value,
                [0, 1],
                [iosBackgroundColor, trackColor.true]
            ),
        };
    });

    return (
        <TouchableWithoutFeedback onPress={() => onValueChange(!value)}>
            <View
                style={[
                    styles.container,
                    {
                        height: sizeValues.containerHeight,
                        width: sizeValues.trackWidth,
                    },
                ]}
            >
                <Animated.View style={[styles.track, trackStyle]}>
                    <Animated.View
                        style={[
                            styles.thumb,
                            thumbStyle,
                            {
                                width: sizeValues.thumbSize,
                                height: sizeValues.thumbSize,
                                borderRadius: sizeValues.thumbRadius,
                                top: sizeValues.thumbTop,
                            },
                        ]}
                    />
                </Animated.View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
    },
    track: {
        // Dimensions moved to animated style
    },
    thumb: {
        position: "absolute",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        elevation: 2,
    },
});

export default CustomSwitch;
