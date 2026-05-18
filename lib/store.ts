import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getTodayISO } from './utils'

interface AppState {
  // Current selected date
  selectedDate: string
  setSelectedDate: (date: string) => void

  // Selected customer ID for orders page
  selectedCustomerId: string | null
  setSelectedCustomerId: (id: string | null) => void

  // Work mode: enlarged touch targets for staff
  workMode: boolean
  setWorkMode: (v: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedDate: getTodayISO(),
      setSelectedDate: (date) => set({ selectedDate: date }),

      selectedCustomerId: null,
      setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),

      workMode: false,
      setWorkMode: (v) => set({ workMode: v }),
    }),
    {
      name: 'panificio-app-storage',
      partialize: (state) => ({
        selectedDate: state.selectedDate,
        workMode: state.workMode,
      }),
    }
  )
)
