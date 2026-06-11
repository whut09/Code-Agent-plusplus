
export function recordMetric(name: string, value: number): string {
  return `${name}:${value}`;
}
export function summarizeMetrics(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}
