'use server'

import { triggerScraperRefresh } from '@/src/lib/actions/system/set-system-flag'

export async function notifyConfigChange(
  action: 'create' | 'update' | 'delete',
  icpId?: number
): Promise<{ success: boolean; error?: string }> {
  return triggerScraperRefresh()
}