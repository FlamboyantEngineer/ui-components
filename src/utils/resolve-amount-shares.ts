export interface AmountShare<T> {
  item: T;
  value: number;
  /** The item's share of the whole, from 0 to 1. */
  share: number;
}

function toAmount(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/** Positive amounts and their shares, retaining proportions when their sum overflows. */
export function resolveAmountShares<T>(
  items: readonly T[],
  getValue: (item: T) => number,
  total?: number,
): { amounts: Array<AmountShare<T>>; total: number } {
  let sum = 0;
  let largest = 0;
  const amounts = items.map((item) => {
    const value = toAmount(getValue(item));
    sum += value;
    largest = Math.max(largest, value);
    return { item, value, share: 0 };
  });
  const whole = Math.max(toAmount(total), sum);
  let scale = 1;
  let divisor = whole;
  if (!Number.isFinite(whole)) {
    scale = largest;
    divisor = amounts.reduce((count, { value }) => count + value / scale, 0);
  }
  for (const amount of amounts) {
    amount.share = divisor > 0 ? amount.value / scale / divisor : 0;
  }
  return { amounts, total: whole };
}
