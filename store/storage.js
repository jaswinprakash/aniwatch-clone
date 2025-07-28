// storage.js
import { MMKV } from "react-native-mmkv";

export const storage = new MMKV();

// Helper functions
export const getAnimeHistory = () => {
    const history = storage.getString("animeHistory");
    return history ? JSON.parse(history) : [];
};

export const saveAnimeHistory = (history) => {
    storage.set("animeHistory", JSON.stringify(history));
};

export const deleteAnimeHistory = (animeId) => {
    const history = getAnimeHistory();
    const updatedHistory = history.filter((item) => item.animeId !== animeId);
    saveAnimeHistory(updatedHistory);
};

// New user profile functions
export const getUserProfile = () => {
    const profile = storage.getString("userProfile");
    return profile ? JSON.parse(profile) : null;
};

export const saveUserProfile = (userProfile) => {
    storage.set("userProfile", JSON.stringify(userProfile));
};

export const clearUserProfile = () => {
    storage.delete("userProfile");
};
