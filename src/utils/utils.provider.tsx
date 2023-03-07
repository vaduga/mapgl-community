import React, { createContext, useContext, ReactNode } from 'react';

import RootStore from '../store/RootStore';

// holds a reference to the store (singleton)
let store: RootStore;

const StoreContext = createContext <RootStore | undefined>(undefined);

export const RootStoreProvider = ({ children }: { children: ReactNode }) => {
  //only create the store once ( store is a singleton)

  const root = store ?? new RootStore();
  return <StoreContext.Provider value={root}>{children}</StoreContext.Provider>;
}

// hook
export const useRootStore = ()=> {

  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useRootStore must be used within RootStoreProvider');
  }

  return context;
}








