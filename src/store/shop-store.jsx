import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useShopStore = create(
  persist((set) => ({
    shop: null,
    setShop: (shop) =>
      set({
        shop: shop,
      }),
    clearShop: () =>
      set({
        shop: null,
      }),
  })),

  {
    name: "shop-storage",
    storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
  }
);
