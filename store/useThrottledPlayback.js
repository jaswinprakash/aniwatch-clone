// useThrottledPlayback.js
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { updatePlayback } from './playbackSlice';
import throttle from 'lodash.throttle';

export const useThrottledPlayback = () => {
    const dispatch = useDispatch();

    const throttledUpdate = useCallback(
        throttle((animeId, episodeNumber, currentTime) => {
            dispatch(updatePlayback({ animeId, episodeNumber, currentTime }));
        }, 5000), // Throttle to 5 seconds
        [dispatch]
    );

    return throttledUpdate;
};