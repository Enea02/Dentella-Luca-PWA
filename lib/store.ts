import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from './types'
import { getTodayISO } from './utils'

interface AppState {
  // Current selected date
  selectedDate: string
  setSelectedDate: (date: string) => void
  
  // Selected customer ID for orders page
  selectedCustomerId: string | null
  setSelectedCustomerId: (id: string | null) => void
  
  // Demo role override (dev only)
  demoRole: Role | null
  setDemoRole: (role: Role | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedDate: getTodayISO(),
      setSelectedDate: (date) => set({ selectedDate: date }),
      
      selectedCustomerId: null,
      setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
      
      demoRole: null,
      setDemoRole: (role) => set({ demoRole: role }),
    }),
    {
      name: 'panificio-app-storage',
      partialize: (state) => ({
        // Only persist date selection, not demo role
        selectedDate: state.selectedDate,
      }),
    }
  )
)
