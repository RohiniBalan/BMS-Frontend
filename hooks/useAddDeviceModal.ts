import { create } from "zustand";

interface AddDeviceState {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useAddDeviceModal = create<AddDeviceState>((set) => ({
  open: false,
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
}));