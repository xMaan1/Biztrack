import Constants from "expo-constants";

export const config = {
  apiUrl:
    Constants.expoConfig?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://localhost:8000",
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
};

export const API_BASE_URL = config.apiUrl;


