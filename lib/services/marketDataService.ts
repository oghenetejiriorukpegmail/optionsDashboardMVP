// Backwards-compatibility shim
// Some imports in the repo used the alternate-casing path `marketDataService`.
// The canonical implementation lives in lib/services/marketdataService.ts.
// Re-export everything from the canonical module so both import casings work.

export * from './marketdataService';