import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { MobileSidebarModal } from '../components/layout/MobileSidebarModal';

type SidebarDrawerContextValue = {
  openSidebar: () => void;
  closeSidebar: () => void;
  setSidebarActivePath: (path: string) => void;
};

const SidebarDrawerContext = createContext<
  SidebarDrawerContextValue | undefined
>(undefined);

export function SidebarDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [activePath, setActivePath] = useState('/dashboard');

  const openSidebar = useCallback(() => setVisible(true), []);
  const closeSidebar = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!isAuthenticated) setVisible(false);
  }, [isAuthenticated]);

  return (
    <SidebarDrawerContext.Provider
      value={{
        openSidebar,
        closeSidebar,
        setSidebarActivePath: setActivePath,
      }}
    >
      {children}
      {isAuthenticated ? (
        <MobileSidebarModal
          visible={visible}
          onClose={closeSidebar}
          activePath={activePath}
        />
      ) : null}
    </SidebarDrawerContext.Provider>
  );
}

export function useSidebarDrawer() {
  const ctx = useContext(SidebarDrawerContext);
  if (ctx === undefined) {
    throw new Error('useSidebarDrawer requires SidebarDrawerProvider');
  }
  return ctx;
}
