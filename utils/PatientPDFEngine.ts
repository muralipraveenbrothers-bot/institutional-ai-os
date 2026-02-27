/* ======================================================
   PRINTABLE PDF ENGINE v1.5
   Now supporting Multi-Language Wellness Plans
   ====================================================== */

declare global {
  interface Window {
    __PDF_ENGINE__?: {
      ready: boolean;
    };
  }
}

if (typeof window !== 'undefined' && !window.__PDF_ENGINE__) {
  window.__PDF_ENGINE__ = { ready: true };
}

const LABELS: Record<string, any> = {
  "en-US": {
    title: "Clinical Wellness Plan",
    approved: "Institutional Approved Node",
    caution: "PRECAUTION: Continue all medications as prescribed.",
    doctor: "Authorized Consultant Signature",
    patient: "Patient/Guardian Signature",
    disclaimer: "Supportive care guidance. Verified via SUSRUTA Wellness Node."
  },
  "te-IN": {
    title: "క్లినికల్ వెల్నెస్ ప్లాన్",
    approved: "సంస్థ ఆమోదించిన పత్రం",
    caution: "జాగ్రత్త: సూచించిన మందులను వాడటం కొనసాగించండి.",
    doctor: "అధికారిక డాక్టర్ సంతకం",
    patient: "రోగి సంతకం",
    disclaimer: "సహాయక సంరక్షణ సూచనలు. సుశ్రుత వెల్నెస్ నోడ్ ద్వారా ధృవీకరించబడింది."
  },
  "hi-IN": {
    title: "क्लिनिकल वेलनेस प्लान",
    approved: "संस्थागत स्वीकृत दस्तावेज़",
    caution: "सावधानी: निर्धारित दवाएं लेना जारी रखें।",
    doctor: "अधिकृत डॉक्टर के हस्ताक्षर",
    patient: "रोगी के हस्ताक्षर",
    disclaimer: "सहायक देखभाल मार्गदर्शन। सुश्रुत वेलनेस नोड द्वारा सत्यापित।"
  }
};

export function generatePatientPDF(input: {
  module: string;
  language: string;
  hospitalName: string;
  patientSummary: string;
  adviceSteps?: string[];
  estimate?: any;
  doctorApproved: boolean;
  doctorName?: string;
  dateTime?: string;
}) {
  if (!input.doctorApproved) {
    alert("⛔ Institutional approval required before printing.");
    return;
  }

  const langKey = input.language === 'te-IN' ? 'te-IN' : input.language === 'hi-IN' ? 'hi-IN' : 'en-US';
  const L = LABELS[langKey] || LABELS["en-US"];
  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(`
  <html>
    <head>
      <title>${L.title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
        .header { border-bottom: 4px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        h1 { margin: 0; color: #064e3b; font-size: 26px; text-transform: uppercase; font-style: italic; }
        .badge { padding:6px 14px; background: #ecfdf5; border:1px solid #10b981; color:#065f46; display:inline-block; border-radius:8px; font-weight: 900; font-size: 11px; text-transform: uppercase; }
        .summary-box { background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px; font-size: 14px; font-weight: 700; }
        .content-area { font-size: 15px; white-space: pre-wrap; color: #334155; }
        .caution-box { background: #fffbeb; border: 1px solid #fcd34d; padding: 20px; border-radius: 12px; margin-top: 40px; color: #92400e; font-weight: 800; font-size: 14px; }
        .footer-sigs { margin-top: 80px; display: flex; justify-content: space-between; padding-top: 20px; }
        .sig-box { width: 250px; border-top: 1px solid #94a3b8; text-align: center; font-size: 12px; padding-top: 8px; font-weight: 700; text-transform: uppercase; }
        .disclaimer { margin-top: 50px; text-align: center; font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${L.title}</h1>
          <div style="font-weight: 900; color: #10b981; font-size: 14px; margin-top: 5px;">${input.hospitalName}</div>
        </div>
        <div class="badge">${L.approved}</div>
      </div>

      <div class="summary-box">
        ${input.patientSummary.replace(/\n/g, '<br/>')}
      </div>

      <div class="content-area">
        ${input.adviceSteps?.join("\n\n") || "No advice steps generated."}
      </div>

      <div class="caution-box">
        ${L.caution}
      </div>

      <div class="footer-sigs">
        <div class="sig-box">${L.patient}</div>
        <div class="sig-box">${L.doctor}</div>
      </div>

      <div class="disclaimer">${L.disclaimer} • ${input.dateTime || new Date().toLocaleString()}</div>
    </body>
  </html>
  `);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 500);
}
