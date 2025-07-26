// useThrottledPlayback.js
import throttle from "lodash.throttle";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { updatePlayback } from "./playbackSlice";

export const useThrottledPlayback = () => {
    const dispatch = useDispatch();

    const throttledUpdate = useCallback(
        throttle((animeId, episodeNumber, currentTime, selectedEpisodeId) => {
            dispatch(
                updatePlayback({
                    animeId,
                    episodeNumber,
                    currentTime,
                    selectedEpisodeId,
                })
            );
        }, 5000), // Throttle to 5 seconds
        [dispatch]
    );

    return throttledUpdate;
};

// import throttle from "lodash.throttle";
// import { useCallback, useRef } from "react";
// import { useDispatch } from "react-redux";
// import { updatePlayback } from "./playbackSlice";

// export const useSmartPlayback = () => {
//     const dispatch = useDispatch();
//     const lastUpdateRef = useRef({});
//     const pendingUpdateRef = useRef(null);

//     const immediateUpdate = useCallback(
//         (animeId, episodeNumber, currentTime, selectedEpisodeId) => {
//             dispatch(
//                 updatePlayback({
//                     animeId,
//                     episodeNumber,
//                     currentTime,
//                     selectedEpisodeId,
//                 })
//             );
//             lastUpdateRef.current = {
//                 animeId,
//                 episodeNumber,
//                 currentTime,
//                 selectedEpisodeId,
//             };
//         },
//         [dispatch]
//     );

//     const throttledUpdate = useCallback(
//         throttle((animeId, episodeNumber, currentTime, selectedEpisodeId) => {
//             immediateUpdate(
//                 animeId,
//                 episodeNumber,
//                 currentTime,
//                 selectedEpisodeId
//             );
//         }, 5000),
//         [immediateUpdate]
//     );

//     const smartUpdate = useCallback(
//         (animeId, episodeNumber, currentTime, selectedEpisodeId) => {
//             const lastUpdate = lastUpdateRef.current;

//             // Immediate update if episode changed
//             if (
//                 lastUpdate.animeId !== animeId ||
//                 lastUpdate.episodeNumber !== episodeNumber ||
//                 lastUpdate.selectedEpisodeId !== selectedEpisodeId
//             ) {
//                 // Clear pending throttled updates
//                 if (pendingUpdateRef.current) {
//                     pendingUpdateRef.current.cancel();
//                 }

//                 immediateUpdate(
//                     animeId,
//                     episodeNumber,
//                     currentTime,
//                     selectedEpisodeId
//                 );
//                 return;
//             }

//             // Use throttled update for same episode
//             throttledUpdate(
//                 animeId,
//                 episodeNumber,
//                 currentTime,
//                 selectedEpisodeId
//             );
//         },
//         [immediateUpdate, throttledUpdate]
//     );

//     // Save on pause/episode change
//     const saveOnPause = useCallback(
//         (animeId, episodeNumber, currentTime, selectedEpisodeId) => {
//             if (pendingUpdateRef.current) {
//                 pendingUpdateRef.current.cancel();
//             }
//             immediateUpdate(
//                 animeId,
//                 episodeNumber,
//                 currentTime,
//                 selectedEpisodeId
//             );
//         },
//         [immediateUpdate]
//     );

//     return { smartUpdate, saveOnPause };
// };
