// store.js
import { configureStore } from "@reduxjs/toolkit";
import playbackReducer from "./playbackSlice"; // This should work with default export

export const store = configureStore({
    reducer: {
        playback: playbackReducer,
    },
});
