import { createMaterialBottomTabNavigator } from "react-native-paper/react-navigation";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import { SIZE } from "@/constants/Constants";
import HomeScreen from "./index"; // Create or import HomeScreen
import Profile from "./explore"; // Create or import Profile
import { FontAwesome5 } from "@expo/vector-icons";

const MaterialTabs = createMaterialBottomTabNavigator();

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <MaterialTabs.Navigator
            sceneAnimationEnabled={true}
            sceneAnimationType="shifting"
            activeColor={Colors[colorScheme ?? "light"].tint}
            inactiveColor="#9BA1A6"
            barStyle={{
                backgroundColor: Colors[colorScheme ?? "light"].background,
                height: SIZE(65),
            }}
            screenOptions={{ headerShown: false }} // Hide the header
        >
            <MaterialTabs.Screen
                name="Home"
                component={HomeScreen} // Use your screen component instead of Tabs
                options={{
                    tabBarLabel: "Home",
                    tabBarIcon: ({ color }) => (
                        <FontAwesome5
                            size={SIZE(24)}
                            name="home"
                            color={color}
                        />
                    ),
                }}
            />
            <MaterialTabs.Screen
                name="History"
                component={Profile} // Use your screen component instead of Tabs
                options={{
                    tabBarLabel: "History",
                    tabBarIcon: ({ color }) => (
                        <FontAwesome5
                            size={SIZE(24)}
                            name="history"
                            color={color}
                        />
                    ),
                }}
            />
        </MaterialTabs.Navigator>
    );
}
