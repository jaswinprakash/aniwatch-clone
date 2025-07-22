import axios from "axios";

export const apiConfig = axios.create({
    baseURL: "https://demo-aniwatch.vercel.app",
    // baseURL: "https://m3u8-woad.vercel.app/",
});

export const streamApi = axios.create({
    baseURL: "https:/anime-api-lemon-chi.vercel.app",
});
