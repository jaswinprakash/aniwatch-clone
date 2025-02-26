// playbackSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAnimeHistory, saveAnimeHistory } from "./storage";

const initialState = {
    animeHistory: getAnimeHistory(),
};

export const updatePlayback = createAsyncThunk(
    "playback/updatePlayback",
    async ({ animeId, episodeNumber, currentTime }, { getState }) => {
        const history = getState().playback.animeHistory;
        const existingIndex = history.findIndex(
            (item) => item.animeId === animeId
        );

        const newEntry = {
            animeId,
            episodeNumber,
            currentTime,
            timestamp: Date.now(),
        };

        let updatedHistory;
        if (existingIndex !== -1) {
            // Update existing entry
            updatedHistory = [...history];
            updatedHistory[existingIndex] = newEntry;
        } else {
            // // Add new entry
            // updatedHistory = [newEntry, ...history];
            // // Limit to 10 entries
            // if (updatedHistory.length > 1) {
            //     updatedHistory.pop(); // Remove the oldest entry
            // }
            // Add new entry only if the storage limit is not reached
            if (history.length < 10) {
                updatedHistory = [newEntry, ...history];
            } else {
                // Do not add new anime if the storage limit is reached
                updatedHistory = history;
            }
        }

        saveAnimeHistory(updatedHistory);
        return updatedHistory;
    }
);

const playbackSlice = createSlice({
    name: "playback",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(updatePlayback.fulfilled, (state, action) => {
            state.animeHistory = action.payload;
        });
    },
});

export default playbackSlice.reducer;
