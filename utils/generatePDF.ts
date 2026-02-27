import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, Investigation } from '../types';

interface DischargeData {
  patientName: string;
  age: number;
  sex: string;
  ipNumber: string;
  admissionDate: string;
  dischargeDate: string;
  diagnosis: string;
  treatmentGiven: string[];
  medications: { name: string; dosage: string; frequency: string }[];
  advice: string[];
  doctorName: string;
}

export const generateLabReportPDF = (patient: Patient, investigation: Investigation) => {
  const doc = new jsPDF({ format: 'a4' });
  const res = investigation.labResult;
  if (!res) return;

  // --- 1. HEADER ---
  doc.setFillColor(15, 23, 42); // Deep slate
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("PM BROTHERS MULTISPECIALITY HOSPITAL", 105, 20, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("INSTITUTIONAL DIAGNOSTIC NODE • PRECISION LABORATORY SERVICES", 105, 28, { align: 'center' });

  // --- 2. PATIENT INFO (Compact) ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Patient: ${patient.name?.toUpperCase()}`, 15, 55);
  doc.text(`Age/Sex: ${patient.age}Y / ${patient.gender?.toUpperCase()}`, 15, 62);
  doc.text(`MRN: ${patient.id}`, 140, 55);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 62);
  doc.setLineWidth(0.5);
  doc.line(15, 68, 195, 68);

  // --- 3. RESULT TABLE (3-COLUMN FORMAT: INVESTIGATION | VALUE | REFERENCE) ---
  autoTable(doc, {
    startY: 80,
    head: [['Test Investigation', 'Observed Value', 'Reference Range']],
    body: [[
      res.testName?.toUpperCase(),
      { content: res.value, styles: { fontStyle: 'bold', fontSize: 18 } },
      res.referenceRange
    ]],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], fontSize: 10, fontStyle: 'bold', cellPadding: 10 },
    bodyStyles: { fontSize: 12, textColor: [30, 41, 59], cellPadding: 10 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 50 },
      2: { cellWidth: 40 }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 120;

  // --- 4. CLINICIAN'S BRIEF (MAX 2-3 LINES + CORRELATION NOTE) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("Clinician's Analytical Brief:", 15, finalY + 20);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  
  const interpretation = res.interpretation || "Results analyzed within standard parameters.";
  const correlationNote = "PLEASE CORRELATE CLINICALLY.";
  const fullBrief = `${interpretation} ${interpretation.includes(correlationNote) ? '' : correlationNote}`;
  
  const briefLines = doc.splitTextToSize(fullBrief, 180).slice(0, 4);
  doc.text(briefLines, 15, finalY + 28);

  // --- 5. AUTHORIZATION & FOOTER (STRICT SINGLE PAGE) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("AUTHORIZED PATHOLOGIST", 140, 260);
  doc.setLineWidth(0.3);
  doc.line(135, 255, 195, 255);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("This is a computer-generated diagnostic record. verified via institutional sync node.", 105, 285, { align: 'center' });

  doc.save(`${patient.name}_Laboratory_Report.pdf`);
};

export const generateDischargeSummary = (data: DischargeData) => {
  const doc = new jsPDF();
  doc.setFillColor(13, 148, 136); 
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("MEDICARE HOSPITAL", 105, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Kothagudem, Telangana, India | Ph: +91 98765 43210", 105, 25, { align: 'center' });
  doc.text("Excellence in AI-Powered Care", 105, 32, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text("DISCHARGE SUMMARY", 105, 50, { align: 'center' });
  doc.line(80, 52, 130, 52); 
  doc.setFontSize(10);
  doc.text(`Patient Name: ${data.patientName}`, 14, 65);
  doc.text(`Age/Sex: ${data.age} / ${data.sex}`, 14, 72);
  doc.text(`IP Number: ${data.ipNumber}`, 150, 65);
  doc.text(`DOA: ${data.admissionDate}`, 150, 72);
  doc.text(`DOD: ${data.dischargeDate}`, 150, 79);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Final Diagnosis:", 14, 90);
  doc.setFont('helvetica', 'normal');
  const diagnosisLines = doc.splitTextToSize(data.diagnosis, 180);
  doc.text(diagnosisLines, 14, 97);
  const txY = 97 + (diagnosisLines.length * 7);
  doc.setFont('helvetica', 'bold');
  doc.text("Treatment Given:", 14, txY);
  doc.setFont('helvetica', 'normal');
  data.treatmentGiven.forEach((tx, index) => {
    doc.text(`• ${tx}`, 14, (txY + 7) + (index * 6));
  });
  const medRows = data.medications.map(med => [med.name, med.dosage, med.frequency]);
  autoTable(doc, {
    startY: txY + 15 + (data.treatmentGiven.length * 6),
    head: [['Medicine Name', 'Dosage', 'Frequency']],
    body: medRows,
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136] }, 
  });
  const finalYSummary = (doc as any).lastAutoTable?.finalY || 150;
  doc.setFont('helvetica', 'bold');
  doc.text("Advice on Discharge:", 14, finalYSummary + 15);
  doc.setFont('helvetica', 'normal');
  data.advice.forEach((item, index) => {
    doc.text(`• ${item}`, 14, finalYSummary + 22 + (index * 6));
  });
  doc.text("__________________________", 150, 270);
  doc.text(`Dr. ${data.doctorName}`, 150, 275);
  doc.text("Consultant Physician", 150, 280);
  doc.setFontSize(8);
  doc.text("Generated by MediCare AI System", 105, 290, { align: 'center' });
  doc.save(`${data.patientName}_Discharge_Summary.pdf`);
};

export const generateRegistrationSlip = (patient: Patient) => {
  const doc = new jsPDF({ format: 'a5' });
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 0, 148, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("MEDICARE AI - REGISTRY SLIP", 74, 15, { align: 'center' });
  doc.setFontSize(8);
  doc.text("INSTITUTIONAL NODE: 101-TX-M6", 74, 22, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`MR NUMBER: ${patient.id}`, 10, 45);
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, 100, 45);
  doc.line(10, 48, 138, 48);
  doc.setFontSize(12);
  doc.text(`NAME: ${patient.name.toUpperCase()}`, 10, 60);
  doc.setFontSize(10);
  doc.text(`AGE/GENDER: ${patient.age}Y / ${patient.gender.toUpperCase()}`, 10, 70);
  doc.text(`PHONE: ${patient.phone}`, 10, 80);
  doc.setFont('helvetica', 'bold');
  doc.text("CHIEF COMPLAINT:", 10, 100);
  doc.setFont('helvetica', 'normal');
  const complaintLines = doc.splitTextToSize(patient.chiefComplaint || 'Routine Checkup', 128);
  doc.text(complaintLines, 10, 108);
  doc.setFillColor(248, 250, 252);
  doc.rect(10, 140, 128, 40, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("PRESENT THIS SLIP AT NURSE TRIAGE NODE", 74, 150, { align: 'center' });
  doc.text("GATE STATUS: UNLOCKED", 74, 160, { align: 'center' });
  doc.save(`${patient.name}_Reg_Slip.pdf`);
};