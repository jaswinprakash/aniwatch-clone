import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";

import StoredVideos from "./_components/StoredVideos";
import Constants from "expo-constants";
import { getAnimeHistory } from "@/store/storage";
import { useFocusEffect } from "expo-router";
import { SIZE } from "@/constants/Constants";
const Profile = () => {
    const [history, setHistory] = useState([]);

    useFocusEffect(
        React.useCallback(() => {
            const fetchHistory = async () => {
                const animeHistory = await getAnimeHistory();
                setHistory(animeHistory);
            };

            fetchHistory();

            return () => {};
        }, [])
    );

    return (
        <ScrollView
            style={{
                flex: 1,
                paddingTop: Constants.statusBarHeight,
            }}
        >
            <View style={{ padding: SIZE(16), gap: SIZE(10) }}>
                {history?.map((item, index) => (
                    <StoredVideos
                        key={index}
                        id={item?.animeId}
                        episode={item?.episodeNumber}
                        time={item?.currentTime}
                    />
                ))}
            </View>
        </ScrollView>
    );
};

export default Profile;

const styles = StyleSheet.create({});
