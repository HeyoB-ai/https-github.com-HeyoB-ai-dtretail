// Types for the Shoe Retailer Digital Twin App

export interface BrandPerformance {
  brand: string;
  sales: number;
  margin: number; // percentage
  inventory: number; // pairs
  gmroi: number; // Gross Margin Return on Inventory Investment
}

export interface ProductGroupPerformance {
  group: string; // Sneakers, Nette schoenen, Kinderschoenen, Laarzen, Onderhoud
  sales: number;
  margin: number; // percentage
  unitsSold: number;
  returns: number; // percentage
}

export interface SizeAvailability {
  size: number;
  stock: number;
  demandForecast: number;
}

export interface Review {
  id: string;
  source: "Google" | "Webshop" | "Zendesk";
  rating: number; // 1-5
  author: string;
  text: string;
  date: string;
  resolved: boolean;
  category: "service" | "pasvorm" | "levertijd" | "retour";
}

export interface StaffPerformance {
  name: string;
  role: "Manager" | "Senior" | "Junior" | "Weekendhulp";
  hoursWorked: number;
  laborCost: number;
  salesVolume: number;
  conversionRate: number;
  trainingLevel: number; // 1-5
}

export interface Store {
  id: string;
  name: string;
  city: string;
  squareMeters: number;
  rentPerSqm: number;
  baseFootfallDir: number; // base daily visitors
  baseConversion: number; // base percentage
  baseDiscount: number; // base percentage
  nps: number;
  competitorsInArea: number;
  
  // Realtime state parameters (updated by simulation)
  footfall: number;
  conversionRate: number;
  transactions: number;
  avgBasket: number;
  revenue: number;
  grossMargin: number; // value
  grossMarginPercent: number; // percentage
  discountUsedPrct: number;
  returnRate: number; // percentage
  
  // Inventory state
  totalStockPairs: number;
  totalStockValue: number;
  sellThroughRate: number; // percentage
  inventoryTurnover: number; // turnover rate
  deadStockPercent: number;
  sizeBreaksCount: number; // number of products with out-of-stock sizes
  neeVerkoopCount: number; // lost sales due to size-breaks
  
  // Staff state
  staffHours: number;
  staffCost: number;
  revPerStaffHour: number;
  marginPerStaffHour: number;
  sickLeavePercent: number;
  overtimeHours: number;
  employeeSatisfaction: number; // 1-5
  
  // Omnichannel/Web
  onlineOrdersFulfilled: number;
  clickAndCollectVolume: number;
  mismatchSearchHits: number; // local online searches for out-of-stock shoes
  
  // Financiaal summary
  otherCosts: number; // energy, etc.
  ebitda: number;
  breakEvenThreshold: number;
  status: "GREEN" | "ORANGE" | "RED"; // stoplicht

  // Simpele operationele retailmetriek (User requested)
  alarmOffTime: string; // Hoe laat alarm eraf (winkel open)
  alarmOnTime: string; // Hoe laat alarm erop (winkel dicht)
  staffCheckIns: string; // Tijdstippen personeels-checkins
  customersInside: number; // Actieve klanten binnen
  windowShoppersLooking: number; // Mensen die in de etalage kijken
  windowShoppersWalkedBy: number; // Mensen die langslopen zonder te kijken
  
  // Breakdowns
  brands: BrandPerformance[];
  productGroups: ProductGroupPerformance[];
  sizes: SizeAvailability[];
  reviews: Review[];
  staff: StaffPerformance[];
}

export interface SimulationParams {
  globalDiscountBoost: number; // 0% to 50%
  staffPlanningRatio: number; // 0.5x to 2.0x of usual hours
  runInterStoreTransfers: boolean; // transfers shoes to resolve size breaks
  weatherScenario: "normal" | "rainy" | "sunny" | "extreme_cold";
  priceAdjustment: number; // relative price adjustment -10% to +10%
  activeLocalCampaignStoreId: string | "none";
}

export interface Alert {
  id: string;
  storeId: string;
  storeName: string;
  type: "size_break" | "low_conversion" | "high_returns" | "unprofitable" | "dead_stock" | "staffing_shortage" | "online_demand";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  details: string;
  ctaText: string;
  resolved: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  status: "connected" | "syncing" | "disconnected";
  lastSync: string;
  recordsCount: number;
  category: string;
}
