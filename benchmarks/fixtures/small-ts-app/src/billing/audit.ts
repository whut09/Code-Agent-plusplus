
export interface AuditEvent { id: string; actor: string; action: string; createdAt: string; }
export function recordAuditEvent(event: AuditEvent): string {
  return `${event.actor}:${event.action}:${event.createdAt}`;
}
export function listAuditEvents(): AuditEvent[] {
  return [
    { id: 'a1', actor: 'system', action: 'boot', createdAt: '2024-01-01' },
    { id: 'a2', actor: 'billing', action: 'invoice', createdAt: '2024-01-02' }
  ];
}
