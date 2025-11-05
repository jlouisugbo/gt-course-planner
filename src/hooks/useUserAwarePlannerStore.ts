import { usePlannerStore } from './usePlannerStore';

/**
 * Compatibility wrapper: previously some components used `useUserAwarePlannerStore`.
 * Delegate to the canonical `usePlannerStore` so migration is incremental.
 */
export const useUserAwarePlannerStore = () => usePlannerStore();

export default useUserAwarePlannerStore;
