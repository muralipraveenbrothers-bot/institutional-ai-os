
import { ShiftLedger, ConsumptionRecord, AnomalyAlert, Medication, SurgeryMedIssue, CashHandoverRecord, RapidCardLog, ForensicTraceEvent, AccessLogEntry, StaffRiskProfile, BehavioralAnomaly, ForensicTimelineNode, AuditProbe } from '../types';
import { emitEvent } from './hospitalEvents';

const LEDGER_KEY = "institutional_shift_ledgers";
const CONSUMPTION_KEY = "institutional_consumption_logs";
const ANOMALY_KEY = "institutional_anomaly_alerts";
const PHARMACY_ORDERS_KEY = "pharmacy_orders_registry";
const SURGERY_ISSUE_KEY = "surgery_medicine_issues";
const CASH_HANDOVER_KEY = "cash_handover_records";
const RAPID_CARD_KEY = "lab_rapid_card_logs";
const FORENSIC_TRACE_KEY = "institutional_forensic_trace";
const ACCESS_LOG_KEY = "institutional_access_logs";
const STAFF_RISK_KEY = "institutional_staff_risk_scores";
const BEHAVIORAL_ANOMALY_KEY = "institutional_behavioral_anomalies";
const AUDIT_PROBE_KEY = "institutional_scheduled_probes";

export const protectionService = {
  // --- SHIFT MANAGEMENT ---
  getOpenLedger: (userId: string): ShiftLedger | null => {
    const ledgers = JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]") as ShiftLedger[];
    return ledgers.find(l => l.userId === userId && l.status === 'OPEN') || null;
  },

  openShift: (userId: string, openingBalance: number) => {
    const ledgers = JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]") as ShiftLedger[];
    const newLedger: ShiftLedger = {
      id: `SHIFT-${Date.now()}`,
      userId,
      startTime: new Date().toISOString(),
      openingBalance,
      cashCollected: 0,
      upiCollected: 0,
      closingBalance: 0,
      variance: 0,
      status: 'OPEN'
    };
    localStorage.setItem(LEDGER_KEY, JSON.stringify([...ledgers, newLedger]));
    return newLedger;
  },

  closeShift: (ledgerId: string, reportedClosing: number, supervisorPin?: string) => {
    const ledgers = JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]") as ShiftLedger[];
    const idx = ledgers.findIndex(l => l.id === ledgerId);
    if (idx === -1) return null;

    const l = ledgers[idx];
    const expectedClosing = l.openingBalance + l.cashCollected + l.upiCollected;
    const variance = reportedClosing - expectedClosing;

    if (Math.abs(variance) > 0 && !supervisorPin) {
      return { error: "VARIANCE_DETECTED", variance };
    }

    l.closingBalance = reportedClosing;
    l.variance = variance;
    l.status = Math.abs(variance) > 0 ? 'VARIANCE_ALERT' : 'CLOSED';
    l.endTime = new Date().toISOString();
    l.supervisorPinUsed = !!supervisorPin;

    if (Math.abs(variance) > 0) {
      protectionService.logAnomaly({
        type: 'CASH HANDOVER MISMATCH',
        severity: 'HIGH',
        message: `Shift variance detected for user ${l.userId}: ₹${variance}`,
        userId: l.userId,
        metadata: { expected: expectedClosing, reported: reportedClosing, variance }
      });
      protectionService.recalculateRiskScore(l.userId);
    }

    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledgers));
    return l;
  },

  // --- FIDUCIARY CROSS-MATCH ENGINE (CASH HANDOVER) ---
  calculateHandoverExpected: () => {
    const separateBills = JSON.parse(localStorage.getItem("separate_bills") || "[]");
    const pharmaSales = JSON.parse(localStorage.getItem("pharmacy_sales_history") || "[]");
    
    // Aggregate by categories
    const expected = {
      opTotal: separateBills.filter((b:any) => b.department === 'Registration').reduce((s:number, b:any) => s + b.total, 0),
      ipTotal: separateBills.filter((b:any) => b.department === 'IP Admission').reduce((s:number, b:any) => s + b.total, 0),
      pharmacyTotal: pharmaSales.reduce((s:number, b:any) => s + b.total, 0),
      labTotal: separateBills.filter((b:any) => b.department === 'Lab').reduce((s:number, b:any) => s + b.total, 0),
      usgTotal: separateBills.filter((b:any) => b.department === 'Radiology' && b.items.some((i:any) => i.name.toLowerCase().includes('usg'))).reduce((s:number, b:any) => s + b.total, 0),
      xrayTotal: separateBills.filter((b:any) => b.department === 'Radiology' && b.items.some((i:any) => i.name.toLowerCase().includes('x-ray'))).reduce((s:number, b:any) => s + b.total, 0),
      ctTotal: separateBills.filter((b:any) => b.department === 'Radiology' && b.items.some((i:any) => i.name.toLowerCase().includes('ct'))).reduce((s:number, b:any) => s + b.total, 0),
      mriTotal: separateBills.filter((b:any) => b.department === 'Radiology' && b.items.some((i:any) => i.name.toLowerCase().includes('mri'))).reduce((s:number, b:any) => s + b.total, 0),
    };

    const grandExpected = Object.values(expected).reduce((a, b) => a + b, 0);
    return { grandExpected, expected };
  },

  // --- AI SCHEDULED PROBING ---
  triggerScheduledProbe: () => {
    const probes = JSON.parse(localStorage.getItem(AUDIT_PROBE_KEY) || "[]") as AuditProbe[];
    const types: any[] = ['CRASH_CART', 'PHARMA_SHELF', 'OT_TRAY', 'DRESSING_STOCK'];
    const locations = ['ICU-A', 'OT-1', 'PHARMA-HUB', 'WARD-N'];
    
    const lastProbe = probes[probes.length - 1];
    const now = new Date();
    
    if (!lastProbe || (now.getTime() - new Date(lastProbe.deadline).getTime() > 0)) {
      const freq = Math.random() > 0.5 ? 2 : 3;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + freq);

      const newProbe: AuditProbe = {
        id: `PRB-${Date.now()}`,
        type: types[Math.floor(Math.random() * types.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        deadline: deadline.toISOString(),
        status: 'PENDING',
        assignedTo: 'STAFF-NODE-AUTO',
        frequencyDays: freq as 2 | 3
      };
      
      probes.push(newProbe);
      localStorage.setItem(AUDIT_PROBE_KEY, JSON.stringify(probes));
      return newProbe;
    }
    return null;
  },

  getPendingProbes: () => {
    const probes = JSON.parse(localStorage.getItem(AUDIT_PROBE_KEY) || "[]") as AuditProbe[];
    return probes.filter(p => p.status === 'PENDING');
  },

  // --- SURGERY RECONCILIATION ---
  issueSurgeryMeds: (data: Omit<SurgeryMedIssue, 'issueId' | 'status'>) => {
    const issues = JSON.parse(localStorage.getItem(SURGERY_ISSUE_KEY) || "[]");
    const newIssue = { ...data, issueId: `SRG-${Date.now()}`, status: 'PENDING' };
    issues.push(newIssue);
    localStorage.setItem(SURGERY_ISSUE_KEY, JSON.stringify(issues));
    return newIssue;
  },

  reconcileSurgery: (issueId: string, updates: { itemId: string, qtyUsed: number, qtyReturned: number, qtyWasted: number }[]) => {
    const issues = JSON.parse(localStorage.getItem(SURGERY_ISSUE_KEY) || "[]") as SurgeryMedIssue[];
    const idx = issues.findIndex(i => i.issueId === issueId);
    if (idx === -1) return;

    const issue = issues[idx];
    let hasMismatch = false;

    issue.items = issue.items.map(item => {
      const u = updates.find(x => x.itemId === item.itemId);
      if (u) {
        const totalAccounted = u.qtyUsed + u.qtyReturned + u.qtyWasted;
        if (totalAccounted !== item.qtyIssued) hasMismatch = true;
        return { ...item, ...u };
      }
      return item;
    });

    issue.status = hasMismatch ? 'MISMATCH' : 'RECONCILED';
    if (hasMismatch) {
      protectionService.logAnomaly({
        type: 'SURGERY MEDICINE MISMATCH',
        severity: 'HIGH',
        message: `Mismatch detected in surgery meds for ${issue.patientId}. Issued quantity does not equal Used + Returned + Waste.`,
        userId: issue.nurseId,
        timestamp: new Date().toISOString()
      });
      protectionService.recalculateRiskScore(issue.nurseId);
    }

    localStorage.setItem(SURGERY_ISSUE_KEY, JSON.stringify(issues));
  },

  // --- FORENSIC TRACE LOGGING ---
  logForensicEvent: (event: Omit<ForensicTraceEvent, 'id' | 'timestamp' | 'manualAuditHash'>) => {
    const logs = JSON.parse(localStorage.getItem(FORENSIC_TRACE_KEY) || "[]") as ForensicTraceEvent[];
    const newLog: ForensicTraceEvent = {
      ...event,
      id: `TRC-${Date.now()}`,
      timestamp: new Date().toISOString(),
      manualAuditHash: Math.random().toString(36).substring(7).toUpperCase()
    };
    logs.push(newLog);
    localStorage.setItem(FORENSIC_TRACE_KEY, JSON.stringify(logs));

    if (newLog.varianceDetected) {
      protectionService.logAnomaly({
        type: 'FORENSIC MATERIAL VARIANCE',
        severity: 'HIGH',
        message: `Forensic photo verification failed in ${newLog.location}. ${newLog.varianceDetails}`,
        userId: newLog.staffId,
        timestamp: newLog.timestamp
      });
      protectionService.recalculateRiskScore(newLog.staffId);
    }
    return newLog;
  },

  // --- AI RISK SCORING ENGINE ---
  recalculateRiskScore: (staffId: string) => {
    const alerts = JSON.parse(localStorage.getItem(ANOMALY_KEY) || "[]") as AnomalyAlert[];
    const riskProfiles = JSON.parse(localStorage.getItem(STAFF_RISK_KEY) || "[]") as StaffRiskProfile[];
    
    const staffAlerts = alerts.filter(a => a.userId === staffId);
    let score = 0;
    const factors: string[] = [];

    const highAlertCount = staffAlerts.filter(a => a.severity === 'HIGH').length;
    score += highAlertCount * 15;
    if (highAlertCount > 0) factors.push(`${highAlertCount} High Severity Alerts`);

    const mismatchAlerts = staffAlerts.filter(a => a.type.includes('MISMATCH')).length;
    score += mismatchAlerts * 10;
    if (mismatchAlerts > 0) factors.push(`${mismatchAlerts} Inventory Mismatches`);

    const accessAnomalies = staffAlerts.filter(a => a.type.includes('ACCESS')).length;
    score += accessAnomalies * 20;
    if (accessAnomalies > 0) factors.push(`${accessAnomalies} Access Violations`);

    score = Math.min(score, 100);
    const level = score > 70 ? 'HIGH' : score > 40 ? 'MODERATE' : 'LOW';

    const idx = riskProfiles.findIndex(p => p.staffId === staffId);
    const prevScore = idx !== -1 ? riskProfiles[idx].score : 0;
    const trend = score > prevScore ? 'UP' : score < prevScore ? 'DOWN' : 'STABLE';

    const profile: StaffRiskProfile = {
      staffId,
      name: `User ${staffId}`,
      score,
      level,
      factors,
      varianceTrend: trend
    };

    if (idx !== -1) riskProfiles[idx] = profile;
    else riskProfiles.push(profile);

    localStorage.setItem(STAFF_RISK_KEY, JSON.stringify(riskProfiles));
    
    if (level === 'HIGH') {
      protectionService.detectBehavioralAnomalies(staffId);
    }
  },

  detectBehavioralAnomalies: (staffId: string) => {
    const alerts = JSON.parse(localStorage.getItem(ANOMALY_KEY) || "[]") as AnomalyAlert[];
    const anomalies = JSON.parse(localStorage.getItem(BEHAVIORAL_ANOMALY_KEY) || "[]") as BehavioralAnomaly[];
    const staffAlerts = alerts.filter(a => a.userId === staffId).slice(-5);

    const otherStaffInvolved = staffAlerts.map(a => a.metadata?.otherStaffId).filter(Boolean);
    if (otherStaffInvolved.length >= 2) {
      const uniqueOthers = [...new Set(otherStaffInvolved)];
      uniqueOthers.forEach(other => {
        const count = otherStaffInvolved.filter(o => o === other).length;
        if (count >= 2) {
          anomalies.push({
            id: `BH-${Date.now()}`,
            type: 'COLLUSION',
            staffIds: [staffId, other],
            severity: 'HIGH',
            evidence: `Repeated variances (x${count}) observed when staff ${staffId} and ${other} overlap shifts.`,
            timestamp: new Date().toISOString()
          });
        }
      });
    }

    const smallVariances = staffAlerts.filter(a => a.message.includes('₹') && parseFloat(a.message.split('₹')[1]) < 500).length;
    if (smallVariances >= 3) {
      anomalies.push({
        id: `BH-${Date.now()}`,
        type: 'SIPHONING',
        staffIds: [staffId],
        severity: 'MEDIUM',
        evidence: `Frequent small-value mismatches (x${smallVariances}) detected, indicating a gradual siphoning pattern.`,
        timestamp: new Date().toISOString()
      });
    }

    localStorage.setItem(BEHAVIORAL_ANOMALY_KEY, JSON.stringify(anomalies));
  },

  getForensicTimeline: (patientId: string): ForensicTimelineNode[] => {
    const issues = JSON.parse(localStorage.getItem(SURGERY_ISSUE_KEY) || "[]") as SurgeryMedIssue[];
    const trace = JSON.parse(localStorage.getItem(FORENSIC_TRACE_KEY) || "[]") as ForensicTraceEvent[];
    const patientIssues = issues.filter(i => i.patientId === patientId);
    const patientTrace = trace.filter(t => t.patientId === patientId);

    const timeline: ForensicTimelineNode[] = [];
    patientIssues.forEach(i => {
      timeline.push({ time: i.issueId.split('-')[1], action: `Surgery Meds Issued: ${i.surgeryName}`, staffId: i.nurseId, location: 'PHARMACY', status: 'NOMINAL' });
      if (i.status === 'MISMATCH') {
        timeline.push({ time: Date.now().toString(), action: 'RETURN LOG MISMATCH', staffId: i.nurseId, location: 'OT', status: 'ALERT' });
      }
    });

    patientTrace.forEach(t => {
      timeline.push({ time: t.timestamp, action: `Photo Lock: ${t.eventType}`, staffId: t.staffId, location: t.location, status: t.varianceDetected ? 'ALERT' : 'NOMINAL' });
    });

    return timeline.sort((a, b) => Number(a.time) - Number(b.time));
  },

  // --- ACCESS MONITORING ---
  logAccess: (entry: Omit<AccessLogEntry, 'id'>) => {
    const logs = JSON.parse(localStorage.getItem(ACCESS_LOG_KEY) || "[]") as AccessLogEntry[];
    const newEntry: AccessLogEntry = {
      ...entry,
      id: `ACC-${Date.now()}`
    };
    logs.push(newEntry);
    localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(logs));

    const hour = new Date(entry.time).getHours();
    if (entry.area.toLowerCase().includes('pharma') && (hour >= 23 || hour <= 6)) {
      protectionService.logAnomaly({
        type: 'NIGHT PHARMACY ACCESS ANOMALY',
        severity: 'HIGH',
        message: `Unusual night-hour access to pharmacy by ${entry.staffId} at ${entry.time}`,
        userId: entry.staffId
      });
      protectionService.recalculateRiskScore(entry.staffId);
    }
    return newEntry;
  },

  logAnomaly: (anomaly: Omit<AnomalyAlert, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const alerts = JSON.parse(localStorage.getItem(ANOMALY_KEY) || "[]") as AnomalyAlert[];
    const newAlert: AnomalyAlert = {
      ...anomaly,
      id: `ALRT-${Date.now()}`,
      timestamp: anomaly.timestamp || new Date().toISOString()
    };
    localStorage.setItem(ANOMALY_KEY, JSON.stringify([...alerts, newAlert]));
    // emitEvent("ESCALATION_DISPATCHED" as any, newAlert);
  },

  logConsumption: (record: Omit<ConsumptionRecord, 'id' | 'timestamp'>) => {
    const logs = JSON.parse(localStorage.getItem(CONSUMPTION_KEY) || "[]") as ConsumptionRecord[];
    const newRecord: ConsumptionRecord = {
      ...record,
      id: `CONS-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString()
    };
    logs.push(newRecord);
    localStorage.setItem(CONSUMPTION_KEY, JSON.stringify(logs));
    return newRecord;
  },

  getPendingPharmacyOrders: () => {
    const orders = JSON.parse(localStorage.getItem(PHARMACY_ORDERS_KEY) || "[]");
    return orders.filter((o: any) => o.status === 'PENDING');
  },

  createPharmacyOrder: (patientId: string, patientName: string, meds: any[], source: string, priority: string) => {
    const orders = JSON.parse(localStorage.getItem(PHARMACY_ORDERS_KEY) || "[]");
    const newOrder = {
      id: `RX-${Date.now()}`,
      patientId,
      patientName,
      meds,
      source,
      priority,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(PHARMACY_ORDERS_KEY, JSON.stringify([...orders, newOrder]));
    return newOrder;
  },

  completePharmacyOrder: (orderId: string) => {
    const orders = JSON.parse(localStorage.getItem(PHARMACY_ORDERS_KEY) || "[]");
    const updated = orders.map((o: any) => o.id === orderId ? { ...o, status: 'COMPLETED' } : o);
    localStorage.setItem(PHARMACY_ORDERS_KEY, JSON.stringify(updated));
  },
};
