import axios from "axios";

export const apiConfig = axios.create({
    baseURL: "https://demo-aniwatch.vercel.app",
});