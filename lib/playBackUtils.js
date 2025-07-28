import { useDispatch, useSelector } from "react-redux";
import { updateToDatabase } from "../store/playbackSlice";

// Hook for manual database saves (database only, no local storage changes)
export const useManualPlaybackSave = () => {
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state) => state.playback);

    const saveToDatabase = async (
        animeId,
        episodeNumber,
        currentTime,
        selectedEpisodeId
    ) => {
        // Only proceed if user is authenticated
        if (!isAuthenticated) {
            console.log("User not authenticated, skipping database save");
            return { success: false, error: "Not authenticated" };
        }

        try {
            await dispatch(
                updateToDatabase({
                    animeId,
                    episodeNumber,
                    currentTime,
                    selectedEpisodeId,
                })
            ).unwrap();
            return { success: true };
        } catch (error) {
            console.error("Manual database save failed:", error);
            return { success: false, error: error.message };
        }
    };

    return saveToDatabase;
};
