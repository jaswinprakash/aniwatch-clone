// AnimeHistoryContext.js
import React, { createContext, useContext } from "react";
import { useSelector } from "react-redux";

const AnimeHistoryContext = createContext();

export const AnimeHistoryProvider = ({ children }) => {
    // Access the animeHistory state from Redux
    const animeHistory = useSelector((state) => state.playback.animeHistory);

    return (
        <AnimeHistoryContext.Provider value={animeHistory}>
            {children}
        </AnimeHistoryContext.Provider>
    );
};

// Custom hook to access the animeHistory context
export const useAnimeHistory = () => {
    const context = useContext(AnimeHistoryContext);
    if (!context) {
        throw new Error("useAnimeHistory must be used within an AnimeHistoryProvider");
    }
    return context;
};