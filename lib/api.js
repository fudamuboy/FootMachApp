import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use the environment variable from .env, fallback to localhost if it's missing somehow
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.116:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('❌ API Timeout:', error.message);
    } else if (!error.response) {
      console.error('❌ Network Error (Server unreachable):', error.message);
    } else {
      console.error('❌ API Error:', error.response.status, error.response.data?.message || error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

