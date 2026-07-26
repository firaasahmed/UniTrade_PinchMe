// injectable clock — seed data uses fixed timestamps, runtime writes use this
// keeps the deterministic parts deterministic while a real app can still stamp new records
export type Clock = () => string;

export const systemClock: Clock = () => new Date().toISOString();
