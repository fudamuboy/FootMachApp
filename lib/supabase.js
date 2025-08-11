import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_KEYS from './apiKeys'; // ajuste le chemin si besoin

// Using AsyncStorage to avoid the 2048-byte limit warning
const AsyncStorageAdapter = {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
};

const supabaseUrl = API_KEYS.SUPABASE_URL;
const supabaseAnonKey = API_KEYS.SUPABASE_API_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

/* 
Alternative: If you prefer SecureStore with chunking, uncomment this code:

import * as SecureStore from 'expo-secure-store';

const ChunkedSecureStoreAdapter = {
    getItem: async (key) => {
        try {
            const value = await SecureStore.getItemAsync(key);
            if (value) return value;
            
            // Check for chunked data
            const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
            if (!chunkCount) return null;
            
            let fullValue = '';
            for (let i = 0; i < parseInt(chunkCount); i++) {
                const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
                if (chunk) fullValue += chunk;
            }
            return fullValue;
        } catch (error) {
            console.warn('SecureStore getItem error:', error);
            return null;
        }
    },
    setItem: async (key, value) => {
        try {
            // If value is small enough, store normally
            if (value.length <= 2000) {
                await SecureStore.setItemAsync(key, value);
                return;
            }
            
            // Chunk large values
            const chunkSize = 2000;
            const chunks = [];
            for (let i = 0; i < value.length; i += chunkSize) {
                chunks.push(value.slice(i, i + chunkSize));
            }
            
            // Store chunks
            for (let i = 0; i < chunks.length; i++) {
                await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
            }
            
            // Store chunk count
            await SecureStore.setItemAsync(`${key}_chunks`, chunks.length.toString());
        } catch (error) {
            console.warn('SecureStore setItem error:', error);
        }
    },
    removeItem: async (key) => {
        try {
            await SecureStore.deleteItemAsync(key);
            
            // Remove chunked data
            const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
            if (chunkCount) {
                for (let i = 0; i < parseInt(chunkCount); i++) {
                    await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
                }
                await SecureStore.deleteItemAsync(`${key}_chunks`);
            }
        } catch (error) {
            console.warn('SecureStore removeItem error:', error);
        }
    },
};

// To use the chunked version, replace AsyncStorageAdapter with ChunkedSecureStoreAdapter
*/