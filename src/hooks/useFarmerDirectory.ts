import { useCallback, useEffect, useRef, useState } from 'react';
import type { InvestorFarmerProfile } from '../types';
import { fetchFarmerDirectory } from '../services/farmerDirectoryService';

type DirectoryState = { ownerId: string | null; farmers: InvestorFarmerProfile[]; loading: boolean; error: string };
export function useFarmerDirectory(investorId: string | null) {
  const request = useRef<AbortController | null>(null);
  const [state, setState] = useState<DirectoryState>({ ownerId: null, farmers: [], loading: false, error: '' });
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setState({ ownerId: investorId, farmers: [], loading: Boolean(investorId), error: '' });
    if (!investorId) return;
    try {
      const farmers = await fetchFarmerDirectory(controller.signal);
      if (!controller.signal.aborted) setState({ ownerId: investorId, farmers, loading: false, error: '' });
    } catch (error) {
      if (!controller.signal.aborted) setState({ ownerId: investorId, farmers: [], loading: false, error: error instanceof Error ? error.message : 'Unable to load farmers.' });
    }
  }, [investorId]);
  useEffect(() => { void refresh(); return () => request.current?.abort(); }, [refresh]);
  return { farmers: state.ownerId === investorId ? state.farmers : [], loading: state.ownerId === investorId ? state.loading : Boolean(investorId), error: state.ownerId === investorId ? state.error : '', refresh };
}
