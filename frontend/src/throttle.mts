// Credit: Based on https://stackoverflow.com/a/27078401, CC BY-SA 4.0
export const CANCELLED = Symbol("throttle-cancelled")

export function throttle<T extends (...args: any) => any>(
  callback: T,
  limit: number
) {
  let waiting = false
  return function (...params: Parameters<T>): ReturnType<T> | typeof CANCELLED {
    if (waiting) return CANCELLED
    waiting = true
    setTimeout(() => {
      waiting = false
    }, limit)
    return callback(...params)
  }
}
