import type { Preview } from '../../types/plan';
import { formatMoney } from '../../utils/formatMoney';
import styles from './ConfirmChange.module.css';

export interface ConfirmChangeProps {
  preview: Preview | undefined;
  isExpired: boolean;
  isPending: boolean;
  onConfirm: (preview: Preview) => void;
}

export function ConfirmChange({ preview, isExpired, isPending, onConfirm }: ConfirmChangeProps) {
  const disabled = !preview || isExpired || isPending;
  return (
    <div className={styles.confirm}>
      {preview && !isExpired ? (
        <p className={styles.note}>Potvrđujete iznos {formatMoney(preview.dueNow)}.</p>
      ) : null}
      <button type="button" disabled={disabled} onClick={() => preview && onConfirm(preview)}>
        Potvrdi promenu
      </button>
    </div>
  );
}
