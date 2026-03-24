import axios from "axios";

export const apiConfig = axios.create({
    baseURL: "https://movie-box-api-rose.vercel.app/",
});

export const streamApi = axios.create({
    baseURL: "https:/anime-api-lemon-chi.vercel.app",
});
