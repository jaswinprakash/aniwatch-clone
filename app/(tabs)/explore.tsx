import React from "react";
import { StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";
import { useAnimeHistory } from "@/store/AnimeHistoryContext";
import LottieView from "lottie-react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import StoredVideos from "../_components/StoredVideos";
import GoogleSignInButton from "../../components//GoogleSignInButton";

const Profile = () => {
    const history = useAnimeHistory();
    const insets = useSafeAreaInsets();
    const tabBarHeight = SIZE(50) + insets.bottom;
    const renderItem = ({ item }) => (
        <StoredVideos
            id={item?.animeId}
            episode={item?.episodeNumber}
            time={item?.currentTime}
            name={item?.selectedEpisodeName}
        />
    );

    return (
        <SafeAreaView
            style={{
                backgroundColor: Colors.dark.background,
                flex: 1,
            }}
        >
            <ThemedView
                style={{
                    paddingHorizontal: SIZE(16),
                    height: SIZE(60),
                    justifyContent: "space-between",
                    backgroundColor: Colors.dark.background,
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <ThemedText
                    type="title"
                    style={{
                        color: Colors.light.tabIconSelected,
                        fontSize: SIZE(20),
                    }}
                >
                    Watch History
                </ThemedText>
                <View>
                    <GoogleSignInButton />
                </View>
            </ThemedView>
            <View style={{ height: "100%" }}>
                {!history?.length ? (
                    <View
                        style={{
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: Colors.dark.background,
                            height: "100%",
                        }}
                    >
                        <LottieView
                            source={require("../../assets/lottie/no-data.json")}
                            autoPlay
                            loop
                            style={{ width: SIZE(200), height: SIZE(200) }}
                        />
                    </View>
                ) : (
                    <FlashList
                        data={history}
                        renderItem={renderItem}
                        keyExtractor={(item) =>
                            `${item?.animeId}-${item?.episodeNumber}`
                        }
                        contentContainerStyle={{
                            paddingHorizontal: SIZE(16),
                            backgroundColor: Colors.dark.background,
                            // paddingBottom: tabBarHeight,
                        }}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={() => (
                            <View style={{ height: SIZE(15) }} />
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default Profile;

const styles = StyleSheet.create({});
