import { StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withDelay,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

export enum ANIMATION_DIRECTION {
    leftToRight = "leftToRight",
    rightToLeft = "rightToLeft",
    topToBottom = "topToBottom",
    bottomToTop = "bottomToTop",
}

export enum ANIMATION_TYPE {
    shiver = "shiver",
    pulse = "pulse",
}

export const SkeletonLoader = ({
    height,
    width,
    style = {},
    backgroundColor = "#DDEAF5",
    direction = ANIMATION_DIRECTION.leftToRight,
    animationType = ANIMATION_TYPE.shiver,
}) => {
    const isXDirectionAnimation =
        direction === ANIMATION_DIRECTION.leftToRight ||
        direction === ANIMATION_DIRECTION.rightToLeft;

    //to move the gradient view across x direction
    const translatex = useSharedValue(0);

    //track dimensions of parent view for deciding movable boundaries
    const [parentDimensions, setParentDimensions] = useState({
        height: -1,
        width: -1,
    });

    //to toggle between different direction of move
    const [coordinates, setCoordinates] = useState({
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
    });

    //track dimensions of child (gradient view) for deciding movable boundaries
    const [gradientDimensions, setGradientDimensions] = useState({
        height: -1,
        width: -1,
    });

    const animatedStyleX = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: translatex.value,
                },
            ],
        };
    });

    useEffect(() => {
        return () => {
            //cancel running animations after component unmounts
            cancelAnimation(translatex);
        };
    }, []);

    useEffect(() => {
        if (!direction) return;
        switch (direction) {
            case ANIMATION_DIRECTION.leftToRight:
                setCoordinates({
                    start: { x: 0, y: 0 },
                    end: { x: 1, y: 0 },
                });
                break;
            case ANIMATION_DIRECTION.rightToLeft:
                setCoordinates({
                    start: { x: 1, y: 0 },
                    end: { x: 0, y: 0 },
                });
                break;
            case ANIMATION_DIRECTION.topToBottom:
                setCoordinates({
                    start: { x: 0, y: 0 },
                    end: { x: 0, y: 1 },
                });
                break;
            case ANIMATION_DIRECTION.bottomToTop:
                setCoordinates({
                    start: { x: 0, y: 1 },
                    end: { x: 0, y: 0 },
                });
                break;
            default:
                break;
        }
    }, [direction]);

    const animateAcrossXDirection = () => {
        const overflowOffset = parentDimensions.width * 0.75;
        const leftMostEnd = -overflowOffset;
        const rightMostEnd =
            parentDimensions.width - gradientDimensions.width + overflowOffset;

        translatex.value =
            direction === ANIMATION_DIRECTION.leftToRight
                ? leftMostEnd
                : rightMostEnd;

        translatex.value = withRepeat(
            withTiming(
                direction === ANIMATION_DIRECTION.leftToRight
                    ? rightMostEnd
                    : leftMostEnd,
                {
                    duration: 1000,
                    easing: Easing.linear,
                }
            ),
            -1 // Infinite repetition
        );
    };

    useEffect(() => {
        if (
            parentDimensions.height !== -1 &&
            parentDimensions.width !== -1 &&
            gradientDimensions.height !== -1 &&
            gradientDimensions.width !== -1 &&
            direction
        ) {
            if (isXDirectionAnimation) {
                animateAcrossXDirection();
            }
        }
    }, [
        parentDimensions,
        gradientDimensions,
        direction,
        isXDirectionAnimation,
    ]);

    return (
        <Animated.View
            style={[
                { height, width, backgroundColor },
                style,
                styles.itemParent,
            ]}
            onLayout={(event) => {
                if (
                    parentDimensions.height === -1 &&
                    parentDimensions.width === -1 &&
                    animationType === ANIMATION_TYPE.shiver
                ) {
                    //only in case of shiver animation, find out the width and height of parent container.
                    setParentDimensions({
                        width: event.nativeEvent.layout.width,
                        height: event.nativeEvent.layout.height,
                    });
                }
            }}
        >
            {animationType === ANIMATION_TYPE.shiver ? (
                <Animated.View
                    style={[
                        isXDirectionAnimation && {
                            height: "100%",
                            width: "80%",
                        },
                        isXDirectionAnimation && animatedStyleX,
                    ]}
                    onLayout={(event) => {
                        if (
                            gradientDimensions.width === -1 &&
                            gradientDimensions.height === -1
                        ) {
                            setGradientDimensions({
                                width: event.nativeEvent.layout.width,
                                height: event.nativeEvent.layout.height,
                            });
                        }
                    }}
                >
                    <LinearGradient
                        colors={[
                            "rgba(0, 87, 255,0)",
                            "rgba(0, 87, 255,0.1)",
                            "rgba(0, 87, 255,0.4)",
                            "rgba(0, 87, 255,0.6)",
                            "rgba(0, 87, 255,0.7)",
                            "rgba(0, 87, 255,0.6)",
                            "rgba(0, 87, 255,0.4)",
                            "rgba(0, 87, 255,0.1)",
                            "rgba(0, 87, 255,0)",
                        ]}
                        style={styles.background}
                        start={coordinates.start}
                        end={coordinates.end}
                    />
                </Animated.View>
            ) : null}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    itemParent: {
        overflow: "hidden",
    },
    background: {
        height: "100%",
        width: "100%",
    },
});
