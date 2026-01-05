import Constants from 'expo-constants';

export const config = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000',
};

export default config;

