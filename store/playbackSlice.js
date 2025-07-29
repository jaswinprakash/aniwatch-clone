import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getAnimeHistory, getUserProfile, saveAnimeHistory } from "./storage";
import { supabase } from "../lib/supabase";

const initialState = {
    animeHistory: getAnimeHistory(),
    isAuthenticated: false,
    user: null,
    userProfile: getUserProfile(),
    syncStatus: "idle", // 'idle', 'syncing', 'synced', 'error'
};

// Updated smart sync with proper database updates
export const syncWithSupabase = createAsyncThunk(
    "playback/syncWithSupabase",
    async (_, { getState }) => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const localHistory = getState().playback.animeHistory;
            console.log("Local history items:", localHistory.length);

            const { data: remoteData, error } = await supabase
                .from("user_video_progress")
                .select("*")
                .eq("user_id", user.id);

            if (error) throw error;
            console.log("Remote data items:", remoteData?.length || 0);

            // Smart merge with conditional updates
            const { mergedHistory, databaseUpdates } =
                smartMergeWithConditionalSync(localHistory, remoteData);

            // Update database with new/updated anime data
            if (databaseUpdates.length > 0) {
                const { error } = await supabase
                    .from("user_video_progress")
                    .upsert(
                        databaseUpdates.map((item) => ({
                            ...item,
                            user_id: user.id,
                            updated_at: new Date().toISOString(),
                        })),
                        {
                            onConflict: "user_id,anime_id", // This tells Supabase which columns to check for conflicts
                        }
                    );

                if (error) {
                    console.error("Database upsert failed:", error);
                    throw error;
                }

                console.log(
                    `Updated database with ${databaseUpdates.length} items`
                );
            }

            // Save merged result locally
            saveAnimeHistory(mergedHistory);

            return mergedHistory;
        } catch (error) {
            console.error("Sync failed:", error.message);
            throw error;
        }
    }
);

// Database-only update function (doesn't touch local storage)
export const updateToDatabase = createAsyncThunk(
    "playback/updateToDatabase",
    async (
        {
            animeId,
            episodeNumber,
            currentTime,
            selectedEpisodeId,
            selectedEpisodeName,
        },
        { getState }
    ) => {
        const state = getState().playback;

        if (!state.isAuthenticated) {
            throw new Error("Not authenticated");
        }

        try {
            // Get the user from Supabase auth - this was missing!
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error("User not found");

            const { error } = await supabase.from("user_video_progress").upsert(
                {
                    user_id: user.id, // Now user is properly defined
                    anime_id: animeId,
                    episode_number: episodeNumber,
                    playback_time: Math.floor(currentTime),
                    selected_episode_id: selectedEpisodeId,
                    selected_episode_name: selectedEpisodeName,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id,anime_id",
                }
            );

            if (error) {
                console.error("Database update failed:", error);
                throw error;
            }

            console.log("Database updated successfully for:", animeId);
            return { success: true };
        } catch (error) {
            console.error("Database update failed:", error);
            throw error;
        }
    }
);

// Local-only update (for throttled playback - no database sync)
export const updatePlaybackLocal = createAsyncThunk(
    "playback/updatePlaybackLocal",
    async (
        {
            animeId,
            episodeNumber,
            currentTime,
            selectedEpisodeId,
            selectedEpisodeName,
        },
        { getState }
    ) => {
        const history = getState().playback.animeHistory;
        const existingIndex = history.findIndex(
            (item) => item.animeId === animeId
        );

        const newEntry = {
            animeId,
            episodeNumber,
            currentTime,
            selectedEpisodeId,
            selectedEpisodeName,
            timestamp: Date.now(),
        };

        let updatedHistory;
        if (existingIndex !== -1) {
            // Update existing entry
            updatedHistory = [...history];
            updatedHistory[existingIndex] = newEntry;
        } else {
            // Add new entry only if the storage limit is not reached
            if (history.length < 10) {
                updatedHistory = [newEntry, ...history];
            } else {
                // Do not add new anime if the storage limit is reached
                updatedHistory = history;
            }
        }

        // Only save to MMKV, don't touch database
        saveAnimeHistory(updatedHistory);
        return updatedHistory;
    }
);

// Keep updatePlayback for backward compatibility (points to local-only update)
export const updatePlayback = updatePlaybackLocal;

// Your original deletePlayback function with Supabase sync added
export const deletePlayback = createAsyncThunk(
    "playback/deletePlayback",
    async (animeId, { getState }) => {
        const state = getState().playback;
        const history = state.animeHistory;
        const updatedHistory = history.filter(
            (item) => item.animeId !== animeId
        );

        // Save locally first (immediate) - YOUR ORIGINAL LOGIC
        saveAnimeHistory(updatedHistory);

        // Delete from Supabase if authenticated (background)
        if (state.isAuthenticated) {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from("user_video_progress")
                        .delete()
                        .eq("user_id", user.id)
                        .eq("anime_id", animeId);
                }
            } catch (error) {
                console.log("Background delete sync failed:", error);
                // Don't fail the local delete
            }
        }

        return updatedHistory;
    }
);

// Updated helper function with conditional sync logic
const smartMergeWithConditionalSync = (localHistory, remoteData) => {
    const remoteHistory = remoteData.map((item) => ({
        animeId: item.anime_id,
        episodeNumber: item.episode_number,
        currentTime: item.playback_time,
        selectedEpisodeId: item.selected_episode_id,
        selectedEpisodeName: item.selected_episode_name,
        timestamp: new Date(item.updated_at).getTime(),
    }));

    const merged = {};
    const databaseUpdates = [];

    // Create a map of remote data for quick lookup
    const remoteMap = {};
    remoteHistory.forEach((item) => {
        remoteMap[item.animeId] = item;
    });

    // Process local items first
    localHistory.forEach((localItem) => {
        const remoteItem = remoteMap[localItem.animeId];

        if (!remoteItem) {
            // Case 1: Anime exists in local but not in database - ADD to database
            console.log(
                `Adding new anime to database: ${localItem.animeId} Episode ${localItem.episodeNumber}`
            );
            merged[localItem.animeId] = localItem;
            databaseUpdates.push({
                anime_id: localItem.animeId,
                episode_number: localItem.episodeNumber,
                playback_time: Math.floor(localItem.currentTime),
                selected_episode_id: localItem.selectedEpisodeId,
                selected_episode_name: localItem.selectedEpisodeName,
            });
        } else {
            // Case 2: Anime exists in both local and database - CONDITIONAL UPDATE
            if (localItem.episodeNumber > remoteItem.episodeNumber) {
                // Local episode is higher - update database with local data
                console.log(
                    `Local episode higher (${localItem.episodeNumber} > ${remoteItem.episodeNumber}) - updating database for ${localItem.animeId}`
                );
                merged[localItem.animeId] = localItem;
                databaseUpdates.push({
                    anime_id: localItem.animeId,
                    episode_number: localItem.episodeNumber,
                    playback_time: Math.floor(localItem.currentTime),
                    selected_episode_id: localItem.selectedEpisodeId,
                    selected_episode_name: localItem.selectedEpisodeName,
                });
            } else if (remoteItem.episodeNumber > localItem.episodeNumber) {
                // Remote episode is higher - use remote data locally
                console.log(
                    `Remote episode higher (${remoteItem.episodeNumber} > ${localItem.episodeNumber}) - using remote data for ${localItem.animeId}`
                );
                merged[localItem.animeId] = remoteItem;
                // No database update needed
            } else {
                // Same episode - use the one with latest timestamp or local as priority
                if (localItem.timestamp > remoteItem.timestamp) {
                    console.log(
                        `Same episode, local newer - updating database for ${localItem.animeId}`
                    );
                    merged[localItem.animeId] = localItem;
                    databaseUpdates.push({
                        anime_id: localItem.animeId,
                        episode_number: localItem.episodeNumber,
                        playback_time: Math.floor(localItem.currentTime),
                        selected_episode_id: localItem.selectedEpisodeId,
                        selected_episode_name: localItem.selectedEpisodeName,
                    });
                } else {
                    console.log(
                        `Same episode, remote newer - using remote data for ${localItem.animeId}`
                    );
                    merged[localItem.animeId] = remoteItem;
                }
            }
        }
    });

    // Add remote-only items (animes that exist in database but not locally)
    remoteHistory.forEach((remoteItem) => {
        if (!merged[remoteItem.animeId]) {
            console.log(
                `Adding remote-only anime locally: ${remoteItem.animeId} Episode ${remoteItem.episodeNumber}`
            );
            merged[remoteItem.animeId] = remoteItem;
            // No database update needed for remote-only items
        }
    });

    const mergedHistory = Object.values(merged)
        .sort((a, b) => b.timestamp - a.timestamp) // Sort by most recent
        .slice(0, 10); // Keep only 10 most recent

    return { mergedHistory, databaseUpdates };
};

const playbackSlice = createSlice({
    name: "playback",
    initialState,
    reducers: {
        setAuthState: (state, action) => {
            state.isAuthenticated = action.payload.isAuthenticated;
            state.user = action.payload.user;
        },
        setSyncStatus: (state, action) => {
            state.syncStatus = action.payload;
        },
        setUserProfile: (state, action) => {
            state.userProfile = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(updatePlaybackLocal.fulfilled, (state, action) => {
                state.animeHistory = action.payload;
            })
            .addCase(updateToDatabase.fulfilled, (state, action) => {
                // Don't update local state, just mark as successful
                console.log("Database update completed");
            })
            .addCase(updateToDatabase.rejected, (state, action) => {
                console.error("Database update failed:", action.error.message);
            })
            .addCase(deletePlayback.fulfilled, (state, action) => {
                state.animeHistory = action.payload;
            })
            .addCase(syncWithSupabase.pending, (state) => {
                state.syncStatus = "syncing";
            })
            .addCase(syncWithSupabase.fulfilled, (state, action) => {
                state.animeHistory = action.payload;
                state.syncStatus = "synced";
            })
            .addCase(syncWithSupabase.rejected, (state) => {
                state.syncStatus = "error";
            });
    },
});

export const { setAuthState, setSyncStatus, setUserProfile } =
    playbackSlice.actions;
export default playbackSlice.reducer;
