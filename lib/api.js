import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use the environment variable from .env, fallback to localhost if it's missing somehow
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.116:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error fetching token for request:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

