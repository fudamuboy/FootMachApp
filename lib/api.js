import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Replace 192.168.1.103 with your actual local IP address on Windows/Mac if it changes
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://192.168.1.103:8000/api';
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

