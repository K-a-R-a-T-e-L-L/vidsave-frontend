'use client';

export default function PublicRouteError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main role="alert" style={{ maxWidth: 720, margin: '10vh auto', padding: 24, textAlign: 'center' }}>
      <h1>Каталог временно недоступен</h1>
      <p>Не удалось получить актуальные сведения из каталога. Попробуйте обновить страницу позже.</p>
      <button type="button" onClick={retry}>
        Повторить
      </button>
    </main>
  );
}
