const DEBUG = false;

export function echo(...args: any[]) {
  if (DEBUG) console.log(`[${new Date().toISOString()}]`, ...args);
}
