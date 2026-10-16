import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BranchStoreState {
  activeBranchId: string; // 'all' means all branches (only for Owner/Admin)
  activeBranchName: string;
  activeBranchAddress?: string;
  activeBranchPhone?: string;
  setActiveBranch: (id: string, name: string, address?: string, phone?: string) => void;
  resetBranch: () => void;
}

export const useBranchStore = create<BranchStoreState>()(
  persist(
    (set) => ({
      activeBranchId: 'all',
      activeBranchName: 'Tất cả chi nhánh',
      setActiveBranch: (id, name, address, phone) => set((state) => {
        if (
          state.activeBranchId === id &&
          state.activeBranchName === name &&
          state.activeBranchAddress === address &&
          state.activeBranchPhone === phone
        ) {
          return state;
        }
        return { activeBranchId: id, activeBranchName: name, activeBranchAddress: address, activeBranchPhone: phone };
      }),
      resetBranch: () => {
        try {
          localStorage.removeItem('psp_branch_context');
        } catch {
          // Ignore localStorage errors in non-browser environments
        }
        set({
          activeBranchId: 'all',
          activeBranchName: 'Tất cả chi nhánh',
          activeBranchAddress: undefined,
          activeBranchPhone: undefined,
        });
      },
    }),
    {
      name: 'psp_branch_context',
    }
  )
);
