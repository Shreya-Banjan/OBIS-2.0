import { createContext, useContext, type ReactNode } from 'react';
import type { DashboardGlobalState } from '../types';

const DashboardScopeContext = createContext<DashboardGlobalState | null>(null);

export function DashboardScopeProvider({
  value,
  children,
}: {
  value: DashboardGlobalState;
  children: ReactNode;
}) {
  return <DashboardScopeContext.Provider value={value}>{children}</DashboardScopeContext.Provider>;
}

/** Scoped dashboard filters; safe outside provider (returns empty scope). */
export function useDashboardScope(): DashboardGlobalState {
  const ctx = useContext(DashboardScopeContext);
  if (ctx == null) {
    return { partners: [], timeline: '', specialtyIds: [], locationLabels: [] };
  }
  return ctx;
}
