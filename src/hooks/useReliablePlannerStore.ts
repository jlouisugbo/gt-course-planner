import { usePlannerStore } from './usePlannerStore';

/**
 * Compatibility wrapper for `useReliablePlannerStore` used in a few components.
 * Returns the same store instance for now; can be enhanced later to add reliability
 * checks or additional initialization steps.
 */
export const useReliablePlannerStore = () => usePlannerStore();

export default useReliablePlannerStore;
