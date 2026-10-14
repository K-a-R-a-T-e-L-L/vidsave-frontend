export class CmsRequestError extends Error {
  constructor(readonly status: number) {
    super(
      status === 400
        ? 'Проверьте заполнение полей.'
        : status === 401
          ? 'Сессия завершена. Войдите снова.'
          : status === 403
            ? 'Действие недоступно.'
            : status === 404
              ? 'Запись не найдена.'
              : status === 409
                ? 'Запись связана с другими материалами, адрес занят или текст согласия изменился.'
                : status === 413
                  ? 'Файл или содержимое слишком большое.'
                  : status === 429
                    ? 'Слишком много запросов. Повторите позже.'
                    : 'Сервис временно недоступен. Повторите попытку.',
    );
  }
}
export async function cmsRequest<T = Record<string, unknown>>(url: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      cache: 'no-store',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new CmsRequestError(503);
  }
  if (!response.ok) throw new CmsRequestError(response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
