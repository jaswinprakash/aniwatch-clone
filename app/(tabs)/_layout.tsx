import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FontAwesome5 } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import { BottomNavigation } from "react-native-paper";
import Profile from "./explore";
import HomeScreen from "./index";

const Tab = createBottomTabNavigator();

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                animation: "shift",
            }}
            tabBar={({ navigation, state, descriptors, insets }) => (
                <BottomNavigation.Bar
                    navigationState={state}
                    safeAreaInsets={insets}
                    activeColor={Colors[colorScheme ?? "light"].tint}
                    inactiveColor="#607d8b"
                    style={{
                        backgroundColor:
                            Colors[colorScheme ?? "light"].background,
                        height: SIZE(80),
                    }}
                    onTabPress={({ route, preventDefault }) => {
                        const event = navigation.emit({
                            type: "tabPress",
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (event.defaultPrevented) {
                            preventDefault();
                        } else {
                            navigation.dispatch({
                                ...CommonActions.navigate(
                                    route.name,
                                    route.params
                                ),
                                target: state.key,
                            });
                        }
                    }}
                    renderIcon={({ route, focused, color }) => {
                        const { options } = descriptors[route.key];
                        if (options.tabBarIcon) {
                            return options.tabBarIcon({
                                focused,
                                color,
                                size: SIZE(24),
                            });
                        }
                        return null;
                    }}
                    getLabelText={({ route }) => {
                        const { options } = descriptors[route.key];
                        return (
                            (options.tabBarLabel as string) ||
                            (options.title as string) ||
                            route.name
                        );
                    }}
                    shifting={true}
                    labeled={true}
                />
            )}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome5 name="home" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="History"
                component={Profile}
                options={{
                    tabBarLabel: "History",
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome5
                            name="history"
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
