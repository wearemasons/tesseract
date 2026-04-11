import clsx, { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const formatDateFromMs = (ms: number) => {
  const locale = window.context?.locale ?? navigator.language ?? 'en-US'
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC'
  })
  return dateFormatter.format(ms)
}

export const cn = (...args: ClassValue[]) => {
  return twMerge(clsx(...args))
}
