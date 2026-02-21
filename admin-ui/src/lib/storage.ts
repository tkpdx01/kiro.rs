const API_KEY_STORAGE_KEY = 'adminApiKey'
const BALANCE_CACHE_KEY = 'balanceCache'

export const storage = {
  getApiKey: () => localStorage.getItem(API_KEY_STORAGE_KEY),
  setApiKey: (key: string) => localStorage.setItem(API_KEY_STORAGE_KEY, key),
  removeApiKey: () => localStorage.removeItem(API_KEY_STORAGE_KEY),

  getBalanceCache: (): Record<string, { balance: unknown; queriedAt: number }> => {
    try {
      const raw = localStorage.getItem(BALANCE_CACHE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  },
  setBalanceCache: (cache: Record<string, { balance: unknown; queriedAt: number }>) => {
    try {
      localStorage.setItem(BALANCE_CACHE_KEY, JSON.stringify(cache))
    } catch { /* quota exceeded, ignore */ }
  },
}
