import type { Plan, PlanId } from '../../types/plan';
import styles from './PlanPicker.module.css';

export interface PlanPickerProps {
  plans: readonly Plan[];
  currentPlanId: PlanId;
  selectedPlanId: PlanId | null;
  onSelect: (planId: PlanId) => void;
}

export function PlanPicker({ plans, currentPlanId, selectedPlanId, onSelect }: PlanPickerProps) {
  const checkedId = selectedPlanId ?? currentPlanId;
  return (
    <fieldset className={styles.picker}>
      <legend>Izaberi plan</legend>
      {plans.map((plan) => (
        <label key={plan.id} className={styles.option}>
          <input
            type="radio"
            name="plan"
            value={plan.id}
            checked={plan.id === checkedId}
            onChange={() => onSelect(plan.id)}
          />
          {plan.name}
          {plan.id === currentPlanId ? ' (trenutni)' : ''}
        </label>
      ))}
    </fieldset>
  );
}
