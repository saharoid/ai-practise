import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createElement, type ReactElement, type ReactNode } from 'react';

/** A fresh client per test. Retry is left to each hook, so tests see the hook's own setting. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
}

export function createWrapper(queryClient: QueryClient = createTestQueryClient()) {
  function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return { wrapper, queryClient };
}

export function renderWithClient(ui: ReactElement) {
  const { wrapper, queryClient } = createWrapper();
  return { ...render(ui, { wrapper }), queryClient };
}

/** A promise the test resolves explicitly, to control response order. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
