/** Knobs the mock service reads on every request. Tests and dev setup may change them. */
export interface MockControl {
  /** Delay before each response, in milliseconds. */
  delayMs: number;
  /** How long a quote stays valid after preview, in milliseconds. */
  quoteTtlMs: number;
}

const defaults: MockControl = { delayMs: 0, quoteTtlMs: 300_000 };

export const control: MockControl = { ...defaults };

export function resetControl(): void {
  Object.assign(control, defaults);
}
