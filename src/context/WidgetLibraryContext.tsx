import { createContext, useContext, type ReactNode } from 'react';

export type WidgetLibraryOpenFn = (
  targetSectionId?: string | null,
  replaceInstanceId?: string | null
) => void;

const WidgetLibraryOpenContext = createContext<WidgetLibraryOpenFn | null>(null);

export function WidgetLibraryOpenProvider({
  open,
  children,
}: {
  open: WidgetLibraryOpenFn;
  children: ReactNode;
}) {
  return <WidgetLibraryOpenContext.Provider value={open}>{children}</WidgetLibraryOpenContext.Provider>;
}

export function useWidgetLibraryOpen(): WidgetLibraryOpenFn {
  const open = useContext(WidgetLibraryOpenContext);
  if (!open) {
    throw new Error('useWidgetLibraryOpen must be used within WidgetLibraryOpenProvider');
  }
  return open;
}
