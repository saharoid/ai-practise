import type { Plan, Preview } from '../../types/plan';
import { formatMoney } from '../../utils/formatMoney';
import styles from './PreviewSummary.module.css';

export interface PreviewSummaryProps {
  preview: Preview;
  plan: Plan;
}

export function PreviewSummary({ preview, plan }: PreviewSummaryProps) {
  return (
    <dl className={styles.summary}>
      <dt>Novi plan</dt>
      <dd>{plan.name}</dd>
      <dt>Za plaćanje</dt>
      <dd>{formatMoney(preview.dueNow)}</dd>
      <dt>Primena od</dt>
      <dd>{preview.effectiveDate}</dd>
    </dl>
  );
}
