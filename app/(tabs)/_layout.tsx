// import { Tabs } from "expo-router";
// import { BlurView } from "expo-blur";
// import { StyleSheet } from "react-native";
// import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// import { useColorScheme } from "@/hooks/useColorScheme";
// import { Colors } from "@/constants/Colors";
// import { SIZE } from "@/constants/Constants";

// export default function TabLayout() {
//     const colorScheme = useColorScheme();

//     return (
//         <Tabs
//             screenOptions={{
//                 // animation:"fade",
//                 headerShown: false,
//                 tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
//                 tabBarStyle: {
//                     position: "absolute",
//                     backgroundColor: "transparent",
//                     borderTopWidth: 0,
//                     elevation: 0,
//                     paddingTop: SIZE(5),
//                 },
//                 tabBarLabelStyle: {
//                     fontFamily: "Exo2Bold",
//                     fontSize: SIZE(14),
//                 },

//                 tabBarBackground: () => (
//                     <BlurView
//                         experimentalBlurMethod="dimezisBlurView"
//                         intensity={20}
//                         tint="dark"
//                         style={StyleSheet.absoluteFill}
//                     />
//                 ),
//             }}
//         >
//             <Tabs.Screen
//                 name="index"
//                 options={{
//                     title: "Home",
//                     tabBarIcon: ({ color, focused }) => (
//                         <Ionicons name={"home"} size={SIZE(28)} color={color} />
//                     ),
//                 }}
//             />
//             <Tabs.Screen
//                 name="explore"
//                 options={{
//                     title: "History",
//                     tabBarIcon: ({ color, focused }) => (
//                         <MaterialIcons
//                             name="watch-later"
//                             size={SIZE(28)}
//                             color={color}
//                         />
//                     ),
//                 }}
//             />
//         </Tabs>
//     );
// }

import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
} from "react-native-reanimated";
import { useEffect } from "react";
import Profile from "./explore";
import HomeScreen from "./index";

const Tab = createBottomTabNavigator();

const AnimatedTabButton = ({ route, isFocused, onPress, colorScheme }) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(isFocused ? 1.1 : 1, {
            damping: 15,
            stiffness: 150,
        });

        translateY.value = withSpring(isFocused ? -SIZE(4) : 0, {
            damping: 15,
            stiffness: 150,
        });

        opacity.value = withSpring(isFocused ? 1 : 0, {
            damping: 15,
            stiffness: 150,
        });
    }, [isFocused]);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { translateY: translateY.value }],
    }));

    const animatedLabelStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            {
                scale: interpolate(opacity.value, [0, 1], [0.8, 1]),
            },
        ],
    }));

    let iconName;
    let IconComponent;
    if (route.name === "Home") {
        iconName = "home";
        IconComponent = Ionicons;
    } else if (route.name === "History") {
        iconName = "history";
        IconComponent = MaterialIcons;
    }

    const label = route.name === "History" ? "History" : "Home";

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{ flex: 1, alignItems: "center" }}
        >
            <Animated.View
                style={[
                    {
                        alignItems: "center",
                        paddingVertical: SIZE(8),
                    },
                    animatedIconStyle,
                ]}
            >
                <IconComponent
                    name={iconName}
                    size={SIZE(22)}
                    color={
                        isFocused
                            ? Colors[colorScheme ?? "light"].tint
                            : "rgba(0, 187, 255, 0.5)"
                    }
                />
                <Animated.Text
                    style={[
                        {
                            fontSize: SIZE(10),
                            color: Colors[colorScheme ?? "light"].tint,
                            fontFamily: "Exo2Bold",
                            marginTop: SIZE(2),
                        },
                        animatedLabelStyle,
                    ]}
                >
                    {label}
                </Animated.Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const colorScheme = useColorScheme();

    return (
        <View
            style={{
                flexDirection: "row",
                height: SIZE(70),
                backgroundColor: Colors[colorScheme ?? "light"].background,
                paddingTop: SIZE(10),
            }}
        >
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                return (
                    <AnimatedTabButton
                        key={route.key}
                        route={route}
                        isFocused={isFocused}
                        onPress={onPress}
                        colorScheme={colorScheme}
                    />
                );
            })}
        </View>
    );
};

export default function TabLayout() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                // animation: "shift",
            }}
            tabBar={(props) => <CustomTabBar {...props} />}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: "Home",
                }}
            />
            <Tab.Screen
                name="History"
                component={Profile}
                options={{
                    tabBarLabel: "History",
                }}
            />
        </Tab.Navigator>
    );
}
