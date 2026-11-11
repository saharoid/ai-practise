import { setupWorker } from 'msw/browser';
import { control } from './control';
import { handlers } from './handlers';

/** Visible loading in dev; tests keep the default of 0 ms. */
control.delayMs = 400;

export const worker = setupWorker(...handlers);
