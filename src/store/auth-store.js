import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  signin: (user) =>
    set({
      user: user,
    }),
  logout: () =>
    set({
      user: null,
    }),
}));
