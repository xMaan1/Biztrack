interface ApiErrorBody {
  detail?: unknown
}

function formatDetail(detail: unknown): string {
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string }
    if (typeof first.msg === 'string') {
      return first.msg
    }
  }
  return 'Request failed'
}

export async function parseApiError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody
  throw new Error(formatDetail(body.detail) || fallbackMessage)
}

export async function parseJsonIfOk<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  if (!response.ok) {
    return parseApiError(response, fallbackMessage)
  }
  return (await response.json()) as T
}

export async function voidIfOk(
  response: Response,
  fallbackMessage: string,
): Promise<void> {
  if (!response.ok) {
    return parseApiError(response, fallbackMessage)
  }
}
