/**
 * Nigerian LGA (Local Government Area) utility
 * Provides filtering and retrieval of LGAs by state
 */

import lgaData from '@/app/data/nigerian-lgas.json';

export interface State {
  name: string;
  code: string;
  lgas: string[];
}

/**
 * Get all states
 */
export function getAllStates(): State[] {
  return lgaData.states;
}

/**
 * Get LGAs for a specific state
 * Returns empty array if state not found
 */
export function getLGAsByState(stateName: string): string[] {
  const state = lgaData.states.find(
    (s) => s.name.toLowerCase() === stateName.toLowerCase()
  );
  return state ? state.lgas : [];
}

/**
 * Get state by name (case-insensitive)
 */
export function getStateByName(stateName: string): State | undefined {
  return lgaData.states.find(
    (s) => s.name.toLowerCase() === stateName.toLowerCase()
  );
}

/**
 * Get state by code
 */
export function getStateByCode(code: string): State | undefined {
  return lgaData.states.find((s) => s.code === code.toUpperCase());
}

/**
 * Check if an LGA exists in a state
 */
export function lgaExistsInState(lgaName: string, stateName: string): boolean {
  const lgas = getLGAsByState(stateName);
  return lgas.some((lga) => lga.toLowerCase() === lgaName.toLowerCase());
}
