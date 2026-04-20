import { create } from "zustand";

interface OnboardingState {
  step: number;
  styles: string[];
  colors: string[];
  roomType: string;
  wallWidth: number;
  wallHeight: number;
  lighting: string;
  budgetTier: string;
  setStep: (step: number) => void;
  setStyles: (styles: string[]) => void;
  setColors: (colors: string[]) => void;
  setRoomDetails: (details: { roomType: string; wallWidth: number; wallHeight: number; lighting: string }) => void;
  setBudgetTier: (tier: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 0,
  styles: [],
  colors: [],
  roomType: "",
  wallWidth: 120,
  wallHeight: 96,
  lighting: "Medium",
  budgetTier: "",
  setStep: (step) => set({ step }),
  setStyles: (styles) => set({ styles }),
  setColors: (colors) => set({ colors }),
  setRoomDetails: (details) => set(details),
  setBudgetTier: (budgetTier) => set({ budgetTier }),
  reset: () =>
    set({
      step: 0,
      styles: [],
      colors: [],
      roomType: "",
      wallWidth: 120,
      wallHeight: 96,
      lighting: "Medium",
      budgetTier: "",
    }),
}));

interface FavoritesState {
  favoriteIds: Set<string>;
  toggle: (id: string) => void;
  setAll: (ids: string[]) => void;
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
  favoriteIds: new Set(),
  toggle: (id) =>
    set((state) => {
      const next = new Set(state.favoriteIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { favoriteIds: next };
    }),
  setAll: (ids) => set({ favoriteIds: new Set(ids) }),
}));
