import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../api/client';
import { PLANS, type PlanId, type Preview } from '../../types/plan';
import { ConfirmChange } from './ConfirmChange';
import { CurrentPlan } from './CurrentPlan';
import styles from './PlanChangePage.module.css';
import { PlanPicker } from './PlanPicker';
import { PreviewSummary } from './PreviewSummary';
import { useConfirmChange } from './useConfirmChange';
import { usePreview } from './usePreview';
import { useQuoteExpired } from './useQuoteExpired';
import { useSubscription } from './useSubscription';

export interface PlanChangePageProps {
  subscriptionId: string;
}

const CONFIRM_ERRORS: Record<string, string> = {
  QUOTE_EXPIRED: 'Obračun je istekao. Učitali smo novi.',
  QUOTE_INVALID: 'Obračun više ne važi. Učitali smo novi.',
};

function planById(planId: PlanId) {
  const plan = PLANS.find((candidate) => candidate.id === planId);
  if (!plan) throw new Error(`Unknown plan ${planId}`);
  return plan;
}

function confirmErrorMessage(error: Error): string {
  if (error instanceof ApiError && CONFIRM_ERRORS[error.code]) return CONFIRM_ERRORS[error.code];
  return 'Promena nije potvrđena. Pokušaj ponovo.';
}

export function PlanChangePage({ subscriptionId }: PlanChangePageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(null);
  const subscription = useSubscription(subscriptionId);
  const currentPlanId = subscription.data?.planId;
  const preview = usePreview(subscriptionId, selectedPlanId, currentPlanId);
  const confirm = useConfirmChange(subscriptionId);
  // Guards against a second click before React re-renders the disabled button.
  const submitting = useRef(false);

  const wantsChange = selectedPlanId !== null && selectedPlanId !== currentPlanId;
  // Only a preview for the selected plan may be shown or confirmed.
  const activePreview: Preview | undefined =
    wantsChange && preview.data?.planId === selectedPlanId ? preview.data : undefined;
  const isExpired = useQuoteExpired(activePreview?.quoteId, activePreview?.expiresAt);
  const { refetch: refetchPreview } = preview;

  // An expired quote cannot be confirmed, so ask the service for a new one.
  useEffect(() => {
    if (isExpired) void refetchPreview();
  }, [isExpired, refetchPreview]);

  if (subscription.isPending) {
    return <p role="status">Učitavanje...</p>;
  }
  if (subscription.isError) {
    return (
      <div role="alert">
        Pretplata nije dostupna.{' '}
        <button type="button" onClick={() => void subscription.refetch()}>
          Pokušaj ponovo
        </button>
      </div>
    );
  }

  const currentPlan = planById(subscription.data.planId);

  function handleSelect(planId: PlanId) {
    confirm.reset();
    setSelectedPlanId(planId);
  }

  function handleConfirm(target: Preview) {
    if (submitting.current) return;
    submitting.current = true;
    confirm.mutate(
      { quoteId: target.quoteId },
      {
        onSuccess: () => setSelectedPlanId(null),
        onSettled: () => {
          submitting.current = false;
        },
      },
    );
  }

  return (
    <div className={styles.page}>
      <CurrentPlan plan={currentPlan} />
      <PlanPicker
        plans={PLANS}
        currentPlanId={currentPlan.id}
        selectedPlanId={selectedPlanId}
        onSelect={handleSelect}
      />

      <section aria-label="Obračun" className={styles.preview}>
        {wantsChange && preview.isFetching && !activePreview ? (
          <p role="status">Učitavanje...</p>
        ) : null}
        {wantsChange && preview.isError ? (
          <div role="alert">
            Obračun nije dostupan.{' '}
            <button type="button" onClick={() => void preview.refetch()}>
              Pokušaj ponovo
            </button>
          </div>
        ) : null}
        {activePreview ? (
          <PreviewSummary preview={activePreview} plan={planById(activePreview.planId)} />
        ) : null}
        {activePreview && isExpired ? (
          <p role="status">Obračun je istekao. Učitavamo novi.</p>
        ) : null}
      </section>

      <ConfirmChange
        preview={activePreview}
        isExpired={isExpired}
        isPending={confirm.isPending}
        onConfirm={handleConfirm}
      />

      {confirm.isError ? <p role="alert">{confirmErrorMessage(confirm.error)}</p> : null}
      {confirm.isSuccess ? (
        <p role="status">Plan je promenjen na {planById(confirm.data.planId).name}.</p>
      ) : null}
    </div>
  );
}
