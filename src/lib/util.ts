export const roundToPrecision = (num: number, precision: number): number => {
  if (!isFinite(num) || precision <= 0) return num
  const factor = Math.pow(10, Math.round(-Math.log10(precision)))
  return Math.round(num * factor) / factor
}

export const isZero = (value: number, precision: number): boolean => {
  return Math.abs(value) <= precision
}

export const isInteger = (value: number, precision: number): boolean => {
  const rounded = Math.round(value)
  return Math.abs(value - rounded) <= precision
}
