export function formatFCFA(amountInCentimes: number, options?: { showSign?: boolean; compact?: boolean }): string {
  const amount = amountInCentimes / 100;
  const abs = Math.abs(amount);
  let formatted: string;

  if (options?.compact && abs >= 1_000_000_000) {
    formatted = `${(abs / 1_000_000_000).toFixed(1)} Mrd`;
  } else if (options?.compact && abs >= 1_000_000) {
    formatted = `${(abs / 1_000_000).toFixed(1)} M`;
  } else if (options?.compact && abs >= 1_000) {
    formatted = `${(abs / 1_000).toFixed(0)} K`;
  } else {
    formatted = abs.toLocaleString('fr-FR');
  }

  const sign = amount < 0 ? '-' : (options?.showSign && amount > 0 ? '+' : '');
  return `${sign}${formatted} FCFA`;
}

export function toCentimes(fcfa: number): number {
  return Math.round(fcfa * 100);
}

export function toFCFA(centimes: number): number {
  return centimes / 100;
}

export function addAmounts(...amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + Math.round(a), 0);
}
