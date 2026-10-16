import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { IWarrantyService } from '../services/IWarrantyService';
import { realWarrantyService } from '../services/realWarrantyService';
import { warrantyTrainingService } from '../services/warrantyTrainingService';

interface WarrantyServiceContextType {
  service: IWarrantyService;
  isTrainingMode: boolean;
  setTrainingMode: (enabled: boolean) => void;
  resetTrainingData: () => void;
}

const WarrantyServiceContext = createContext<WarrantyServiceContextType | null>(null);

export const WarrantyServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [isTrainingMode, setIsTrainingMode] = useState<boolean>(() => {
    return searchParams.get('mode') === 'training';
  });

  // Sync state with URL parameter
  useEffect(() => {
    const urlMode = searchParams.get('mode') === 'training';
    if (urlMode !== isTrainingMode) {
      setIsTrainingMode(urlMode);
    }
  }, [searchParams]);

  const handleSetTrainingMode = (enabled: boolean) => {
    setIsTrainingMode(enabled);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (enabled) {
        next.set('mode', 'training');
      } else {
        next.delete('mode');
        next.delete('tour');
        next.delete('sandbox');
      }
      return next;
    });
    if (!enabled) {
      import('../utils/sandboxUtils').then(({ purgeSandboxSession }) => {
        purgeSandboxSession();
        window.dispatchEvent(new Event('popstate'));
      });
    }
    // Invalidate queries so components re-fetch from active service adapter
    queryClient.invalidateQueries({ queryKey: ['warranties'] });
    queryClient.invalidateQueries({ queryKey: ['warranty-detail'] });
  };

  const handleResetTrainingData = () => {
    warrantyTrainingService.reset();
    queryClient.invalidateQueries({ queryKey: ['warranties'] });
    queryClient.invalidateQueries({ queryKey: ['warranty-detail'] });
  };

  const service: IWarrantyService = useMemo(() => {
    return isTrainingMode ? warrantyTrainingService : realWarrantyService;
  }, [isTrainingMode]);

  return (
    <WarrantyServiceContext.Provider
      value={{
        service,
        isTrainingMode,
        setTrainingMode: handleSetTrainingMode,
        resetTrainingData: handleResetTrainingData,
      }}
    >
      {children}
    </WarrantyServiceContext.Provider>
  );
};

export const useWarrantyService = (): WarrantyServiceContextType => {
  const context = useContext(WarrantyServiceContext);
  if (!context) {
    // Fallback gracefully to real service if used outside provider
    return {
      service: realWarrantyService,
      isTrainingMode: false,
      setTrainingMode: () => {},
      resetTrainingData: () => {},
    };
  }
  return context;
};
