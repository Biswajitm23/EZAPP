import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { UserProfile } from '@/api/types'

interface AuthState {
  isAuthenticated: boolean
  sessionExpired: boolean
  token: {
    accessToken: string
    refreshToken: string
  }
  user: UserProfile | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  sessionExpired: false,
  token: {
    accessToken: '',
    refreshToken: '',
  },
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthDetails: (
      state,
      action: PayloadAction<{
        token: { accessToken: string; refreshToken: string }
        isAuthenticated: boolean
        sessionExpired: boolean
        user: UserProfile | null
      }>
    ) => {
      state.token = action.payload.token
      state.isAuthenticated = action.payload.isAuthenticated
      state.sessionExpired = action.payload.sessionExpired
      state.user = action.payload.user
    },
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload
    },
    setSessionExpired: (state, action: PayloadAction<boolean>) => {
      state.sessionExpired = action.payload
    },
    clearAuth: () => initialState,
  },
})

export const { setAuthDetails, setUser, setSessionExpired, clearAuth } = authSlice.actions
export default authSlice.reducer
