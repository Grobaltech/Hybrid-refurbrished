import { supabase } from './supabase'

type FunctionErrorContext = {
  json?: () => Promise<{ error?: string; message?: string }>
}

export async function adminUsers<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  // All staff-management actions are handled by the deployed smooth-processor
  // Edge Function. The separate admin-users endpoint does not exist.
  const { data, error } = await supabase.functions.invoke('smooth-processor', {
    body: { action, ...payload },
  })

  if (error) {
    const context = (error as { context?: FunctionErrorContext }).context
    let detail = error.message

    try {
      const response = await context?.json?.()
      detail = response?.error || response?.message || detail
    } catch {
      // Keep the original Supabase error when the response is not JSON.
    }

    throw new Error(detail)
  }

  if (data?.error) throw new Error(data.error)
  return data as T
}
