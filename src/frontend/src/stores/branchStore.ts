import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BranchStoreState {
  activeBranchId: string; // 'all' means all branches (only for Owner/Admin)
  activeBranchName: string;
  activeBranchAddress?: string;
  activeBranchPhone?: string;
  setActiveBranch: (id: string, name: string, address?: string, phone?: string) => void;
}

export const useBranchStore = create<BranchStoreState>()(
  persist(
    (set) => ({
      activeBranchId: 'all',
      activeBranchName: 'Tất cả chi nhánh',
      setActiveBranch: (id, name, address, phone) => set({ activeBranchId: id, activeBranchName: name, activeBranchAddress: address, activeBranchPhone: phone }),
    }),
    {
      name: 'psp_branch_context',
    }
  )
);
