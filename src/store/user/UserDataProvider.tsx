"use client";
import React, { createContext, useContext, useRef } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { UserData } from './UserData';
import { createUserDataStore } from './UserData';

// React context for the store
const UserDataStoreContext = createContext<StoreApi<UserData> | null>(null);

export function UserDataProvider({ children, userData }: { children: React.ReactNode; userData: Partial<UserData> }) {
  // Only create the store once per provider instance
  const storeRef = useRef<StoreApi<UserData>>(createUserDataStore(userData));
  return (
    <UserDataStoreContext.Provider value={storeRef.current}>
      {children}
    </UserDataStoreContext.Provider>
  );
}

// Hook to use the store in components
export function useUserDataStore() {
  const store = useContext(UserDataStoreContext);
  if (!store) throw new Error('useUserDataStore must be used within a UserDataProvider');
  return store;
}
