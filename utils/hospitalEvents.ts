export type HospitalEvent =
  | "REGISTRATION_COMPLETED"
  | "REGISTRATION_FINALIZED"
  | "BILL_GENERATED"
  | "PAYMENT_CONFIRMED"
  | "CONSULTATION_UNLOCKED"
  | "INVESTIGATION_ORDERED"
  | "INVESTIGATION_PAID"
  | "INVESTIGATION_ACCEPTED"
  | "REPORT_UPLOADED"
  | "ADMISSION_CONFIRMED"
  | "MEDICATION_DRAFT_CREATED"
  | "MEDICATION_DRAFT_CONFIRMED"
  | "PHARMACY_DISPENSED"
  | "INVESTIGATION_ORDER_CREATED"
  | "INVESTIGATION_PAYMENT_CONFIRMED"
  | "ESCALATION_DISPATCHED"
  | "ESCALATION_ACKNOWLEDGED"
  | "OP_TO_IP_CONVERSION"
  | "IP_CHARGE_TICK"
  | "SURGERY_ORDERED"
  | "SURGERY_FINALIZED"
  | "PROCEDURE_LOGGED";

type Listener = (payload?: any) => void;

const listeners: Record<string, Listener[]> = {};

/**
 * Global emitter for hospital-wide clinical events.
 * Syncs decoupled operational nodes (Billing, Doctor, Lab).
 */
export function emitEvent(event: HospitalEvent, payload?: any) {
  console.debug(`[Institutional Sync] Emitting: ${event}`, payload);
  if (listeners[event]) {
    listeners[event].forEach((cb) => cb(payload));
  }
}

/**
 * Global subscriber for hospital-wide clinical events.
 * Returns a cleanup function for useEffect.
 */
export function onEvent(event: HospitalEvent, cb: Listener) {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(cb);

  return () => {
    listeners[event] = (listeners[event] || []).filter((l) => l !== cb);
  };
}