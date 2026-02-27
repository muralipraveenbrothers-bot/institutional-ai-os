
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Package, Pill, Search, AlertTriangle, TrendingUp, 
  CheckCircle2, ShieldCheck, Zap, RefreshCw, 
  LogOut, Eye, EyeOff, Plus, 
  Upload, X, Info, ShoppingCart, History,
  BarChart3, Save, Scan, FileText, Activity, ShieldAlert,
  ChevronRight, Mic, Camera, ArrowUpRight, ArrowDownRight,
  ClipboardList, Clock, Loader2, ArrowLeft, Home,
  Scale, UserCheck, Calculator, FileSearch, TrendingDown,
  Lock, AlertCircle, List, Filter, Table, Database, Stethoscope, Beaker,
  Check, Trash2, Truck, FileInput, Receipt, Link, DollarSign, Brain,
  Gavel, FileWarning, Volume2, VolumeX, Pause, Play, Award, Compass, Star,
  User, Printer, Barcode as BarcodeIcon, Tag, BrainCircuit, Sparkles,
  Target, Bot, Share2, Smartphone, Building, UserCircle, MapPin, Cigarette,
  FilePlus, CheckCircle, ExternalLink, Map, Phone, Box, Siren,
  Bed, Minus, PlusCircle, Calendar, ChevronDown, QrCode, Archive
} from 'lucide-react';
import { Medication, Prescription, DistributorProfile, ShiftLedger } from '../../types';
import { DashboardGuard } from '../Shared/DashboardGuard';
import { 
  analyzePurchaseBillOCR, 
  sushrutPharmacyIntelligenceStream,
  speakText
} from '../../geminiService';
import { logEvent } from '../../utils/MonitorCore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from "qrcode";
import PmaiInsightsPanel from './PmaiInsightsPanel';
import ProtectionShiftLock from '../Shared/ProtectionShiftLock';
import { protectionService } from '../../utils/protectionLogic';

interface SaleRecord {
  id: string;
  date: string;
  patientName: string;
  patientMrn: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
}

interface PurchaseItem {
  name: string;
  batch: string;
  expiry: string;
  qty: number;
  purchasePrice: number;
  mrp: number;
  total: number;
}

interface PurchaseRecord {
  id: string;
  date: string;
  supplier: string;
  items: PurchaseItem[];
  totalCost: number;
  invoiceNo?: string;
}

const PharmacyDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [isSyncing, setIsSyncing] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions' | 'sales' | 'sales_history' | 'analytics' | 'ocr' | 'new_purchase' | 'purchase_history' | 'new_sale' | 'intelligence' | 'stock_radar'>('inventory');
  
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [showShiftLock, setShowShiftLock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- NEW SALE NODE STATE ---
  const [cart, setCart] = useState<{ med: Medication, qty: number }[]>([]);
  const [patientDetails, setPatientDetails] = useState({ name: '', mrn: '', phone: '' });
  const [isSaleProcessing, setIsSaleProcessing] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState(`PH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  const [currentBarcodeUrl, setCurrentBarcodeUrl] = useState<string>("");
  const [showCartMobile, setShowCartMobile] = useState(false);

  // --- PURCHASE STATE ---
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>(() => {
    const saved = localStorage.getItem("pharmacy_purchase_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [purchaseCart, setPurchaseCart] = useState<PurchaseItem[]>([]);
  const [newPurchaseItem, setNewPurchaseItem] = useState<PurchaseItem>({ name: '', batch: '', expiry: '', qty: 0, purchasePrice: 0, mrp: 0, total: 0 });
  const [supplierName, setSupplierName] = useState("");
  const [isProcessingPurchaseOCR, setIsProcessingPurchaseOCR] = useState(false);
  const purchaseFileInputRef = useRef<HTMLInputElement>(null);

  // --- SALES HISTORY STATE ---
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem("pharmacy_sales_history");
    return saved ? JSON.parse(saved) : [];
  });

  // --- INCOMING RX STATE ---
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
  const [isRxSyncing, setIsRxSyncing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const poll = () => {
       const orders = protectionService.getPendingPharmacyOrders();
       setIncomingOrders(orders);
    };
    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    QRCode.toDataURL(currentSaleId, {
      margin: 1,
      width: 120,
      color: { dark: '#ffffff', light: '#00000000' }
    }).then(url => setCurrentBarcodeUrl(url)).catch(e => console.error("QR Code Error:", e));
  }, [currentSaleId]);

  const [inventory, setInventory] = useState<Medication[]>(() => {
    const saved = localStorage.getItem("pharmacy_inventory");
    if (saved) return JSON.parse(saved);
    return [
      { drug_id: 'D101', name: 'Panto-D', molecule: 'Pantoprazole + Domperidone', stock: 120, sold_today: 0, min_stock: 50, profit_tier: 'HIGH', alternative_id: null, status: 'Active', cost: 145, purchase_price: 102, expiry: '2026-08-15', batch: 'B2201', gstPercent: 12 },
      { drug_id: 'D102', name: 'Augmentin Duo', molecule: 'Amoxycillin + Clavulanate', stock: 8, sold_today: 0, min_stock: 20, profit_tier: 'MEDIUM', alternative_id: 'D105', status: 'Low Stock', cost: 210, purchase_price: 165, expiry: '2025-12-01', batch: 'B8802', gstPercent: 12 },
      { drug_id: 'D105', name: 'Amoxy-Clav Alt', molecule: 'Amoxycillin + Clavulanate', stock: 45, sold_today: 0, min_stock: 15, profit_tier: 'HIGH', alternative_id: null, status: 'Active', cost: 195, purchase_price: 140, expiry: '2026-03-20', batch: 'B9911', gstPercent: 12 },
      { drug_id: 'D103', name: 'Calpol 650', molecule: 'Paracetamol', stock: 500, sold_today: 12, min_stock: 100, profit_tier: 'LOW', alternative_id: null, status: 'Active', cost: 32, purchase_price: 24, expiry: '2024-05-10', batch: 'B3303', gstPercent: 5 },
      { drug_id: 'D104', name: 'Fixpore 1 IN TAPE', molecule: 'Surgical Tape', stock: 34, sold_today: 2, min_stock: 10, profit_tier: 'MEDIUM', alternative_id: null, status: 'Active', cost: 68.75, purchase_price: 16.75, expiry: '2027-11-01', batch: 'MS-160', gstPercent: 12 },
      { drug_id: 'D106', name: 'Multiprex Cap', molecule: 'Multivitamin', stock: 85, sold_today: 5, min_stock: 10, profit_tier: 'HIGH', alternative_id: null, status: 'Active', cost: 120.13, purchase_price: 15.00, expiry: '2028-04-01', batch: 'Z25-459', gstPercent: 18 },
      { drug_id: 'D107', name: 'Ranmox-CV 625 Tabs', molecule: 'Amoxycillin', stock: 88, sold_today: 2, min_stock: 10, profit_tier: 'MEDIUM', alternative_id: null, status: 'Active', cost: 192.05, purchase_price: 61.00, expiry: '2026-08-01', batch: 'PT-1660A', gstPercent: 12 },
    ];
  });

  useEffect(() => {
    localStorage.setItem("pharmacy_inventory", JSON.stringify(inventory));
  }, [inventory]);

  const filteredInventoryForSales = useMemo(() => {
    return inventory.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.molecule.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  // --- RADAR LOGIC ---
  const { lowStock, deadStock, highDemand } = useMemo(() => {
    const low = inventory.filter(m => m.stock <= m.min_stock);
    const dead = inventory.filter(m => m.stock > (m.min_stock * 2) && m.sold_today === 0);
    const high = inventory.filter(m => m.sold_today > 4); // Threshold for high demand
    return { lowStock: low, deadStock: dead, highDemand: high };
  }, [inventory]);

  // --- SALES HANDLERS ---
  const handleAddToCart = (med: Medication) => {
    if (med.stock <= 0) {
      alert("Item out of stock in registry.");
      return;
    }
    const exists = cart.find(c => c.med.drug_id === med.drug_id);
    if (exists) {
      handleUpdateQty(med.drug_id, 1);
    } else {
      setCart([...cart, { med, qty: 1 }]);
    }
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.med.drug_id === id) {
        const newQty = Math.max(1, c.qty + delta);
        if (newQty > c.med.stock) {
           alert(`Insufficient stock. Max available: ${c.med.stock}`);
           return c;
        }
        return { ...c, qty: newQty };
      }
      return c;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(c => c.med.drug_id !== id));
  };

  const handleFillRx = (order: any) => {
    setPatientDetails({ name: order.patientName, mrn: order.patientId, phone: '' });
    
    const newCart: any[] = [];
    order.meds.forEach((m: any) => {
      const invMed = inventory.find(i => i.name.toUpperCase() === m.name.toUpperCase());
      if (invMed) {
        newCart.push({ med: invMed, qty: m.qty || 1 });
      }
    });

    setCart(newCart);
    setActiveTab('new_sale');
    protectionService.completePharmacyOrder(order.id);
    speakText(`Filling order for ${order.patientName}. Indent nodes loaded.`, "Zephyr");
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    if (!patientDetails.name) {
       alert("Patient name required for dispensing node registry.");
       return;
    }

    setIsSaleProcessing(true);
    const saleId = currentSaleId;
    
    const newInventory = [...inventory];
    cart.forEach(item => {
      const idx = newInventory.findIndex(m => m.drug_id === item.med.drug_id);
      if (idx !== -1) {
        newInventory[idx].stock -= item.qty;
        newInventory[idx].sold_today += item.qty;
      }
    });

    setInventory(newInventory);
    
    const newSale: SaleRecord = {
      id: saleId,
      date: new Date().toISOString(),
      patientName: patientDetails.name,
      patientMrn: patientDetails.mrn,
      items: cart.map(c => ({ name: c.med.name, qty: c.qty, price: c.med.cost })),
      total: cartTotal
    };
    
    const updatedHistory = [newSale, ...salesHistory];
    setSalesHistory(updatedHistory);
    localStorage.setItem("pharmacy_sales_history", JSON.stringify(updatedHistory));
    
    const doc = new jsPDF({ format: 'a5' });
    doc.text(`Invoice: ${saleId}`, 10, 10);
    doc.save(`Invoice_${saleId}.pdf`);
    
    setCart([]);
    setPatientDetails({ name: '', mrn: '', phone: '' });
    setCurrentSaleId(`PH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
    setIsSaleProcessing(false);
    setShowCartMobile(false);
    speakText(`Sale ${saleId} complete. Registry updated.`, "Zephyr");
  };

  const cartTotal = useMemo(() => cart.reduce((sum, i) => sum + (i.med.cost * i.qty), 0), [cart]);

  // --- PURCHASE HANDLERS ---
  const handlePurchaseOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPurchaseOCR(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const result = await analyzePurchaseBillOCR(base64, file.type);
        if (result && result.items) {
           const mappedItems = result.items.map((i: any) => ({
             name: i.name,
             batch: i.batch || 'B-' + Math.floor(Math.random() * 9999),
             expiry: i.expiry || '2026-01-01',
             qty: i.qty || 10,
             purchasePrice: i.price || 0,
             mrp: (i.price || 0) * 1.4,
             total: (i.qty || 10) * (i.price || 0)
           }));
           setPurchaseCart(prev => [...prev, ...mappedItems]);
           speakText("Invoice scanned. Items staged for verification.", "Zephyr");
        }
      } catch (err) {
        alert("OCR Failed. Please enter manually.");
      } finally {
        setIsProcessingPurchaseOCR(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const addToPurchaseCart = () => {
    if (!newPurchaseItem.name || !newPurchaseItem.qty) return;
    setPurchaseCart([...purchaseCart, { ...newPurchaseItem, total: newPurchaseItem.qty * newPurchaseItem.purchasePrice }]);
    setNewPurchaseItem({ name: '', batch: '', expiry: '', qty: 0, purchasePrice: 0, mrp: 0, total: 0 });
  };

  const commitPurchase = () => {
    if (purchaseCart.length === 0) return;
    
    const newInventory = [...inventory];
    purchaseCart.forEach(item => {
      const existingIdx = newInventory.findIndex(m => m.name.toLowerCase() === item.name.toLowerCase());
      if (existingIdx !== -1) {
        newInventory[existingIdx].stock += item.qty;
        newInventory[existingIdx].purchase_price = item.purchasePrice;
        newInventory[existingIdx].cost = item.mrp;
        newInventory[existingIdx].batch = item.batch;
        newInventory[existingIdx].expiry = item.expiry;
      } else {
        newInventory.push({
          drug_id: `D-${Date.now()}-${Math.floor(Math.random()*100)}`,
          name: item.name,
          molecule: 'Generic',
          stock: item.qty,
          sold_today: 0,
          min_stock: 10,
          profit_tier: 'MEDIUM',
          alternative_id: null,
          status: 'Active',
          cost: item.mrp,
          purchase_price: item.purchasePrice,
          expiry: item.expiry,
          batch: item.batch,
          gstPercent: 12
        });
      }
    });

    setInventory(newInventory);
    const record: PurchaseRecord = {
      id: `PUR-${Date.now()}`,
      date: new Date().toISOString(),
      supplier: supplierName || "Direct Purchase",
      items: purchaseCart,
      totalCost: purchaseCart.reduce((acc, i) => acc + i.total, 0)
    };
    
    const updatedHistory = [record, ...purchaseHistory];
    setPurchaseHistory(updatedHistory);
    localStorage.setItem("pharmacy_purchase_history", JSON.stringify(updatedHistory));
    
    setPurchaseCart([]);
    setSupplierName("");
    alert("Stock Updated Successfully");
    speakText("Inventory updated. Purchase log generated.", "Zephyr");
  };

  return (
    <DashboardGuard loading={isSyncing}>
      <div className="flex h-screen bg-[#05070a] overflow-hidden font-['Inter'] relative">
        <aside className="w-64 border-r border-gray-800 bg-[#070b14] flex flex-col shrink-0 relative z-50 shadow-2xl">
          <div className="p-8 border-b border-gray-800 bg-[#0a0f18]/50">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-xl">
                   <Package size={20} />
                </div>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">PHARMA-OS</h1>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
             <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-4 mb-4 italic">Core Registry</p>
                {[
                  { id: 'inventory', label: 'Node Inventory', icon: Database },
                  { id: 'stock_radar', label: 'Live Stock Radar', icon: Activity },
                  { id: 'prescriptions', label: 'Incoming Rx', icon: Stethoscope, badge: incomingOrders.length },
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setShowCartMobile(false); }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg border border-indigo-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                       <item.icon size={14} />
                       <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 && <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{item.badge}</span>}
                  </button>
                ))}
             </div>

             <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-4 mb-4 italic">Sales & Dispensing</p>
                {[
                  { id: 'new_sale', label: 'New Sale Node', icon: PlusCircle },
                  { id: 'sales_history', label: 'Sales History', icon: History },
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setShowCartMobile(false); }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg border border-indigo-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                       <item.icon size={14} />
                       <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                  </button>
                ))}
             </div>

             <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-4 mb-4 italic">Supply Chain</p>
                {[
                  { id: 'new_purchase', label: 'New Purchase', icon: FilePlus },
                  { id: 'purchase_history', label: 'Purchase History', icon: Truck },
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setShowCartMobile(false); }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-amber-600 text-white shadow-lg border border-amber-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                       <item.icon size={14} />
                       <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                  </button>
                ))}
             </div>
          </div>

          <div className="p-4 bg-[#0a0f18] border-t border-gray-800 space-y-2">
             <button onClick={() => setShowShiftLock(true)} className="w-full py-4 bg-indigo-600 text-white hover:bg-indigo-500 transition-all font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-2xl">
                <Lock size={16} /> [ LOCK SHIFT ]
             </button>
             <button onClick={onLogout} className="w-full py-4 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-2xl">
                <LogOut size={16} /> [ EXIT NODE ]
             </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-[#05070a] overflow-hidden pb-14 relative z-10">
           {activeTab === 'stock_radar' ? (
             <div className="flex-1 flex flex-col p-10 space-y-10 animate-in fade-in duration-500 overflow-hidden">
               <header className="flex items-center gap-6 shrink-0">
                  <div className="w-14 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-xl">
                     <Activity size={28} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Live Stock Radar</h2>
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 italic">Inventory Dynamics & Forecasting</p>
                  </div>
               </header>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
                 
                 {/* 🔴 CRITICAL LOW STOCK */}
                 <div className="bg-[#111827] border border-red-500/20 rounded-[40px] p-6 flex flex-col shadow-lg">
                    <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                       <AlertTriangle size={20} className="text-red-500 animate-pulse" />
                       <div>
                          <h4 className="text-lg font-black text-white uppercase italic">Critical Low</h4>
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">About to Complete</p>
                       </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                       {lowStock.map(m => (
                         <div key={m.drug_id} className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl group hover:bg-red-900/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-950/40 px-2 py-0.5 rounded">Stock: {m.stock}</span>
                               <span className="text-[9px] font-black text-gray-600 uppercase">Min: {m.min_stock}</span>
                            </div>
                            <p className="text-sm font-black text-white italic">{m.name}</p>
                            <button className="mt-3 w-full py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                               Reorder Node
                            </button>
                         </div>
                       ))}
                       {lowStock.length === 0 && <p className="text-center text-[10px] text-gray-600 italic py-10">Stocks Nominal</p>}
                    </div>
                 </div>

                 {/* 🟢 HIGH DEMAND (MORE SELLING) */}
                 <div className="bg-[#111827] border border-emerald-500/20 rounded-[40px] p-6 flex flex-col shadow-lg">
                    <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                       <TrendingUp size={20} className="text-emerald-500" />
                       <div>
                          <h4 className="text-lg font-black text-white uppercase italic">High Demand</h4>
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Fast Moving Items</p>
                       </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                       {highDemand.map(m => (
                         <div key={m.drug_id} className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl group hover:bg-emerald-900/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/40 px-2 py-0.5 rounded">Sold Today: {m.sold_today}</span>
                               <TrendingUp size={12} className="text-emerald-500" />
                            </div>
                            <p className="text-sm font-black text-white italic">{m.name}</p>
                            <button className="mt-3 w-full py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                               View Trend
                            </button>
                         </div>
                       ))}
                       {highDemand.length === 0 && <p className="text-center text-[10px] text-gray-600 italic py-10">No Trends Detected</p>}
                    </div>
                 </div>

                 {/* 🟠 DEAD STOCK (NOT SELLING) */}
                 <div className="bg-[#111827] border border-amber-500/20 rounded-[40px] p-6 flex flex-col shadow-lg">
                    <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                       <Archive size={20} className="text-amber-500" />
                       <div>
                          <h4 className="text-lg font-black text-white uppercase italic">Dead Stock</h4>
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Overstock / Zero Move</p>
                       </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                       {deadStock.map(m => (
                         <div key={m.drug_id} className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-2xl group hover:bg-amber-900/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-950/40 px-2 py-0.5 rounded">Holding: {m.stock}</span>
                               <span className="text-[9px] font-black text-gray-600 uppercase">Sold: 0</span>
                            </div>
                            <p className="text-sm font-black text-white italic">{m.name}</p>
                            <p className="text-[9px] text-gray-500 font-mono mt-1">Exp: {m.expiry}</p>
                            <button className="mt-3 w-full py-2 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                               Liquidate Plan
                            </button>
                         </div>
                       ))}
                       {deadStock.length === 0 && <p className="text-center text-[10px] text-gray-600 italic py-10">Inventory Optimal</p>}
                    </div>
                 </div>

               </div>
             </div>
           ) : activeTab === 'purchase_history' ? (
             <div className="flex-1 flex flex-col p-10 space-y-10 animate-in fade-in duration-500 overflow-hidden">
                <header className="flex items-center gap-6 shrink-0">
                   <div className="w-14 h-14 bg-amber-600 rounded-[22px] flex items-center justify-center text-white shadow-xl">
                      <Truck size={28} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Purchase Logs</h2>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1 italic">Inward Supply Chain Registry</p>
                   </div>
                </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111827] border border-white/5 rounded-[40px] shadow-3xl">
                   <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-[#0a0f18] border-b border-gray-800 z-10">
                         <tr className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">
                            <th className="p-6">Date</th>
                            <th className="p-6">Invoice ID</th>
                            <th className="p-6">Supplier</th>
                            <th className="p-6 text-center">Items</th>
                            <th className="p-6 text-right">Total Cost</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40">
                         {purchaseHistory.map((p) => (
                            <tr key={p.id} className="group hover:bg-amber-600/5 transition-all">
                               <td className="p-6 text-[10px] text-gray-400 font-mono">{new Date(p.date).toLocaleDateString()}</td>
                               <td className="p-6 text-xs font-bold text-white uppercase">{p.id}</td>
                               <td className="p-6 text-xs text-gray-300">{p.supplier}</td>
                               <td className="p-6 text-center text-xs font-black text-white">{p.items.length}</td>
                               <td className="p-6 text-right text-emerald-500 font-black italic">₹{p.totalCost.toLocaleString()}</td>
                            </tr>
                         ))}
                         {purchaseHistory.length === 0 && (
                            <tr><td colSpan={5} className="p-10 text-center text-xs text-gray-600 uppercase tracking-widest italic">No Purchase Records Found</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
           ) : activeTab === 'new_purchase' ? (
             <div className="flex-1 flex flex-col p-10 space-y-10 animate-in fade-in duration-500 overflow-hidden">
                <header className="flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-amber-600 rounded-[22px] flex items-center justify-center text-white shadow-xl">
                         <FilePlus size={28} />
                      </div>
                      <div>
                         <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">New Purchase Node</h2>
                         <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1 italic">Stock Entry & Invoice OCR</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <input type="file" ref={purchaseFileInputRef} className="hidden" onChange={handlePurchaseOCR} accept="image/*" />
                      <button 
                        onClick={() => purchaseFileInputRef.current?.click()}
                        className="px-6 py-3 bg-amber-600/10 border border-amber-500/20 text-amber-500 hover:bg-amber-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                      >
                         {isProcessingPurchaseOCR ? <Loader2 size={16} className="animate-spin"/> : <Scan size={16}/>} Scan Invoice
                      </button>
                      <button 
                        onClick={commitPurchase}
                        disabled={purchaseCart.length === 0}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-30 shadow-lg"
                      >
                         <Archive size={16}/> Commit Stock
                      </button>
                   </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                   {/* Manual Entry Form */}
                   <div className="lg:col-span-1 bg-[#111827] border border-white/5 p-6 rounded-[30px] shadow-xl overflow-y-auto custom-scrollbar">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-4 mb-4">Manual Item Entry</h4>
                      <div className="space-y-4">
                         <input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Supplier Name" className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500" />
                         <input value={newPurchaseItem.name} onChange={e => setNewPurchaseItem({...newPurchaseItem, name: e.target.value})} placeholder="Medicine Name" className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500" />
                         <div className="grid grid-cols-2 gap-3">
                            <input value={newPurchaseItem.batch} onChange={e => setNewPurchaseItem({...newPurchaseItem, batch: e.target.value})} placeholder="Batch No" className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500" />
                            <input value={newPurchaseItem.expiry} onChange={e => setNewPurchaseItem({...newPurchaseItem, expiry: e.target.value})} placeholder="Expiry (YYYY-MM-DD)" className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500" />
                         </div>
                         <div className="grid grid-cols-3 gap-3">
                            <input type="number" value={newPurchaseItem.qty || ''} onChange={e => setNewPurchaseItem({...newPurchaseItem, qty: parseInt(e.target.value)})} placeholder="Qty" className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500" />
                            <input type="number" value={newPurchaseItem.purchasePrice || ''} onChange={e => setNewPurchaseItem({...newPurchaseItem, purchasePrice: parseFloat(e.target.value)})} placeholder="Cost" className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500" />
                            <input type="number" value={newPurchaseItem.mrp || ''} onChange={e => setNewPurchaseItem({...newPurchaseItem, mrp: parseFloat(e.target.value)})} placeholder="MRP" className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500" />
                         </div>
                         <button onClick={addToPurchaseCart} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2">
                            <Plus size={14}/> Add to Manifest
                         </button>
                      </div>
                   </div>

                   {/* Staging List */}
                   <div className="lg:col-span-2 bg-[#0a0f18] border border-amber-500/20 rounded-[30px] p-6 shadow-inner flex flex-col">
                      <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                         <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Staging Manifest</h4>
                         <span className="text-xs font-black text-white italic">Total: ₹{purchaseCart.reduce((acc, i) => acc + i.total, 0).toLocaleString()}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                         {purchaseCart.map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-[#111827] rounded-xl border border-white/5">
                               <div>
                                  <p className="text-xs font-bold text-white uppercase italic">{item.name}</p>
                                  <p className="text-[8px] text-gray-500 font-mono">Batch: {item.batch} | Exp: {item.expiry}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-black text-white">{item.qty} x ₹{item.purchasePrice}</p>
                                  <p className="text-[9px] text-emerald-500 font-bold">MRP ₹{item.mrp}</p>
                               </div>
                               <button onClick={() => setPurchaseCart(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-gray-600 hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                         ))}
                         {purchaseCart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-20">
                               <Package size={48} className="mb-4 text-amber-500" />
                               <p className="text-[10px] font-black uppercase tracking-widest">Manifest Empty</p>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
           ) : activeTab === 'prescriptions' ? (
             <div className="flex-1 flex flex-col p-10 space-y-10 animate-in fade-in duration-500 overflow-hidden">
                <header className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-red-600 rounded-[22px] flex items-center justify-center text-white shadow-xl">
                      <Stethoscope size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Incoming Rx Registry</h2>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1 italic">Cross-Node Synchronized Worklist</p>
                    </div>
                  </div>
                  <button onClick={() => { setIsRxSyncing(true); setTimeout(() => setIsRxSyncing(false), 800); }} className="p-3 bg-[#0a0f18] border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-all">
                     <RefreshCw size={20} className={isRxSyncing ? 'animate-spin' : ''} />
                  </button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                   {incomingOrders.map((order, i) => (
                     <div key={order.id} className="bg-[#111827] border border-white/5 p-8 rounded-[50px] shadow-3xl flex flex-col md:flex-row items-center justify-between gap-10 group hover:border-red-500/20 transition-all">
                        <div className="flex items-center gap-8 flex-1">
                           <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border shadow-xl ${order.priority === 'STAT' ? 'bg-red-600 text-white border-red-400 animate-pulse' : 'bg-gray-900 text-gray-700 border-gray-800'}`}>
                              <Pill size={32} />
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{order.source} Indent • {new Date(order.timestamp).toLocaleTimeString()}</p>
                              <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{order.patientName}</h3>
                              <p className="text-[10px] font-mono text-gray-700">{order.patientId} • ID: {order.id}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-10">
                           <div className="text-right">
                              <p className="text-[9px] font-black text-gray-600 uppercase mb-2">Request Items</p>
                              <div className="flex gap-2">
                                 {order.meds.slice(0, 3).map((m: any, j: number) => (
                                   <span key={j} className="px-3 py-1 bg-black/40 border border-white/5 rounded-lg text-[8px] font-black text-slate-400 uppercase italic">{m.name}</span>
                                 ))}
                                 {order.meds.length > 3 && <span className="text-[10px] font-black text-indigo-400">+{order.meds.length - 3}</span>}
                              </div>
                           </div>
                           <button 
                             onClick={() => handleFillRx(order)}
                             className="px-10 py-5 bg-red-600 hover:bg-red-500 text-white rounded-[30px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 italic border border-white/10"
                           >
                              [ ACCEPT & FILL ]
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           ) : activeTab === 'new_sale' ? (
             <div className="flex-1 flex flex-col lg:flex-row overflow-hidden animate-in fade-in duration-500 relative">
                <div className={`flex-1 flex flex-col p-6 md:p-10 space-y-8 overflow-hidden transition-all duration-500 ${showCartMobile ? 'opacity-0 scale-95 pointer-events-none lg:opacity-100 lg:scale-100 lg:pointer-events-auto' : 'opacity-100 scale-100'}`}>
                   <header className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4 md:gap-6">
                         <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-600 rounded-[18px] md:rounded-[22px] flex items-center justify-center text-white shadow-xl">
                            <PlusCircle size={24} />
                         </div>
                         <div>
                            <h2 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tighter leading-none">New Sale Node</h2>
                            <p className="text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2 italic">Institutional Dispensing Engine v7.5</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => setShowCartMobile(true)}
                        className="lg:hidden relative p-4 bg-indigo-600 text-white rounded-2xl shadow-xl active:scale-95 transition-all"
                      >
                         <ShoppingCart size={20} />
                         {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[#05070a]">{cart.length}</span>}
                      </button>
                   </header>
                   <div className="bg-[#111827] border border-white/5 p-6 md:p-8 rounded-[40px] shadow-3xl space-y-6">
                      <h4 className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3 italic border-b border-white/5 pb-4">
                         <User size={16} /> Patient Metadata Entry
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                         <div className="space-y-2">
                            <label className="text-[8px] md:text-[9px] font-black text-gray-700 uppercase ml-2 tracking-widest italic">Patient Name</label>
                            <input 
                               value={patientDetails.name} onChange={e => setPatientDetails({ ...patientDetails, name: e.target.value })}
                               className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-5 py-3 md:px-6 md:py-4 text-[11px] md:text-xs font-bold text-white focus:border-indigo-500 outline-none transition-all shadow-inner" 
                               placeholder="Enter name..."
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[8px] md:text-[9px] font-black text-gray-700 uppercase ml-2 tracking-widest italic">MRN / Hospital ID</label>
                            <input 
                               value={patientDetails.mrn} onChange={e => setPatientDetails({ ...patientDetails, mrn: e.target.value })}
                               className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-5 py-3 md:px-6 md:py-4 text-[11px] md:text-xs font-bold text-white focus:border-indigo-500 outline-none transition-all shadow-inner" 
                               placeholder="MRN-XXXXX"
                            />
                         </div>
                      </div>
                   </div>
                   <div className="flex-1 flex flex-col min-h-0">
                      <div className="relative mb-6">
                         <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                         <input 
                            type="text" placeholder="Search medicines..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-[#111827] border border-indigo-500/20 rounded-[24px] md:rounded-[30px] pl-12 md:pl-16 pr-6 md:pr-8 py-4 md:py-5 text-base md:text-xl font-bold italic text-white focus:border-indigo-500 outline-none shadow-2xl transition-all"
                         />
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                         {filteredInventoryForSales.map(m => (
                            <div 
                              key={m.drug_id} 
                              onClick={() => handleAddToCart(m)}
                              className={`p-4 md:p-6 bg-[#0a0f18] border border-gray-800 rounded-[28px] md:rounded-[35px] hover:border-indigo-500/40 transition-all cursor-pointer group flex justify-between items-center shadow-inner ${m.stock <= 0 ? 'opacity-30 pointer-events-none grayscale' : m.stock <= m.min_stock ? 'border-amber-500/20' : ''}`}
                            >
                               <div className="flex items-center gap-4 md:gap-5">
                                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-[14px] md:rounded-[18px] flex items-center justify-center border transition-all ${m.stock <= m.min_stock ? 'bg-amber-950/20 border-amber-500/20 text-amber-500' : 'bg-[#111827] border-white/5 text-gray-500 group-hover:text-indigo-400 group-hover:border-indigo-500/20'}`}>
                                     <Pill size={20} />
                                  </div>
                                  <div className="max-w-[120px] md:max-w-none">
                                     <p className="text-xs md:text-[16px] font-black text-white uppercase italic leading-none group-hover:text-indigo-400 transition-colors">{m.name}</p>
                                     <p className="text-[7px] md:text-[9px] text-gray-600 font-bold uppercase mt-1 md:mt-2 truncate">{m.molecule}</p>
                                  </div>
                                </div>
                               <div className="text-right">
                                  <p className="text-xs md:text-lg font-black text-white italic tracking-tighter">₹{m.cost}</p>
                                  <p className={`text-[7px] md:text-[9px] font-black uppercase mt-1 ${m.stock <= m.min_stock ? 'text-amber-500' : 'text-emerald-500'}`}>{m.stock} unit</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
                <div className={`fixed inset-0 lg:relative lg:inset-auto z-[60] lg:z-10 w-full lg:w-[480px] bg-[#070b14] border-l border-gray-800 flex flex-col shadow-4xl transform transition-transform duration-500 ${showCartMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                   <div className="p-6 md:p-8 border-b border-gray-800 flex items-center justify-between bg-[#0a0f18]/40">
                      <div className="flex items-center gap-4">
                         <button onClick={() => setShowCartMobile(false)} className="lg:hidden p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white"><ArrowLeft size={18} /></button>
                         <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner"><ShoppingCart size={20} /></div>
                         <h3 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">Dispensing List</h3>
                      </div>
                      <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[8px] md:text-[9px] font-black uppercase italic shadow-lg">{cart.length} ITEMS</span>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                      {cart.map(item => (
                        <div key={item.med.drug_id} className="bg-[#0a0f18] border border-white/5 p-4 md:p-6 rounded-[28px] md:rounded-[35px] space-y-4 md:space-y-5 shadow-inner group animate-in slide-in-from-right-4">
                           <div className="flex justify-between items-start">
                              <div className="w-2/3">
                                 <p className="text-xs md:text-sm font-black text-white uppercase italic leading-tight group-hover:text-indigo-400 transition-colors">{item.med.name}</p>
                                 <p className="text-[7px] md:text-[8px] text-gray-700 uppercase font-black mt-1">Batch: {item.med.batch}</p>
                              </div>
                              <button onClick={() => handleRemoveFromCart(item.med.drug_id)} className="p-2 text-gray-700 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                           </div>
                           <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-3 bg-black/40 p-1 rounded-xl border border-white/5">
                                 <button onClick={() => handleUpdateQty(item.med.drug_id, -1)} className="p-2 text-gray-500 hover:text-white transition-colors"><Minus size={14}/></button>
                                 <span className="text-[10px] md:text-[12px] font-black text-white w-6 md:w-8 text-center">{item.qty}</span>
                                 <button onClick={() => handleUpdateQty(item.med.drug_id, 1)} className="p-2 text-gray-500 hover:text-white transition-colors"><Plus size={14}/></button>
                              </div>
                              <div className="text-right">
                                 <p className="text-[8px] text-gray-700 font-bold uppercase mb-1">Total</p>
                                 <p className="text-base md:text-xl font-black text-white italic tracking-tighter">₹{(item.med.cost * item.qty).toLocaleString()}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="p-6 md:p-8 border-t border-gray-800 bg-[#0a0f18]/80 space-y-6">
                      <div className="flex items-center justify-between bg-black/40 p-5 md:p-6 rounded-[28px] md:rounded-[35px] border border-white/5">
                         <div className="space-y-3">
                            <div>
                               <p className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest italic mb-1">Sale ID</p>
                               <p className="text-base md:text-xl font-mono font-black text-indigo-400">{currentSaleId}</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="p-1.5 bg-white rounded-lg">
                                  {currentBarcodeUrl && <img src={currentBarcodeUrl} alt="Barcode" className="w-10 h-10 md:w-16 md:h-16" />}
                               </div>
                            </div>
                         </div>
                         <div className="text-right flex flex-col justify-end">
                            <p className="text-[9px] md:text-[11px] font-black text-gray-500 uppercase tracking-widest italic mb-1">Total Amount</p>
                            <p className="text-3xl md:text-5xl font-black text-emerald-500 italic tracking-tighter">₹{cartTotal.toLocaleString()}</p>
                         </div>
                      </div>
                      <button 
                         onClick={handleCompleteSale}
                         disabled={cart.length === 0 || isSaleProcessing}
                         className="w-full py-6 md:py-10 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-[35px] md:rounded-[50px] font-black uppercase text-xs md:text-base tracking-[0.3em] md:tracking-[0.4em] shadow-[0_25px_60px_rgba(16,185,129,0.3)] transition-all active:scale-95 border-2 border-white/10 italic flex items-center justify-center gap-4 md:gap-8 group"
                      >
                         {isSaleProcessing ? <Loader2 size={24} className="animate-spin" /> : <Printer size={24} className="group-hover:rotate-12 transition-transform md:w-8 md:h-8" />}
                         [ DISPENSE & PRINT ]
                      </button>
                   </div>
                </div>
             </div>
           ) : activeTab === 'sales_history' ? (
             <div className="flex-1 flex flex-col p-10 space-y-10 animate-in fade-in duration-500 overflow-hidden">
                <header className="flex items-center gap-6 shrink-0">
                   <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-xl">
                      <History size={28} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Sales Registry</h2>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 italic">Dispensing Log & Transaction Audit</p>
                   </div>
                </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111827] border border-white/5 rounded-[40px] shadow-3xl">
                   <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-[#0a0f18] border-b border-gray-800 z-10">
                         <tr className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">
                            <th className="p-6">Date</th>
                            <th className="p-6">Invoice ID</th>
                            <th className="p-6">Patient</th>
                            <th className="p-6 text-center">Items</th>
                            <th className="p-6 text-right">Total</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40">
                         {salesHistory.map((sale) => (
                            <tr key={sale.id} className="group hover:bg-indigo-600/5 transition-all">
                               <td className="p-6 text-[10px] text-gray-400 font-mono">{new Date(sale.date).toLocaleString()}</td>
                               <td className="p-6 text-xs font-bold text-white uppercase">{sale.id}</td>
                               <td className="p-6">
                                  <p className="text-xs font-bold text-gray-300">{sale.patientName}</p>
                                  <p className="text-[9px] text-gray-600 font-mono">{sale.patientMrn}</p>
                               </td>
                               <td className="p-6 text-center text-xs font-black text-white">
                                  {sale.items.length}
                                  <div className="text-[8px] text-gray-500 font-normal mt-1 truncate max-w-[200px] mx-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                    {sale.items.map(i => i.name).join(', ')}
                                  </div>
                               </td>
                               <td className="p-6 text-right text-emerald-500 font-black italic">₹{sale.total.toLocaleString()}</td>
                            </tr>
                         ))}
                         {salesHistory.length === 0 && (
                            <tr><td colSpan={5} className="p-10 text-center text-xs text-gray-600 uppercase tracking-widest italic">No Sales Records Found</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
           ) : activeTab === 'inventory' ? (
             <div className="flex-1 flex flex-col p-10 space-y-8 animate-in fade-in duration-500 overflow-hidden">
                <header className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                      <Database size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Node Inventory</h2>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 italic">Real-Time Formulary Ledger</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                      <input 
                        type="text" placeholder="Filter medicines..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="bg-[#0a0f18] border border-gray-800 rounded-2xl pl-12 pr-6 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-80 shadow-inner"
                      />
                    </div>
                  </div>
                </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111827] border border-white/5 rounded-[40px] shadow-3xl">
                   <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-[#0a0f18] border-b border-gray-800 z-10">
                        <tr className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">
                          <th className="p-6">Medication Node</th>
                          <th className="p-6">Molecule Composition</th>
                          <th className="p-6 text-center">Batch / Expiry</th>
                          <th className="p-6 text-center">Stock Level</th>
                          <th className="p-6 text-right">Unit MRP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40">
                         {filteredInventoryForSales.map(m => (
                           <tr key={m.drug_id} className="group hover:bg-indigo-600/5 transition-all cursor-pointer">
                             <td className="p-6">
                               <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${m.stock <= m.min_stock ? 'bg-red-600/10 border-red-500/40 text-red-500' : 'bg-gray-800 border-white/5 text-gray-600 group-hover:text-indigo-400 group-hover:border-indigo-500/20'}`}>
                                    <Pill size={18} />
                                 </div>
                                 <div>
                                   <p className="text-sm font-black text-white uppercase italic leading-none">{m.name}</p>
                                   <p className="text-[8px] text-gray-600 font-bold uppercase mt-1.5">{m.drug_id}</p>
                                 </div>
                               </div>
                             </td>
                             <td className="p-6">
                               <p className="text-xs text-slate-400 italic font-medium leading-relaxed max-w-xs truncate">{m.molecule}</p>
                             </td>
                             <td className="p-6 text-center">
                               <p className="text-[10px] font-black text-gray-400 uppercase leading-none">{m.batch}</p>
                               <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">{m.expiry}</p>
                             </td>
                             <td className="p-6 text-center">
                               <div className="flex flex-col items-center gap-2">
                                  <span className={`text-xl font-black italic ${m.stock <= m.min_stock ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>{m.stock}</span>
                               </div>
                             </td>
                             <td className="p-6 text-right">
                               <p className="text-lg font-black text-white italic tracking-tighter">₹{m.cost}</p>
                             </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-10 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-12 opacity-10 grayscale select-none">
                   <Building size={200} className="mx-auto" />
                   <h3 className="text-3xl md:text-7xl font-black uppercase tracking-[0.3em] md:tracking-[0.5em] italic leading-tight">Institutional <br/> Node Standby</h3>
                </div>
             </div>
           )}
        </main>
      </div>

      {showShiftLock && (
        <ProtectionShiftLock 
          userId="PHARMACY-ROOT" 
          onClose={() => setShowShiftLock(false)} 
          onShiftClosed={() => { setShowShiftLock(false); onLogout?.(); }} 
        />
      )}
    </DashboardGuard>
  );
};

export default PharmacyDashboard;
