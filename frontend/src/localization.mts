import { $ } from "voby"

export const timestampNow = $(Date.now())

setInterval(() => {
  timestampNow(Date.now())
}, 1000)

export function displayInteger(num: number): string {
  return num.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })
}
