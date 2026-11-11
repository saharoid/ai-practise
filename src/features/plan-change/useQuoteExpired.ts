import { useEffect, useState } from 'react';

/**
 * True once the given quote's expiresAt has passed. A timer flips it while the
 * page stays open, so render itself never reads the clock.
 */
export function useQuoteExpired(quoteId: string | undefined, expiresAt: string | undefined) {
  const [expiredQuoteId, setExpiredQuoteId] = useState<string | null>(null);

  useEffect(() => {
    if (!quoteId || !expiresAt) return;
    const remainingMs = Math.max(0, Date.parse(expiresAt) - Date.now());
    const timer = setTimeout(() => setExpiredQuoteId(quoteId), remainingMs);
    return () => clearTimeout(timer);
  }, [quoteId, expiresAt]);

  return quoteId !== undefined && expiredQuoteId === quoteId;
}
