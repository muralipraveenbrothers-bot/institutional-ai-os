
import { Patient, Diagnosis, TreatmentPlan } from './types';

class ClinicalDataModule {
  private static instance: ClinicalDataModule;
  private storageKey = 'COGNIMED_CLINICAL_DATA_V1';

  private constructor() {}

  public static getInstance(): ClinicalDataModule {
    if (!ClinicalDataModule.instance) {
      ClinicalDataModule.instance = new ClinicalDataModule();
    }
    return ClinicalDataModule.instance;
  }

  private getAllData(): Record<string, { diagnoses: Diagnosis[], treatmentPlans: TreatmentPlan[] }> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Failed to load clinical data", e);
      return {};
    }
  }

  private saveAllData(data: Record<string, { diagnoses: Diagnosis[], treatmentPlans: TreatmentPlan[] }>) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  public getPatientClinicalData(patientId: string) {
    const data = this.getAllData();
    return data[patientId] || { diagnoses: [], treatmentPlans: [] };
  }

  public addDiagnosis(patientId: string, diagnosis: Omit<Diagnosis, 'id' | 'identifiedAt'>) {
    const data = this.getAllData();
    if (!data[patientId]) data[patientId] = { diagnoses: [], treatmentPlans: [] };
    
    const newDiagnosis: Diagnosis = {
      ...diagnosis,
      id: `DX-${Date.now()}`,
      identifiedAt: new Date().toISOString()
    };
    
    data[patientId].diagnoses.push(newDiagnosis);
    this.saveAllData(data);
    return newDiagnosis;
  }

  public updateDiagnosisStatus(patientId: string, diagnosisId: string, status: Diagnosis['status']) {
    const data = this.getAllData();
    if (data[patientId]) {
      const dx = data[patientId].diagnoses.find(d => d.id === diagnosisId);
      if (dx) {
        dx.status = status;
        this.saveAllData(data);
      }
    }
  }

  public createTreatmentPlan(patientId: string, plan: Omit<TreatmentPlan, 'id' | 'lastUpdated' | 'startDate'>) {
    const data = this.getAllData();
    if (!data[patientId]) data[patientId] = { diagnoses: [], treatmentPlans: [] };

    const newPlan: TreatmentPlan = {
      ...plan,
      id: `TP-${Date.now()}`,
      startDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    data[patientId].treatmentPlans.push(newPlan);
    this.saveAllData(data);
    return newPlan;
  }

  public updateTreatmentPlan(patientId: string, planId: string, updates: Partial<TreatmentPlan>) {
    const data = this.getAllData();
    if (data[patientId]) {
      const planIdx = data[patientId].treatmentPlans.findIndex(p => p.id === planId);
      if (planIdx !== -1) {
        data[patientId].treatmentPlans[planIdx] = {
          ...data[patientId].treatmentPlans[planIdx],
          ...updates,
          lastUpdated: new Date().toISOString()
        };
        this.saveAllData(data);
      }
    }
  }

  public syncPatientObject(patient: Patient): Patient {
    const clinical = this.getPatientClinicalData(patient.id);
    return {
      ...patient,
      diagnoses: clinical.diagnoses,
      treatmentPlans: clinical.treatmentPlans
    };
  }
}

export const clinicalModule = ClinicalDataModule.getInstance();
