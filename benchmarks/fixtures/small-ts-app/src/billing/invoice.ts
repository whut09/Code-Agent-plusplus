
export function calculateInvoiceTotal(lines: number[]): number {
  return lines.reduce((sum, line) => sum + line, 0);
}
export function formatInvoice(id: string, total: number): string {
  return `${id}:${total.toFixed(2)}`;
}
