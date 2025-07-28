import { AppState } from 'react-native'
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { storage } from '../store/storage' // Your existing MMKV storage

const supabaseUrl = 'https://vvmrrfmbzpzofqenpbfn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bXJyZm1ienB6b2ZxZW5wYmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NzgyNTgsImV4cCI6MjA2OTI1NDI1OH0.6ReChlWcYKMBVwgj0kb6cbJc9weN1bDLsnBPd90iKdg'

// Custom MMKV adapter for Supabase
const mmkvAdapter = {
  getItem: (key) => {
    const value = storage.getString(key)
    return value || null
  },
  setItem: (key, value) => {
    storage.set(key, value)
  },
  removeItem: (key) => {
    storage.delete(key)
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: mmkvAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
