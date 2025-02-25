import axios from "axios";

export const apiConfig = axios.create({
    baseURL: "https://demo-silk-five-94.vercel.app",
});