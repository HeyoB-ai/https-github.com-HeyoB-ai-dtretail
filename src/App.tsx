import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Store as StoreIcon,
  ShoppingBag,
  DollarSign,
  Percent,
  Truck,
  Users,
  CloudRain,
  Sun,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database,
  Sparkles,
  Clock,
  ArrowLeftRight,
  MapPin,
  Smile,
  ShieldAlert,
  Search,
  MessageSquare,
  RefreshCw,
  ArrowRight,
  BarChart,
  HelpCircle,
  AlertCircle,
  Snowflake,
  Landmark
} from "lucide-react";

import { Store, SimulationParams, Alert, DataSource } from "./types";
import { getInitialStoresData, runSimulation, getLiveAlerts, getDataSources } from "./data";

// DEMO bank feed. In productie vervangen door een SERVER-SIDE aanroep naar een
// licensed PSD2/AIS-aggregator (bijv. GoCardless Bank Account Data, Tink, TrueLayer),
// met expliciete toestemming (consent) van de rekeninghouder. Nooit bankcredentials client-side.
function fetchBankData(stores) {
  return stores.map(s => ({
    id: s.id,
    city: s.city,
    balance: Math.round(s.revenue * 0.55),   // gesimuleerd kassaldo (ex btw)
    monthlyCashflow: s.ebitda,                // proxy voor maandelijkse cashflow
    inventoryValue: s.totalStockValue,
  }));
}

export default function App() {
  // 1. Core States
  const baseStores = useMemo(() => getInitialStoresData(), []);
  
  const [params, setParams] = useState<SimulationParams>({
    globalDiscountBoost: 0,
    staffPlanningRatio: 1.0,
    runInterStoreTransfers: false,
    weatherScenario: "normal",
    priceAdjustment: 0,
    activeLocalCampaignStoreId: "none",
  });

  // Actions log for the twin control terminal
  const [logs, setLogs] = useState<string[]>([
    "Digital Twin Control-engine geladen op v4.1.0",
    "Gekoppeld met 7 live databronnen",
    "Base-parameters ingelezen uit ERP en POS kassasystemen",
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("nl-NL");
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
  };

  // Derive simulated stores from base data and live params
  const currentStores = useMemo(() => {
    return runSimulation(baseStores, params);
  }, [baseStores, params]);

  // Financiën-laag: afgeleid uit de gesimuleerde winkeldata via de fetchBankData-naad (PSD2-klaar)
  const bankData = fetchBankData(currentStores);
  const finKas = bankData.reduce((a, b) => a + b.balance, 0);
  const finCashflow = bankData.reduce((a, b) => a + b.monthlyCashflow, 0);
  const finVoorraad = bankData.reduce((a, b) => a + b.inventoryValue, 0);
  const finWerkkapitaal = finKas + finVoorraad;

  // Derive warnings and alerts based on current simulation outcome
  const currentAlerts = useMemo(() => {
    return getLiveAlerts(currentStores);
  }, [currentStores]);

  // Handled alerts tracking to allow manual 'solving' in UI
  const [resolvedAlertIds, setResolvedAlertIds] = useState<string[]>([]);
  
  const activeAlerts = useMemo(() => {
    return currentAlerts.filter(a => !resolvedAlertIds.includes(a.id));
  }, [currentAlerts, resolvedAlertIds]);

  const handleResolveAlert = (alert: Alert) => {
    setResolvedAlertIds(prev => [...prev, alert.id]);
    addLog(`Alert opgelost: ${alert.title} in vestiging ${alert.storeName}`);
    
    // Automatically apply appropriate parameters to model "solving" the problem
    if (alert.type === "size_break") {
      setParams(prev => ({ ...prev, runInterStoreTransfers: true }));
      addLog("Strategische actie: Interne schoenoverplaatsingen DIRECT geactiveerd");
    } else if (alert.type === "staffing_shortage") {
      setParams(prev => ({ ...prev, staffPlanningRatio: 1.2 }));
      addLog("Strategische actie: Vloerbezetting-planner verhoogd naar 1.2x");
    } else if (alert.type === "low_conversion") {
      setParams(prev => ({ ...prev, staffPlanningRatio: 1.15, priceAdjustment: -3 }));
      addLog("Strategische actie: Bezetting verhoogd en lichte prijsmarge-correctie toegepast");
    } else if (alert.type === "unprofitable") {
      setParams(prev => ({ ...prev, priceAdjustment: 4, globalDiscountBoost: 0 }));
      addLog("Strategische actie: Margeherstel-actie gestart - kortingen verlaagd naar 0%");
    } else if (alert.type === "online_demand") {
      setParams(prev => ({ ...prev, runInterStoreTransfers: true }));
      addLog("Strategische actie: Omnichannel stock-route geopend vanuit Utrecht");
    }
  };

  // 2. Selected Store microscope
  const [selectedStoreId, setSelectedStoreId] = useState<string>("utrecht-oudegracht");
  const selectedStore = useMemo(() => {
    return currentStores.find(s => s.id === selectedStoreId) || currentStores[0];
  }, [currentStores, selectedStoreId]);

  // Selected store microscope tabs
  const [activeTab, setActiveTab] = useState<string>("vloer");

  // 3. AI Strategic Advisor Chat Drawer
  const [adviceText, setAdviceText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [adviceSource, setAdviceSource] = useState<"gemini" | "heuristic" | "error-fallback" | null>(null);
  const [advisorExpanded, setAdvisorExpanded] = useState<boolean>(true);

  // Trigger Gemini Analysis based on active parameters
  const requestAIAdvice = async () => {
    setIsAnalyzing(true);
    setAdviceText("");
    addLog("AI Advies aangevraagd. Analyseert live simulatie-variabelen via Gemini 3.5...");
    
    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storesData: currentStores,
          params: params
        })
      });
      
      const data = await response.json();
      setAdviceText(data.advice || "Geen advies ontvangen.");
      setAdviceSource(data.source);
      
      if (data.source === "gemini") {
        addLog("AI Strategisch Rapport succesvol gegenereerd via Gemini 3.5");
      } else {
        addLog("Heuristisch Advies gegenereerd (Lokale back-up engine geactiveerd)");
      }
    } catch (err) {
      console.error(err);
      addLog("Fout bij AI aanvraag. Lokale regel-gebaseerde aanbevelingen klaargezet.");
      setAdviceText("Fout bij verbinden met Gemini API. Controleer uw internetverbinding of API credentials.");
      setAdviceSource("error-fallback");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run AI advice on initial mount
  useEffect(() => {
    requestAIAdvice();
  }, []);

  // 4. Rollup KPIs for the entire chain
  const totalChainMetrics = useMemo(() => {
    const revenue = currentStores.reduce((sum, s) => sum + s.revenue, 0);
    const costOfStock = currentStores.reduce((sum, s) => sum + s.totalStockValue, 0);
    const grossMargin = currentStores.reduce((sum, s) => sum + s.grossMargin, 0);
    const ebitda = currentStores.reduce((sum, s) => sum + s.ebitda, 0);
    const baseRevenue = baseStores.reduce((sum, s) => sum + s.revenue, 0);
    const totalTransactions = currentStores.reduce((sum, s) => sum + s.transactions, 0);
    const sizeBreaks = currentStores.reduce((sum, s) => sum + s.sizeBreaksCount, 0);
    const averageMarginPercent = Math.round((grossMargin / revenue) * 100);

    const revenueDelta = ((revenue - baseRevenue) / baseRevenue) * 100;
    const avgGmroi = parseFloat((grossMargin / costOfStock).toFixed(2)) * 10; // amplified index

    // Rent analysis
    const totalArea = currentStores.reduce((sum, s) => sum + s.squareMeters, 0);
    const avgRent = Math.round(currentStores.reduce((sum, s) => sum + (s.squareMeters * s.rentPerSqm), 0) / totalArea);

    return {
      revenue,
      revenueDelta,
      averageMarginPercent,
      ebitda,
      avgGmroi,
      totalTransactions,
      sizeBreaks,
      avgRent
    };
  }, [currentStores, baseStores]);

  // Recalculate anytime weather or critical params change
  const handleScenarioPreset = (preset: "rainy_weekend" | "sale_clearance" | "optimized_staff" | "normal") => {
    if (preset === "rainy_weekend") {
      setParams({
        globalDiscountBoost: 0,
        staffPlanningRatio: 1.1,
        runInterStoreTransfers: true,
        weatherScenario: "rainy",
        priceAdjustment: 0,
        activeLocalCampaignStoreId: "utrecht-oudegracht",
      });
      addLog("Scenario geactiveerd: REGENACHTIG WEEKEND (Hogere bezetting, Laarzen promotie heft Utrecht)");
    } else if (preset === "sale_clearance") {
      setParams({
        globalDiscountBoost: 15,
        staffPlanningRatio: 1.3,
        runInterStoreTransfers: true,
        weatherScenario: "sunny",
        priceAdjustment: -5,
        activeLocalCampaignStoreId: "rotterdam-koopgoot",
      });
      addLog("Scenario geactiveerd: ZALEN UITVERKOOP (Maximale kortingen, extra weekendhulp Rotterdam)");
    } else if (preset === "optimized_staff") {
      setParams({
        globalDiscountBoost: 2,
        staffPlanningRatio: 1.25,
        runInterStoreTransfers: true,
        weatherScenario: "normal",
        priceAdjustment: 3,
        activeLocalCampaignStoreId: "none",
      });
      addLog("Scenario geactiveerd: OPERATIONELE EXCELLENCE (Marges verhoogd, transfers actief, +25% bezetting)");
    } else {
      setParams({
        globalDiscountBoost: 0,
        staffPlanningRatio: 1.0,
        runInterStoreTransfers: false,
        weatherScenario: "normal",
        priceAdjustment: 0,
        activeLocalCampaignStoreId: "none",
      });
      addLog("Scenario gereset naar de BASISLIJN STAND");
    }
  };

  // Sync state data sources count
  const dataSourcesList = useMemo(() => getDataSources(), []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 antialiased">
      
      {/* HEADER SECTION */}
      <header className="border-b border-white/10 bg-[#0f0f0f] px-8 py-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center font-bold text-black font-display tracking-tight shrink-0 scale-95 md:scale-100">S</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-medium tracking-tight text-white font-display">
                  SOLE-TWIN <span className="text-emerald-500">/ DIGITAL TWIN</span>
                </h1>
                <span className="text-[10px] bg-white/5 text-slate-400 font-mono px-2 py-0.5 rounded border border-white/10">v4.1</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono uppercase tracking-wider">
                <Clock className="w-3 h-3 text-emerald-500/70" />
                Live Sync Active • {dataSourcesList.length} Databronnen • 1 juni 2026
              </p>
            </div>
          </div>

          <div className="flex gap-6 text-[10px] uppercase tracking-widest text-slate-500 font-mono py-1">
            <div className="flex flex-col">
              <span className="text-[9px] text-emerald-500/50">System Status</span>
              <span className="text-emerald-400 font-medium">Live Sync Active</span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-6">
              <span className="text-[9px]">Network Health</span>
              <span className="text-slate-300 font-medium">7 Stores Online</span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-6">
              <span className="text-[9px]">Global GMROI</span>
              <span className="text-slate-100 italic transition-all">{(totalChainMetrics.avgGmroi / 10).toFixed(2)}x</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-450 text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded">
              Huidig Scenario: <span className="text-emerald-400 font-bold">
                {params.weatherScenario === "rainy" 
                  ? "Regenachtig Weekend" 
                  : params.globalDiscountBoost > 10 
                  ? "Grote Uitverkoop" 
                  : params.priceAdjustment > 0 && params.runInterStoreTransfers 
                  ? "Operationele Optimalisatie" 
                  : "Standaard Bedrijfsvoering (Basislijn)"}
              </span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">

        {/* 1. BRAND NEW REALTIME CHAIN KPIS BANNER */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <div className="bg-[#0f0f0f] border border-white/5 p-4 rounded flex flex-col justify-between hover:border-white/20 transition-all duration-300">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">OMZET KETEN</span>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-lg md:text-xl font-light font-mono text-white tracking-tight">
                €{totalChainMetrics.revenue.toLocaleString("nl-NL")}
              </span>
              <span className={`text-[10px] font-mono flex items-center ${totalChainMetrics.revenueDelta >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                {totalChainMetrics.revenueDelta >= 0 ? "▲" : "▼"}{Math.abs(totalChainMetrics.revenueDelta).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-white/5 h-1 mt-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${totalChainMetrics.revenueDelta >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                style={{ width: `${Math.min(100, 60 + totalChainMetrics.revenueDelta * 2)}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 p-4 rounded flex flex-col justify-between hover:border-white/20 transition-all duration-300">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">KORTING EFFECT</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-lg md:text-xl font-light font-mono text-white tracking-tight">
                €{(totalChainMetrics.revenue * (params.globalDiscountBoost / 100)).toLocaleString("nl-NL", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1 py-0.2 rounded">
                +{params.globalDiscountBoost}% boost
              </span>
            </div>
            <div className="w-full bg-white/5 h-1 mt-3 overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${(params.globalDiscountBoost / 30) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 p-4 rounded flex flex-col justify-between hover:border-white/20 transition-all duration-300">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">GEM. BRUTOMARGE</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-lg md:text-xl font-light font-mono text-white tracking-tight">
                {totalChainMetrics.averageMarginPercent}%
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                Target: 45%
              </span>
            </div>
            <div className="w-full bg-white/5 h-1 mt-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${totalChainMetrics.averageMarginPercent >= 42 ? "bg-emerald-500" : "bg-rose-500"}`}
                style={{ width: `${totalChainMetrics.averageMarginPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 p-4 rounded flex flex-col justify-between hover:border-white/20 transition-all duration-300">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">EBITDA BIJDRAGE</span>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className={`text-lg md:text-xl font-medium font-mono tracking-tight ${totalChainMetrics.ebitda >= 200000 ? "text-emerald-400" : "text-white"}`}>
                €{totalChainMetrics.ebitda.toLocaleString("nl-NL")}
              </span>
            </div>
            <div className="w-full bg-white/5 h-1 mt-3 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (totalChainMetrics.ebitda / 380000) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 p-4 rounded flex flex-col justify-between hover:border-white/20 transition-all duration-300">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">GMROI INDEX</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-lg md:text-xl font-light font-mono text-emerald-400 tracking-tight">
                {totalChainMetrics.avgGmroi}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                Marge/€
              </span>
            </div>
            <div className="w-full bg-white/5 h-1 mt-3 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (totalChainMetrics.avgGmroi / 30) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 p-4 rounded flex flex-col justify-between hover:border-white/20 transition-all duration-300">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">MAATBREUKEN KNELPUNT</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className={`text-lg md:text-xl font-light font-mono tracking-tight ${totalChainMetrics.sizeBreaks > 60 ? "text-rose-400" : "text-emerald-400"}`}>
                {totalChainMetrics.sizeBreaks} stuks
              </span>
              {params.runInterStoreTransfers && (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded font-mono font-medium animate-pulse">
                  Schonendicht!
                </span>
              )}
            </div>
            <div className="w-full bg-white/5 h-1 mt-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${totalChainMetrics.sizeBreaks > 60 ? "bg-rose-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, (totalChainMetrics.sizeBreaks / 140) * 100)}%` }}
              />
            </div>
          </div>

        </div>

        {/* MAIN BODY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: SIMULATOR CONTROLS, SANDBOX & ALERTS (Lg span 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 9. THE SIMULATOR ENVIRONMENT */}
            <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded space-y-4 shadow-sm hover:border-white/10 transition-all duration-300">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-xs uppercase tracking-widest text-slate-400 font-sans flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Twin Parameter Sandbox
                </h3>
                <span className="text-[9px] bg-white/5 text-slate-400 font-mono px-2 py-0.5 rounded uppercase tracking-wider font-semibold border border-white/10">What-If Arena</span>
              </div>

              {/* Bedrijfsscenario Dropdown Selector (User Requested Menu Choice) */}
              <div className="space-y-1.5 pb-3 border-b border-white/5">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Kies Bedrijfssite-Scenario (Menukeuze):</label>
                <select
                  value={
                    params.weatherScenario === "rainy" 
                      ? "rainy_weekend" 
                      : params.globalDiscountBoost > 10 
                      ? "sale_clearance" 
                      : params.priceAdjustment > 0 && params.runInterStoreTransfers 
                      ? "optimized_staff" 
                      : "normal"
                  }
                  onChange={(e) => {
                    handleScenarioPreset(e.target.value as "rainy_weekend" | "sale_clearance" | "optimized_staff" | "normal");
                  }}
                  className="w-full bg-[#050505] border border-white/10 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                >
                  <option value="normal">🏢 Standaard Bedrijfsvoering (Basislijn - Normale Omstandigheden)</option>
                  <option value="rainy_weekend">⛈️ Regenachtig Weekend (Laarzenverkoop spikes, sneaker dip)</option>
                  <option value="sale_clearance">🏷️ Grote Uitverkoop Boost (Hoge kortingen, extra logistieke bezetting)</option>
                  <option value="optimized_staff">⚙️ Operationele Optimalisatie (Matentransfers actief, prijsaanpassing)</option>
                </select>
                <p className="text-[9px] text-[#8f8f8f] leading-normal font-sans pt-0.5">
                  Dit snelmenu simuleert directe externe invloeden en zet de bijbehorende parameters direct juist.
                </p>
              </div>

              {/* Slider 1: Kortingsboost */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Globale Kortingsboost:</span>
                  <span className="text-emerald-400 font-bold">+{params.globalDiscountBoost}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="30" 
                  step="2"
                  value={params.globalDiscountBoost}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setParams(p => ({ ...p, globalDiscountBoost: val }));
                    addLog(`Kortingsboost handmatig aangepast naar +${val}%`);
                  }}
                  className="w-full accent-emerald-500 h-1 bg-white/10 rounded cursor-pointer appearance-none outline-none"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                  <span>0% (Basislijn)</span>
                  <span className="text-right">Marge uitholling risico (+30%)</span>
                </div>
              </div>

              {/* Slider 2: Personeelsplanning */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Vloerbezetting Shift Ratio:</span>
                  <span className="text-indigo-405 font-bold text-indigo-400">{params.staffPlanningRatio.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.05"
                  value={params.staffPlanningRatio}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setParams(p => ({ ...p, staffPlanningRatio: val }));
                    addLog(`Vloerbezetting-factor ingesteld op ${val}x`);
                  }}
                  className="w-full accent-emerald-500 h-1 bg-white/10 rounded cursor-pointer appearance-none outline-none"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                  <span>0.5x (Onder)</span>
                  <span>1.0x (Standaard)</span>
                  <span>2.0x (Overbezet)</span>
                </div>
              </div>

              {/* Slider 3: Prijsaanpassing */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Landelijke Prijsaanpassing:</span>
                  <span className={`font-bold ${params.priceAdjustment >= 0 ? "text-emerald-400" : "text-rose-455 text-rose-400"}`}>
                    {params.priceAdjustment > 0 ? "+" : ""}{params.priceAdjustment}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-10" 
                  max="10" 
                  step="1"
                  value={params.priceAdjustment}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setParams(p => ({ ...p, priceAdjustment: val }));
                    addLog(`Prijsaanpassing gecorrigeerd met ${val}%`);
                  }}
                  className="w-full accent-emerald-500 h-1 bg-white/10 rounded cursor-pointer appearance-none outline-none"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                  <span>-10% (Volume)</span>
                  <span>Basis</span>
                  <span>+10% (Marge)</span>
                </div>
              </div>

              {/* Toggle 4: Stock Transfers */}
              <div className="pt-2">
                <label className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5 cursor-pointer hover:border-white/15 transition-all">
                  <div className="flex items-center gap-3">
                    <span className={`p-1.5 rounded ${params.runInterStoreTransfers ? "bg-emerald-500/10 text-emerald-450" : "bg-white/5 text-slate-500"}`}>
                      <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Interne Schoenoverplaatsing</p>
                      <p className="text-[10px] text-slate-500">Hevel overtollige maten direct over per bus</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={params.runInterStoreTransfers}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setParams(p => ({ ...p, runInterStoreTransfers: enabled }));
                      addLog(`Interne schoenoverplaatsing ${enabled ? "INGESCHAKELD" : "UITGESCHAKELD"}`);
                    }}
                    className="w-4 h-4 accent-emerald-500 rounded border-white/10 bg-transparent cursor-pointer"
                  />
                </label>
              </div>

              {/* Option 5: Weather Scenario Selector */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Weersomstandigheden (Simulatie):</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "normal", label: "Normaal", icon: Sun },
                    { id: "rainy", label: "Regenachtig", icon: CloudRain },
                    { id: "sunny", label: "Zonnig", icon: Sun },
                    { id: "extreme_cold", label: "IJskoud", icon: Snowflake }
                  ].map((w) => {
                    const Icon = w.icon;
                    const isActive = params.weatherScenario === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          setParams(prev => ({ ...prev, weatherScenario: w.id as any }));
                          addLog(`Scenario weer-preset veranderd naar: ${w.label.toUpperCase()}`);
                        }}
                        className={`p-2 rounded text-center border flex flex-col items-center gap-1 transition-all cursor-pointer ${isActive ? "bg-white/10 border-white/20 text-white font-medium" : "bg-transparent border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-500" : ""}`} />
                        <span className="text-[9px] font-mono whitespace-nowrap">{w.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option 6: Dedicated Local Campaign Selector (Amsterdam, Utrecht etc) */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Lokale Marketing Campagne:</span>
                <select
                  value={params.activeLocalCampaignStoreId}
                  onChange={(e) => {
                    const shopId = e.target.value;
                    setParams(p => ({ ...p, activeLocalCampaignStoreId: shopId }));
                    addLog(shopId === "none" ? "Lokale focuscampagne beëindigd" : `Landelijke focuscampagne verplaatst naar ${currentStores.find(s => s.id === shopId)?.name}`);
                  }}
                  className="w-full text-xs bg-[#0a0a0a] border border-white/5 rounded p-2 text-slate-350 focus:outline-none focus:border-white/15 cursor-pointer font-mono"
                >
                  <option value="none">Systeemvrij (Geen extra actieve store campagne)</option>
                  {currentStores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} (+35% extra passanten drukte)
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* 10. REAL-TIME SIGNALEN & ALERTS */}
            <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded space-y-4 shadow-sm hover:border-white/10 transition-all duration-300">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-xs uppercase tracking-widest text-slate-400 font-sans flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-emerald-500" />
                  Signalen & Live Alerts ({activeAlerts.length})
                </h3>
                <span className="text-[10px] text-slate-500 font-mono font-semibold uppercase tracking-wider">Dringend</span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {activeAlerts.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-6 text-slate-500 text-xs"
                    >
                      <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                      Er zijn momenteel geen kritieke warnings.
                      <p className="text-[10px] text-slate-600 mt-1">Simulatiemodel functioneert uitstekend binnen gezonde bandbreedtes.</p>
                    </motion.div>
                  ) : (
                    activeAlerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className={`p-3.5 border-l-2 rounded-r relative border-y border-r border-[#ffffff0a] ${
                          alert.severity === "critical" 
                            ? "border-l-red-500 bg-red-500/5 text-slate-300" 
                            : alert.severity === "warning" 
                            ? "border-l-amber-500 bg-amber-500/5 text-slate-300" 
                            : "border-l-emerald-500 bg-emerald-500/5 text-slate-300"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex gap-2">
                            <span className="mt-0.5">
                              {alert.severity === "critical" ? (
                                <XCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-slate-205 text-slate-200">
                                {alert.storeName} • {alert.title}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                {alert.description}
                              </p>
                              <p className="text-[9px] text-slate-500 mt-1 bg-[#0a0a0a] p-1.5 rounded font-mono">
                                {alert.details}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleResolveAlert(alert)}
                          className="mt-2 text-[9px] bg-white/5 hover:bg-white/10 text-slate-300 font-semibold px-2 py-1 rounded border border-white/10 transition-all flex items-center gap-1 cursor-pointer select-none ml-6 uppercase tracking-wider font-mono"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          {alert.ctaText}
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* 11. DATABRONNEN INTEGRATIE STATUS */}
            <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded space-y-3 hover:border-white/10 transition-all duration-300">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  Koppelingen & Live Databronnen
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">OK</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {dataSourcesList.map(ds => (
                  <div key={ds.id} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-300 font-sans">{ds.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{ds.lastSync}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* REAL-TIME SIMULATION ACTION LEDGER (LOGS) */}
            <div className="bg-white/5 border border-white/5 p-4 rounded font-mono text-[10px] text-slate-550 text-slate-500 h-[100px] overflow-y-auto space-y-1">
              <div className="text-[9px] text-slate-450 text-slate-400 font-semibold tracking-wider uppercase border-b border-white/15 pb-1 mb-1.5 flex justify-between">
                <span>Simulator Systeem Ledger</span>
                <span>Realtime</span>
              </div>
              {logs.map((log, index) => (
                <div key={index} className="truncate">
                  {log}
                </div>
              ))}
            </div>

          </div>

          {/* RIGHT COLUMN: MAP PLATTEGROND, STORE SELECTOR & EXPANDED METRICS (Lg span 7) */}
          <div className="lg:col-span-7 space-y-6">

            {/* INTERACTIVE DIGITAL TWIN MAP / FLOOR STORES OVERVIEW */}
            <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded space-y-4 shadow-sm hover:border-white/10 transition-all duration-300">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-sans flex items-center gap-1.5 font-semibold">
                    <StoreIcon className="w-4 h-4 text-emerald-500" />
                    Interactieve Filiaal-Twin Plattegrond
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">Klik op een winkel-module om de microscoop te openen</p>
                </div>
                <span className="text-[9px] text-slate-400 bg-white/5 px-2 py-0.5 rounded font-mono border border-white/10 uppercase tracking-widest font-semibold">
                  Selectie: {selectedStore.city}
                </span>
              </div>

              {/* GRID OF INDIVIDUAL PHYSICAL STORE MINI-TWINS */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {currentStores.map((store) => {
                  const isSelected = store.id === selectedStoreId;
                  const rentMarginRatio = (store.rentPerSqm * store.squareMeters) / store.revenue;
                  
                  return (
                    <div
                      key={store.id}
                      onClick={() => {
                        setSelectedStoreId(store.id);
                        addLog(`Microscoop verplaatst naar: ${store.name}`);
                      }}
                      className={`cursor-pointer p-3.5 border transition-all relative flex flex-col justify-between rounded ${
                        isSelected 
                          ? "bg-white/10 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.1)] text-white" 
                          : "bg-[#0a0a0a]/50 hover:bg-white/5 border-white/5 hover:border-white/15 text-slate-400"
                      }`}
                    >
                      {/* Red/Orange/Green stoplicht dot in top right */}
                      <span className="absolute top-3.5 right-3.5 flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-65 ${
                          store.status === "RED" ? "bg-rose-400" : store.status === "ORANGE" ? "bg-amber-400" : "bg-emerald-400"
                        }`} />
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          store.status === "RED" ? "bg-rose-500" : store.status === "ORANGE" ? "bg-amber-500" : "bg-emerald-500"
                        }`} />
                      </span>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-200 truncate max-w-[90%] font-sans uppercase tracking-wide">
                          {store.city}
                        </h4>
                        <p className="text-[9px] text-slate-500 mt-0.5 font-mono">
                          {store.squareMeters} m² • {store.competitorsInArea} conc.
                        </p>
                      </div>

                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-500">Omzet:</span>
                          <span className="text-slate-300">€{(store.revenue/1000).toFixed(0)}k</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-500">EBITDA:</span>
                          <span className={`font-bold ${store.ebitda >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                            €{(store.ebitda/1000).toFixed(0)}k
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-500 font-mono">Maatbr.:</span>
                          <span className={store.sizeBreaksCount > 20 ? "text-rose-400" : "text-slate-400"}>
                            {store.sizeBreaksCount}
                          </span>
                        </div>
                      </div>

                      {/* Bar indicator matching health */}
                      <div className="w-full bg-white/5 h-1 mt-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            store.status === "RED" ? "bg-rose-500" : store.status === "ORANGE" ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, (store.ebitda / 90000) * 100))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* DETAILED STORE MICROSCOPE (DEEP TWIN SECTIONS 1 to 8) */}
            <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded space-y-5 relative shadow-sm hover:border-white/10 transition-all duration-300">
              
              {/* Microscope badge */}
              <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-[#050505] px-2.5 py-1 rounded border border-[#ffffff0e]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-mono tracking-widest text-[#cfcfcf]">DETAIL TWIN MICROSCOOP</span>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-white flex items-center gap-2">
                  <span className="text-emerald-500 font-mono font-bold">[{selectedStore.city.toUpperCase()}]</span>
                  {selectedStore.name}
                </h3>
                <p className="text-[11px] text-[#8f8f8f] mt-1 font-mono">
                  Micro-diagnostiek over vloer, voorraad, marges en online interacties.
                </p>
              </div>

              {/* TWO COLUMN CONTENT Grid (Left: Menukeuzes sidebar, Right: Selected Main Content Dashboard) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                
                {/* MENU CHOICE SIDEBAR (User Requested - Avoid small windows) */}
                <div className="lg:col-span-4 flex flex-col gap-2.5">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">
                    Kies Informatiecategorie (Menukeuze):
                  </span>
                  {[
                    { 
                      id: "vloer", 
                      title: "Live Winkelvloer", 
                      desc: "Alarm- & openingstijden, actieve bezetting en etalagedrukte.", 
                      icon: Activity,
                      badge: "Operationeel"
                    },
                    { 
                      id: "omzet", 
                      title: "Verkoop & Merken", 
                      desc: "Omzet, brutomarges per merk/productgroep en reviews.", 
                      icon: DollarSign,
                      badge: "Verkoop"
                    },
                    { 
                      id: "voorraad", 
                      title: "Voorraad & Maten", 
                      desc: "Voorraadposities, kapitaalbeslag en live maatbreuken.", 
                      icon: ShoppingBag,
                      badge: "Inkoop"
                    },
                    { 
                      id: "financieel", 
                      title: "Financieel & EBITDA", 
                      desc: "EBITDA drempels, huurlasten, personeelskosten en webshop.", 
                      icon: TrendingUp,
                      badge: "Management"
                    }
                  ].map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`text-left p-3.5 rounded border transition-all flex flex-col gap-1.5 focus:outline-none select-none cursor-pointer w-full group relative ${
                          isActive 
                            ? "bg-emerald-500/10 border-emerald-500/40 text-white" 
                            : "bg-[#050505]/60 border-white/5 hover:border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                            <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                            <span className={isActive ? "text-emerald-300" : "text-zinc-200"}>{item.title}</span>
                          </div>
                          <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            isActive ? "bg-emerald-500/25 text-emerald-300" : "bg-white/5 text-slate-500"
                          }`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-sans leading-tight pl-6 font-normal font-sans">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* ACTIVE VIEW DASHBOARD PANEL (col-span-8) */}
                <div className="lg:col-span-8 p-4 rounded bg-[#050505]/30 border border-white/5 min-h-[365px] flex flex-col justify-between">
                  
                  {/* 1. VLOER TAB (NEW DETAILED OPERATIONAL VIEW) */}
                  {activeTab === "vloer" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 font-sans"
                    >
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-xs font-semibold text-white uppercase font-mono tracking-wide flex items-center gap-1.5 font-sans">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          Live Winkelvloer, Alarm- & Openingstijden
                        </h4>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                          Sensoren Actief
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Alarm opening status */}
                        <div className="bg-[#050505]/70 p-4 rounded border border-white/5 space-y-3">
                          <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Beveiligingsstatus & Alarm</span>
                          
                          <div className="flex items-center gap-3">
                            <span className="p-3 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                              <StoreIcon className="w-6 h-6 text-emerald-500" />
                            </span>
                            <div>
                              <p className="text-xs font-bold text-white uppercase">Winkel Status: GEOPEND</p>
                              <p className="text-[10px] text-emerald-400 font-sans">Alarm succesvol uitgeschakeld</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1.5 border-t border-white/5 font-mono text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Inbraakalarm uit (open):</span>
                              <span className="text-emerald-400 font-bold">{selectedStore.alarmOffTime} uur</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Inbraakalarm aan (dicht):</span>
                              <span className="text-slate-400">{selectedStore.alarmOnTime} uur</span>
                            </div>
                          </div>
                        </div>

                        {/* Staff check-ins status */}
                        <div className="bg-[#050505]/70 p-4 rounded border border-white/5 space-y-3">
                          <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">RFID Medewerker Inkloktijden</span>
                          
                          <div className="flex items-center gap-3">
                            <span className="p-3 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">
                              <Users className="w-6 h-6 text-indigo-400" />
                            </span>
                            <div>
                              <p className="text-xs font-bold text-white font-sans">Shift Aanwezigheid</p>
                              <p className="text-[10px] text-slate-400 font-sans">Geregistreerde check-ins</p>
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-white/5 text-[11px] font-mono leading-relaxed">
                            <p className="text-slate-500">Live ingeklokte medewerkers:</p>
                            <p className="text-white mt-1.5 bg-white/5 p-2 rounded border border-white/5 text-center text-xs">
                              {selectedStore.staffCheckIns}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Window shopping performance & Occupancy */}
                      <div className="bg-[#050505]/70 p-4 rounded border border-white/5 space-y-4 font-sans">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Klantenbezetting & Etalagedrukte</span>
                            <p className="text-xs font-bold text-white mt-0.5 font-sans">Teller analyse van vandaag</p>
                          </div>
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono font-bold animate-pulse">Live Tellers</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-[#0a0a0a] rounded border border-white/5 text-center">
                            <span className="text-[10px] text-slate-500 font-mono uppercase">NU BINNEN</span>
                            <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{selectedStore.customersInside}</p>
                            <span className="text-[9px] text-slate-500 block mt-1">Actieve consumenten</span>
                          </div>

                          <div className="p-3 bg-[#0a0a0a] rounded border border-white/5 text-center">
                            <span className="text-[10px] text-slate-500 font-mono uppercase">KIJKEN IN ETALAGE</span>
                            <p className="text-2xl font-mono font-bold text-white mt-1">{selectedStore.windowShoppersLooking}</p>
                            <span className="text-[9px] text-slate-500 block mt-1 font-sans">Al wel halted in etalage</span>
                          </div>

                          <div className="p-3 bg-[#0a0a0a] rounded border border-white/5 text-center">
                            <span className="text-[10px] text-slate-500 font-mono uppercase">LOPEN DIRECT DOOR</span>
                            <p className="text-2xl font-mono font-bold text-slate-400 mt-1">{selectedStore.windowShoppersWalkedBy}</p>
                            <span className="text-[9px] text-slate-500 block mt-1 font-sans">Passeren zonder halt</span>
                          </div>
                        </div>

                        {/* Etalageconversie percentage */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Etalage Attractiegraad (Percentage passanten die stoppen):</span>
                            <span className="text-emerald-400 font-bold">
                              {Math.round((selectedStore.windowShoppersLooking / (selectedStore.windowShoppersLooking + selectedStore.windowShoppersWalkedBy)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-white/5 h-2 rounded overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded transition-all duration-300"
                              style={{ width: `${Math.round((selectedStore.windowShoppersLooking / (selectedStore.windowShoppersLooking + selectedStore.windowShoppersWalkedBy)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                {/* 2. VERKOOP, MERKEN & REVIEWS */}
                {activeTab === "omzet" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 font-sans"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h4 className="text-xs font-semibold text-white uppercase font-mono tracking-wide">
                        Verkoopcijfers, Marges & Klantenbeoordelingen
                      </h4>
                      <div className="text-[10px] font-mono text-slate-400">
                        NPS Score: <span className="text-emerald-400 font-bold">{selectedStore.nps}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Brand margin lists */}
                      <div className="space-y-3">
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Marge & Omzet per Merk</span>
                        <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 no-scrollbar">
                          {selectedStore.brands.map((b, i) => (
                            <div key={i} className="bg-[#050505]/40 p-2 text-xs rounded border border-white/5">
                              <div className="flex justify-between items-center col-span-2">
                                <span className="font-semibold text-slate-200">{b.brand}</span>
                                <span className="font-mono text-emerald-400 font-bold">€{b.sales.toLocaleString("nl-NL")}</span>
                              </div>
                              <div className="flex justify-between text-[9px] text-[#8f8f8f] mt-1 font-mono">
                                <span>Marge: {b.margin}%</span>
                                <span>GMROI Index: {(b.gmroi / 10).toFixed(1)}x</span>
                              </div>
                              {/* Visual bar */}
                              <div className="w-full bg-white/5 h-1 mt-1.5 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${b.margin}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Product groups breakdown */}
                      <div className="space-y-3">
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Marge per Productgroep</span>
                        <div className="space-y-3.5">
                          {selectedStore.productGroups.map((pg, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-mono">
                                <span className="text-slate-400">{pg.group}</span>
                                <span className="text-white">€{pg.sales.toLocaleString("nl-NL")} <span className="text-slate-600">({pg.unitsSold} st)</span></span>
                              </div>
                              <div className="relative">
                                <div className="w-full bg-[#050505] h-1.5 rounded overflow-hidden border border-white/5">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pg.margin}%` }} />
                                </div>
                                <span className="absolute right-0 -top-3.5 text-[8px] text-[#8f8f8f] font-mono">Marge: {pg.margin}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Google & Webshop Customer Reviews + Segments */}
                    <div className="pt-2.5 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customer segment bar graph */}
                      <div className="bg-[#050505]/20 p-3 rounded border border-white/5 space-y-2">
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">Consumenten Segmentering</span>
                        <div className="space-y-2 text-[10px]">
                          {[
                            { name: "Sneakerheads / Sportief", ratio: 45, color: "bg-emerald-500" },
                            { name: "Comfort / Medisch", ratio: 25, color: "bg-blue-500" },
                            { name: "Luxe & Zakelijk heren", ratio: 18, color: "bg-indigo-500" },
                            { name: "Kinderen & Gezinnen", ratio: 12, color: "bg-amber-500" }
                          ].map((seg, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-400">{seg.name}</span>
                                <span className="text-white font-bold">{seg.ratio}%</span>
                              </div>
                              <div className="w-full bg-white/5 h-1 rounded overflow-hidden">
                                <div className={`h-full ${seg.color}`} style={{ width: `${seg.ratio}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Review details */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">Recente Google Beoordelingen</span>
                        <div className="space-y-2 max-h-[140px] overflow-y-auto no-scrollbar">
                          {selectedStore.reviews.slice(0, 2).map((rev, i) => (
                            <div key={i} className="bg-[#050505]/70 p-2.5 rounded border border-white/5 text-[11px] text-[#eaeaea]">
                              <div className="flex justify-between font-mono text-[10px]">
                                <span className="font-bold text-white">{rev.author}</span>
                                <span className="text-amber-400">{"★".repeat(rev.rating)}</span>
                              </div>
                              <p className="mt-0.5 leading-tight text-[#afafaf] italic text-[10px]">"{rev.text}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. VOORRAAD & MAAT TAB */}
                {activeTab === "voorraad" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h4 className="text-xs font-semibold text-white uppercase font-mono tracking-wide">
                        Voorraadhoogtes, Planken & Maatbehoefte
                      </h4>
                      <div className="text-[10px] font-mono text-rose-450 flex items-center gap-1.5">
                        Kritieke maatbreuken: <span className="font-bold">{selectedStore.sizeBreaksCount} maten</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-[#050505]/70 p-3 border border-white/5 rounded">
                        <span className="text-[9px] text-zinc-500 font-mono block uppercase">Voorraadpositie</span>
                        <p className="text-sm font-semibold text-white mt-1">{selectedStore.totalStockPairs} paar</p>
                        <p className="text-[9px] text-zinc-650 font-mono mt-0.5">Fysieke schoenen</p>
                      </div>
                      <div className="bg-[#050505]/70 p-3 border border-white/5 rounded">
                        <span className="text-[9px] text-zinc-500 font-mono block uppercase">Kapitaalbeslag</span>
                        <p className="text-sm font-semibold text-white mt-1">€{selectedStore.totalStockValue.toLocaleString("nl-NL")}</p>
                        <p className="text-[9px] text-zinc-650 font-mono mt-0.5">Financiële waarde</p>
                      </div>
                      <div className="bg-[#050505]/70 p-3 border border-white/5 rounded">
                        <span className="text-[9px] text-zinc-500 font-mono block uppercase">Sell-Through Rate</span>
                        <p className="text-sm font-semibold text-white mt-1">{selectedStore.sellThroughRate}%</p>
                        <p className="text-[9px] text-rose-400 mt-0.5 font-mono">Dood: {selectedStore.deadStockPercent}%</p>
                      </div>
                      <div className="bg-[#050505]/70 p-3 border border-white/5 rounded">
                        <span className="text-[9px] text-zinc-500 font-mono block uppercase">Gemiste Omzet</span>
                        <p className={`text-sm font-semibold mt-1 ${selectedStore.neeVerkoopCount > 100 ? "text-rose-450" : "text-emerald-400"}`}>
                          €{(selectedStore.neeVerkoopCount * 110).toLocaleString("nl-NL")}
                        </p>
                        <p className="text-[9px] text-zinc-650 font-mono mt-0.5">Nee-verkoop verlies</p>
                      </div>
                    </div>

                    {/* Size shelf map */}
                    <div className="bg-[#050505]/40 p-4 rounded border border-white/5 space-y-3">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Maatspecifieke Plankniveau's</span>
                        <p className="text-[11px] text-[#bfbfbf] mt-0.5">Live inventarisatie en behoeftemapping per schoenmaat (36 - 46):</p>
                      </div>
                      <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 pt-1">
                        {selectedStore.sizes.map((s, i) => {
                          const isSizeBreak = s.size === 42 && s.stock < 50; 
                          const isOverstock = s.size === 46 && s.stock > 30;
                          return (
                            <div 
                              key={i} 
                              className={`p-1.5 rounded border text-center relative ${
                                isSizeBreak 
                                  ? "bg-rose-950/10 border-rose-900/40" 
                                  : isOverstock 
                                  ? "bg-amber-955/10 bg-amber-950/10 border-amber-900/30" 
                                  : "bg-[#050505] border-white/5"
                              }`}
                            >
                              <span className="text-[10px] font-bold block text-slate-350 font-mono">{s.size}</span>
                              <span className={`text-[11px] font-mono block font-bold ${isSizeBreak ? "text-rose-400 text-xs font-bold animate-pulse" : "text-white"}`}>
                                {s.stock} p
                              </span>
                              
                              <div className="w-full bg-white/5 h-1 mt-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${isSizeBreak ? "bg-rose-500" : isOverstock ? "bg-amber-500" : "bg-emerald-500"}`} 
                                  style={{ width: `${Math.min(100, (s.stock / s.demandForecast) * 100)}%` }} 
                                />
                              </div>

                              {isSizeBreak && (
                                <span className="absolute -top-1 -right-0.5 flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center bg-[#050505] p-2 rounded text-[9px] text-[#8f8f8f] font-mono border border-white/5">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded bg-rose-500 animate-pulse" /> Maatbreuk (Lege plank)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded bg-emerald-500" /> Voldoende voorraad</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded bg-amber-500" /> Overstock</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. BEDRIJFSRESULTAAT & EBITDA TAB */}
                {activeTab === "financieel" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 font-sans"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h4 className="text-xs font-semibold text-white uppercase font-mono tracking-wide flex items-center gap-1">
                        EBITDA, Huur, Personeel & Omnichannel Resultaten
                      </h4>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded font-mono font-bold ${
                        selectedStore.status === "GREEN" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/15 text-amber-400 border border-[#f59e0b3c]"
                      }`}>
                        STATUS: {selectedStore.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Left Block EBITDA */}
                      <div className="bg-[#050505]/75 p-4 rounded border border-white/5 space-y-3">
                        <span className="text-[10px] text-zinc-500 font-mono block uppercase tracking-wider">Break-even & EBITDA Analyse</span>
                        
                        <div className="space-y-1.5 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Filiaal Omzet:</span>
                            <span className="text-zinc-200 font-bold">€{selectedStore.revenue.toLocaleString("nl-NL")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Huur m² ({selectedStore.squareMeters} m²):</span>
                            <span className="text-zinc-300">€{(selectedStore.rentPerSqm * selectedStore.squareMeters).toLocaleString("nl-NL")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-505">Personeelskosten:</span>
                            <span className="text-zinc-300">€{selectedStore.staffCost.toLocaleString("nl-NL")}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-white/5 pt-1.5 text-zinc-100">
                            <span>Mnd-EBITDA:</span>
                            <span className="text-emerald-400 font-bold">€{selectedStore.ebitda.toLocaleString("nl-NL")}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5 font-mono text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Break-even Drempel:</span>
                            <span className="text-white font-bold">€{selectedStore.breakEvenThreshold.toLocaleString("nl-NL")}</span>
                          </div>
                          <div className="w-full bg-white/5 h-1.5 rounded overflow-hidden mt-1.5">
                            <div 
                              className="h-full bg-emerald-500 rounded transition-all duration-300"
                              style={{ width: `${Math.min(100, (selectedStore.revenue / selectedStore.breakEvenThreshold) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Block Omnichannel */}
                      <div className="bg-[#050505]/75 p-4 rounded border border-white/5 space-y-3 shrink-0">
                        <span className="text-[10px] text-zinc-500 font-mono block uppercase tracking-wider">Webshop & Omnichannel Conversie</span>
                        
                        <div className="space-y-2 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Online fulfillment:</span>
                            <span className="text-zinc-200 font-bold">{selectedStore.onlineOrdersFulfilled} pak.</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Click & Collect:</span>
                            <span className="text-zinc-300">{selectedStore.clickAndCollectVolume} orders</span>
                          </div>
                          <div className="flex justify-between border-t border-white/5 pt-1.5 text-zinc-100">
                            <span>Landelijke Zoekfouten:</span>
                            <span className={`font-semibold ${selectedStore.mismatchSearchHits > 100 ? "text-amber-400" : "text-emerald-400"}`}>
                              {selectedStore.mismatchSearchHits} searches
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] leading-normal text-slate-500 font-mono pt-1">
                          Consumenten zochten binnen een straal van 5km naar ontbrekende schoenmaten.
                        </p>
                      </div>
                    </div>

                    {/* Bottom staffing shift row */}
                    <div className="bg-[#050505]/50 p-4 rounded border border-white/5 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-300">Medewerker Shift-Bezetting & Productiviteit</span>
                        <span className="text-[11px] text-zinc-400 font-mono">{selectedStore.staffHours} uur gewerkt</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[10px] font-mono">
                        <div className="bg-[#050505] p-2 rounded border border-white/5">
                          <span className="text-slate-500 block animate-pulse">SICK LEAVE</span>
                          <span className={`font-bold ${selectedStore.sickLeavePercent > 5 ? "text-rose-450" : "text-emerald-400"}`}>{selectedStore.sickLeavePercent}%</span>
                        </div>
                        <div className="bg-[#050505] p-2 rounded border border-white/5">
                          <span className="text-slate-500 block">PRODUCTIVITEIT</span>
                          <span className="text-[#eaeaea] font-bold">€{selectedStore.revPerStaffHour}/u</span>
                        </div>
                        <div className="bg-[#050505] p-2 rounded border border-white/5">
                          <span className="text-slate-500 block">OVERWORK</span>
                          <span className="text-[#eaeaea] font-bold">{selectedStore.overtimeHours} uur</span>
                        </div>
                        <div className="bg-[#050505] p-2 rounded border border-white/5">
                          <span className="text-slate-500 block">SATISFACTION</span>
                          <span className="text-[#eaeaea] font-bold">{selectedStore.employeeSatisfaction}/5 ★</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Redundant legacy omnichannel & supply sections removed */}

                {/* Legacy stoplicht section replaced by integrated EBITDA views */}

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* STRATEGIC AI ADVISOR DRAWER / EXPERT TERMINAL (8, 9, 10 integration) */}
        <div className="bg-[#050505]/40 border border-white/5 p-6 rounded relative space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2 font-sans">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                Sole-Twin Strategische AI Adviseur Core
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Interactieve feedback gegenereerd op basis van uw herrekende digital twin data.
              </p>
            </div>
            
            <button
              onClick={requestAIAdvice}
              disabled={isAnalyzing}
              className="px-4 py-1.5 bg-[#eaeaea] hover:bg-white disabled:bg-white/5 disabled:text-slate-500 text-black text-xs font-bold rounded border border-white/10 select-none cursor-pointer transition-all flex items-center gap-1.5"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Twin analyseren...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  Vraag AI Advies (Instant)
                </>
              )}
            </button>
          </div>

          <div className="bg-[#050505] p-5 rounded border border-white/5 font-mono text-xs leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar shadow-inner">
            {isAnalyzing ? (
              <div className="space-y-3 py-6 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                <p className="animate-pulse">Gemini 3.5-Engine herrekent scenario variabelen & marge prognose...</p>
              </div>
            ) : adviceText ? (
              <div className="text-slate-300 workspace-advisor-docs space-y-4">
                {/* Convert basic markdown items */}
                {adviceText.split("\n\n").map((part, pIdx) => {
                  if (part.startsWith("### ")) {
                    return <h3 key={pIdx} className="text-sm font-bold text-emerald-400 pt-2 font-sans">{part.replace("### ", "")}</h3>;
                  }
                  if (part.startsWith("#### ")) {
                    return <h4 key={pIdx} className="text-xs font-bold text-white border-b border-white/5 pb-1 mt-3 font-sans uppercase tracking-wider">{part.replace("#### ", "")}</h4>;
                  }
                  if (part.startsWith("- ") || part.startsWith("* ")) {
                    return (
                      <ul key={pIdx} className="list-disc pl-5 space-y-1.5 text-slate-300">
                        {part.split("\n").map((line, lIdx) => (
                          <li key={lIdx} className="leading-relaxed">
                            {line.replace(/^[\*\-]\s+/, "")}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={part} className="leading-relaxed text-[11px] font-sans text-slate-300">{part}</p>;
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Druk op de knop om de strategische digital-twin adviseur te activeren.
              </div>
            )}
          </div>
        </div>

        {/* FINANCIËN — KASPOSITIE & CASHFLOW (afgeleid; in productie via PSD2/Open Banking) */}
        <div className="space-y-6">
          <div className="bg-amber-500/5 border border-amber-500/20 text-amber-300 rounded p-3 text-[11px] font-mono flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Gesimuleerde cijfers — in productie gekoppeld via PSD2/Open Banking (AISP) met toestemming, volledig server-side.</span>
          </div>
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Landmark className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-white tracking-wide font-sans">Financiën — kaspositie &amp; cashflow</h2>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">alle bedragen ex btw</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0f0f0f] border border-white/5 p-4 rounded flex flex-col justify-between hover:border-white/20 transition-all duration-300">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">KASPOSITIE KETEN</span>
              <span className="mt-3 text-lg md:text-xl font-light font-mono text-emerald-400 tracking-tight tabular-nums">€{finKas.toLocaleString("nl-NL")}</span>
            </div>
            <div className="bg-[#0f0f0f] border border-white/5 p-4 rounded flex flex-col justify-between hover:border-white/20 transition-all duration-300">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">CASHFLOW / MND</span>
              <span className={`mt-3 text-lg md:text-xl font-light font-mono tracking-tight tabular-nums ${finCashflow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>€{finCashflow.toLocaleString("nl-NL")}</span>
            </div>
            <div className="bg-[#0f0f0f] border border-white/5 p-4 rounded flex flex-col justify-between hover:border-white/20 transition-all duration-300">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">VOORRAADWAARDE</span>
              <span className="mt-3 text-lg md:text-xl font-light font-mono text-white tracking-tight tabular-nums">€{finVoorraad.toLocaleString("nl-NL")}</span>
            </div>
            <div className="bg-[#0f0f0f] border border-white/5 p-4 rounded flex flex-col justify-between hover:border-white/20 transition-all duration-300">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">WERKKAPITAAL</span>
              <span className="mt-3 text-lg md:text-xl font-light font-mono text-white tracking-tight tabular-nums">€{finWerkkapitaal.toLocaleString("nl-NL")}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bankData.map(b => (
              <div key={b.id} className="bg-[#0f0f0f] border border-white/5 rounded p-3 space-y-2 hover:border-white/10 transition-all duration-300">
                <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide font-sans">{b.city}</div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Saldo:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">€{b.balance.toLocaleString("nl-NL")}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Cashflow / mnd:</span>
                  <span className={`tabular-nums ${b.monthlyCashflow >= 0 ? "text-slate-300" : "text-rose-400"}`}>€{b.monthlyCashflow.toLocaleString("nl-NL")}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Voorraadwaarde:</span>
                  <span className="text-slate-300 tabular-nums">€{b.inventoryValue.toLocaleString("nl-NL")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#050505] py-8 px-6 text-center text-[10px] text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 SoleTwin Inc. Alle rechten voorbehouden. Beveiligde fullstack verbinding met Gemini AI Studio.</p>
          <div className="flex gap-4">
            <span className="text-emerald-500">● LIVE DATA VERBONDEN</span>
            <span>API RECHTEN: GEACTIVEERD</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
