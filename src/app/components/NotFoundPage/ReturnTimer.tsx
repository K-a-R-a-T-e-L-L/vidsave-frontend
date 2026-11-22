'use client';

import { useEffect, useState } from 'react';
import styles from './styles.module.scss';

export default function ReturnTimer() {
  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(7);
  useEffect(() => {
    if (!running) return;
    const deadline = Date.now() + 7000;
    const redirect = window.setTimeout(() => window.location.replace('/'), 7000);
    const clock = window.setInterval(() => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 250);
    return () => {
      window.clearTimeout(redirect);
      window.clearInterval(clock);
    };
  }, [running]);

  return (
    <div className={styles.timer}>
      {running ? (
        <>
          <span>Переход на главную через {seconds} сек.</span>
          <button type="button" onClick={() => setRunning(false)}>
            Остаться
          </button>
        </>
      ) : (
        <span role="status">Автопереход отменён</span>
      )}
    </div>
  );
}
