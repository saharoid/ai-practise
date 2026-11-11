import type { Plan } from '../../types/plan';
import styles from './CurrentPlan.module.css';

export interface CurrentPlanProps {
  plan: Plan;
}

export function CurrentPlan({ plan }: CurrentPlanProps) {
  return <p className={styles.current}>Trenutni plan: {plan.name}</p>;
}
