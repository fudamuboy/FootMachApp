import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import i18n from './i18n';

// Ensure BASE_URL ends with a slash for correct relative path resolution
let BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.118:8000/api';
if (!BASE_URL.endsWith('/')) {
  BASE_URL += '/';
}

console.log('📡 API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, 
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
      
      if (__DEV__) {
        console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
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
  (response) => {
    if (__DEV__) {
      console.log(`✅ API Response: ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    let customMessage = '';
    
    // Detailed error logging for debugging (even in non-dev for TestFlight debugging if needed)
    const errorData = {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code
    };
    
    console.error('❌ [API ERROR]:', JSON.stringify(errorData, null, 2));

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      customMessage = "Le serveur met du temps à répondre, réessayez.";
    } else if (error.response && error.response.status === 404) {
      customMessage = "Service indisponible pour le moment.";
    } else if (error.response && error.response.status === 401) {
        customMessage = "Session expirée, veuillez vous reconnecter.";
    } else if (!error.response) {
      customMessage = i18n.t('api.networkError');
    } else {
      customMessage = error.response.data?.message || 'Une erreur est survenue.';
    }
    
    // Override message with user-friendly version
    if (customMessage) {
      error.message = customMessage;
    }
    
    return Promise.reject(error);
  }
);

export default api;

