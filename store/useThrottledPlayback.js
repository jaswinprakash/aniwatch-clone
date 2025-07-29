// useThrottledPlayback.js
import throttle from "lodash.throttle";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { updatePlaybackLocal } from "./playbackSlice";

export const useThrottledPlayback = () => {
    const dispatch = useDispatch();

    const throttledUpdate = useCallback(
        throttle(
            (
                animeId,
                episodeNumber,
                currentTime,
                selectedEpisodeId,
                selectedEpisodeName
            ) => {
                if (currentTime === 0) return;
                dispatch(
                    updatePlaybackLocal({
                        animeId,
                        episodeNumber,
                        currentTime,
                        selectedEpisodeId,
                        selectedEpisodeName,
                    })
                );
            },
            5000
        ), // Throttle to 5 seconds
        [dispatch]
    );

    return throttledUpdate;
};
