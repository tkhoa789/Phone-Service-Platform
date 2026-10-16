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

// Auto-sanitize legacy dead logo URLs from localStorage before hydration
try {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('psp_system_settings');
    if (raw && raw.includes('51d96a54-8dfc-4b87-affe-46978e049575')) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.settings) {
        parsed.state.settings.systemLogoUrl = '';
        localStorage.setItem('psp_system_settings', JSON.stringify(parsed));
      }
    }
  }
} catch {
  // Ignore storage access errors
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
      onRehydrateStorage: () => (state) => {
        if (state?.settings?.systemLogoUrl?.includes('51d96a54-8dfc-4b87-affe-46978e049575')) {
          state.settings.systemLogoUrl = '';
        }
      },
    }
  )
);
