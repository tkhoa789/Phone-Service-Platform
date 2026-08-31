import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SystemSettings {
  systemName: string;
  systemLogoUrl?: string;
  storePhone: string;
  storeAddress: string;
  vietQrBank: string;
  vietQrBankName: string;
  vietQrAccountNo: string;
  vietQrAccountHolder: string;
}

interface SystemStoreState {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
}

export const useSystemStore = create<SystemStoreState>()(
  persist(
    (set) => ({
      settings: {
        systemName: 'Phone Service Platform (PSP)',
        systemLogoUrl: '',
        storePhone: '0901 234 567',
        storeAddress: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
        vietQrBank: '970422', // MBBank
        vietQrBankName: 'MBBank (NHTM CP Quân Đội)',
        vietQrAccountNo: '038921104',
        vietQrAccountHolder: 'CONG TY PHONG SERVICE PLATFORM',
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'psp_system_settings',
    }
  )
);
