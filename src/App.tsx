import styles from './App.module.css';
import { PlanChangePage } from './features/plan-change/PlanChangePage';

export function App() {
  return (
    <main className={styles.app}>
      <h1>Promena plana</h1>
      <PlanChangePage subscriptionId="sub_1" />
    </main>
  );
}
