import React from "react";
import {
    Animated,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { Colors } from "../constants/Colors";
import { SIZE } from "../constants/Constants";

const CustomSwitch = ({ value, onValueChange }) => {
    const trackColor = {
        false: "#f44336",
        true: "#3AFF6F",
    };
    const thumbColor = value ? Colors.light.tabIconSelected : "#fff";
    const iosBackgroundColor = "#3e3e3e";

    const [animatedValue] = React.useState(new Animated.Value(value ? 1 : 0));

    React.useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const thumbPosition = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [SIZE(1), SIZE(19)],
    });

    const trackWidth = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [SIZE(40), SIZE(40)],
    });

    const trackBackgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [iosBackgroundColor, trackColor.true],
    });

    return (
        <TouchableWithoutFeedback onPress={() => onValueChange(!value)}>
            <View style={styles.container}>
                <Animated.View
                    style={[
                        styles.track,
                        {
                            width: trackWidth,
                            backgroundColor: trackBackgroundColor,
                        },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.thumb,
                            {
                                backgroundColor: thumbColor,
                                transform: [{ translateX: thumbPosition }],
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
        height: SIZE(24),
        width: SIZE(40),
        justifyContent: "center",
        alignItems: "center",
    },
    track: {
        height: SIZE(20),
        borderRadius: SIZE(10),
        backgroundColor: "#3e3e3e",
    },
    thumb: {
        position: "absolute",
        width: SIZE(18),
        height: SIZE(18),
        borderRadius: SIZE(9),
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: SIZE(1) },
        shadowOpacity: 0.2,
        shadowRadius: SIZE(1.5),
        elevation: 2,
        top: SIZE(1),
    },
});

export default CustomSwitch;