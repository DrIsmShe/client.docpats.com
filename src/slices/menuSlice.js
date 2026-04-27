// menuSlice.js
import { createSlice } from "@reduxjs/toolkit";

export const menuSlice = createSlice({
  name: "menu",
  contentaside: "block",

  initialState: {
    isOpen: true, // Панель по умолчанию закрыта
    isOpenSearch: true, // Панель по умолчанию закрыта
  },
  reducers: {
    toggleMenu: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeMenu: (state) => {
      state.isOpen = false;
    },
    openMenu: (state) => {
      state.isOpen = true;
    },
    toggleMenuSearch: (state) => {
      state.isOpenSearch = !state.isOpenSearch;
    },
    closeMenuSearch: (state) => {
      state.isOpenSearch = false;
    },
    openMenuSearch: (state) => {
      state.isOpenSearch = true;
    },
  },
});

export const {
  toggleMenu,
  closeMenu,
  openMenu,
  toggleMenuSearch,
  closeMenuSearch,
  openMenuSearch,
} = menuSlice.actions;
export default menuSlice.reducer;
