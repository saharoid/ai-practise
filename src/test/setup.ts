import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetControl } from '../mocks/control';
import { resetDb } from '../mocks/db';
import { server } from '../mocks/server';

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  server.events.removeAllListeners();
  resetDb();
  resetControl();
});

afterAll(() => {
  server.close();
});
