/**
 * 生成 UUID v4
 * 優先使用 crypto.randomUUID()，不支援時改用 crypto.getRandomValues() 實作
 * 解決部分舊版手機瀏覽器不支援 randomUUID 的問題
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: 使用 getRandomValues 實作 UUID v4（支援度較 randomUUID 廣）
  const getRandomValues = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
    ? crypto.getRandomValues.bind(crypto)
    : null
  if (!getRandomValues) {
    // 極少數環境無 crypto.getRandomValues，用 Math.random 作為最後手段
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
  const bytes = new Uint8Array(16)
  getRandomValues(bytes)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes)
    .map((b) => b!.toString(16).padStart(2, '0'))
    .join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
