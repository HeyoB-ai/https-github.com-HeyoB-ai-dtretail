import { Store, SimulationParams, Alert, DataSource, BrandPerformance, ProductGroupPerformance, SizeAvailability, Review, StaffPerformance } from "./types";

// Helper to generate initial brands
export function getBaseBrands(): BrandPerformance[] {
  return [
    { brand: "Floris van Bommel", sales: 45000, margin: 42, inventory: 450, gmroi: 2.1 },
    { brand: "Gabor", sales: 38000, margin: 48, inventory: 520, gmroi: 1.8 },
    { brand: "Nike", sales: 65000, margin: 38, inventory: 780, gmroi: 2.4 },
    { brand: "Ecco", sales: 29000, margin: 50, inventory: 400, gmroi: 1.5 },
    { brand: "Clarks", sales: 22000, margin: 45, inventory: 350, gmroi: 1.4 },
  ];
}

// Helper to generate product groups
export function getBaseProductGroups(): ProductGroupPerformance[] {
  return [
    { group: "Sneakers", sales: 78000, margin: 40, unitsSold: 650, returns: 12 },
    { group: "Nette schoenen", sales: 55000, margin: 45, unitsSold: 380, returns: 8 },
    { group: "Laarzen", sales: 42000, margin: 42, unitsSold: 280, returns: 15 },
    { group: "Kinderschoenen", sales: 25000, margin: 44, unitsSold: 410, returns: 6 },
    { group: "Onderhoud", sales: 8000, margin: 70, unitsSold: 800, returns: 1 },
  ];
}

// Helper to generate size distribution
export function getBaseSizes(): SizeAvailability[] {
  return [
    { size: 36, stock: 45, demandForecast: 40 },
    { size: 37, stock: 80, demandForecast: 75 },
    { size: 38, stock: 120, demandForecast: 130 },
    { size: 39, stock: 145, demandForecast: 150 },
    { size: 40, stock: 160, demandForecast: 170 },
    { size: 41, stock: 110, demandForecast: 120 },
    { size: 42, stock: 35, demandForecast: 150 }, // size-break! high demand, low stock
    { size: 43, stock: 95, demandForecast: 90 },
    { size: 44, stock: 70, demandForecast: 75 },
    { size: 45, stock: 40, demandForecast: 45 },
    { size: 46, stock: 38, demandForecast: 20 }, // overstock of unpopular size
  ];
}

// Helper to generate reviews
export function getBaseReviews(city: string): Review[] {
  return [
    {
      id: `${city}-rev-1`,
      source: "Google",
      author: "Marieke de J.",
      rating: 5,
      text: "Geweldig geholpen door het personeel. Mijn favoriete Floris van Bommels direct in de juiste maat meegenomen!",
      date: "2026-05-28",
      resolved: true,
      category: "service"
    },
    {
      id: `${city}-rev-2`,
      source: "Google",
      author: "Pim van S.",
      rating: 2,
      text: "Leuke herenschoen gezien in de etalage, maar maat 42 was weer eens niet op voorraad. Jammer, online besteld bij concurrent.",
      date: "2026-05-30",
      resolved: false,
      category: "pasvorm"
    },
    {
      id: `${city}-rev-3`,
      source: "Zendesk",
      author: "Annelies B.",
      rating: 3,
      text: "Schoenen online gereserveerd voor Click & Collect, maar toen ik aankwam kon het winkelpersoneel ze eerst niet vinden. Duurde lang.",
      date: "2026-05-31",
      resolved: false,
      category: "levertijd"
    }
  ];
}

// Helper for staff list
export function getBaseStaff(): StaffPerformance[] {
  return [
    { name: "Sander (Manager)", role: "Manager", hoursWorked: 40, laborCost: 1500, salesVolume: 18000, conversionRate: 18.5, trainingLevel: 5 },
    { name: "Lisa", role: "Senior", hoursWorked: 32, laborCost: 960, salesVolume: 12000, conversionRate: 15.2, trainingLevel: 4 },
    { name: "Arjan", role: "Junior", hoursWorked: 24, laborCost: 600, salesVolume: 6500, conversionRate: 11.0, trainingLevel: 2 },
    { name: "Emma (Weekend)", role: "Weekendhulp", hoursWorked: 16, laborCost: 320, salesVolume: 4200, conversionRate: 14.0, trainingLevel: 3 },
  ];
}

// Create initial base data for 5 actual shoe stores
export function getInitialStoresData(): Store[] {
  return [
    {
      id: "utrecht-oudegracht",
      name: "Utrecht Oudegracht",
      city: "Utrecht",
      squareMeters: 180,
      rentPerSqm: 45, // Monthly rent per sqm
      baseFootfallDir: 12000, // Monthly visitors
      baseConversion: 12.5,
      baseDiscount: 8,
      nps: 76,
      competitorsInArea: 5,
      
      footfall: 12000,
      conversionRate: 12.5,
      transactions: 1500,
      avgBasket: 105,
      revenue: 157500,
      grossMargin: 70875,
      grossMarginPercent: 45,
      discountUsedPrct: 8,
      returnRate: 9,
      
      totalStockPairs: 4331,
      totalStockValue: 346480,
      sellThroughRate: 58,
      inventoryTurnover: 4.8,
      deadStockPercent: 12,
      sizeBreaksCount: 14,
      neeVerkoopCount: 85,
      
      staffHours: 192,
      staffCost: 5800,
      revPerStaffHour: 820,
      marginPerStaffHour: 369,
      sickLeavePercent: 2.1,
      overtimeHours: 6,
      employeeSatisfaction: 4.2,
      
      onlineOrdersFulfilled: 340,
      clickAndCollectVolume: 190,
      mismatchSearchHits: 55,
      
      otherCosts: 3200,
      ebitda: 53775, // Calculated ebitda
      breakEvenThreshold: 115000,
      status: "GREEN",
      alarmOffTime: "08:31",
      alarmOnTime: "18:04",
      staffCheckIns: "Sander (08:15), Lisa (08:42), Arjan (09:47)",
      customersInside: 14,
      windowShoppersLooking: 342,
      windowShoppersWalkedBy: 1890,
      
      brands: getBaseBrands(),
      productGroups: getBaseProductGroups(),
      sizes: [
        { size: 36, stock: 208, demandForecast: 185 },
        { size: 37, stock: 369, demandForecast: 346 },
        { size: 38, stock: 554, demandForecast: 600 },
        { size: 39, stock: 669, demandForecast: 692 },
        { size: 40, stock: 739, demandForecast: 785 },
        { size: 41, stock: 508, demandForecast: 554 },
        { size: 42, stock: 162, demandForecast: 692 }, // size-break! high demand, low stock
        { size: 43, stock: 439, demandForecast: 415 },
        { size: 44, stock: 323, demandForecast: 346 },
        { size: 45, stock: 185, demandForecast: 208 },
        { size: 46, stock: 175, demandForecast: 92 }, // overstock of unpopular size
      ],
      reviews: getBaseReviews("Utrecht"),
      staff: getBaseStaff()
    },
    {
      id: "amsterdam-kalverstraat",
      name: "Amsterdam Kalverstraat",
      city: "Amsterdam",
      squareMeters: 400,
      rentPerSqm: 110,
      baseFootfallDir: 35000,
      baseConversion: 8.2,
      baseDiscount: 12,
      nps: 68,
      competitorsInArea: 14,
      
      footfall: 35000,
      conversionRate: 8.2,
      transactions: 2870,
      avgBasket: 125,
      revenue: 358750,
      grossMargin: 150675,
      grossMarginPercent: 42,
      discountUsedPrct: 12,
      returnRate: 14,
      
      totalStockPairs: 10399,
      totalStockValue: 831920,
      sellThroughRate: 64,
      inventoryTurnover: 5.2,
      deadStockPercent: 15,
      sizeBreaksCount: 38,
      neeVerkoopCount: 310,
      
      staffHours: 384,
      staffCost: 11200,
      revPerStaffHour: 934,
      marginPerStaffHour: 392,
      sickLeavePercent: 4.8,
      overtimeHours: 24,
      employeeSatisfaction: 3.8,
      
      onlineOrdersFulfilled: 850,
      clickAndCollectVolume: 420,
      mismatchSearchHits: 180,
      
      otherCosts: 8500,
      ebitda: 86975,
      breakEvenThreshold: 184000,
      status: "GREEN",
      alarmOffTime: "08:26",
      alarmOnTime: "18:15",
      staffCheckIns: "Lisa (08:10), Sander (08:20), Emma (09:30)",
      customersInside: 28,
      windowShoppersLooking: 920,
      windowShoppersWalkedBy: 5450,
      
      brands: getBaseBrands().map(b => ({ ...b, sales: b.sales * 2 })),
      productGroups: getBaseProductGroups().map(pg => ({ ...pg, sales: pg.sales * 2.2, unitsSold: Math.round(pg.unitsSold * 2.2) })),
      sizes: [
        { size: 36, stock: 499, demandForecast: 488 },
        { size: 37, stock: 887, demandForecast: 915 },
        { size: 38, stock: 1330, demandForecast: 1586 },
        { size: 39, stock: 1608, demandForecast: 1829 },
        { size: 40, stock: 1774, demandForecast: 2073 },
        { size: 41, stock: 1220, demandForecast: 1464 },
        { size: 42, stock: 388, demandForecast: 1829 }, // size-break! high demand, low stock
        { size: 43, stock: 1053, demandForecast: 1098 },
        { size: 44, stock: 776, demandForecast: 915 },
        { size: 45, stock: 443, demandForecast: 549 },
        { size: 46, stock: 421, demandForecast: 244 }, // overstock of unpopular size
      ],
      reviews: getBaseReviews("Amsterdam"),
      staff: getBaseStaff().map(st => ({ ...st, hoursWorked: st.hoursWorked * 1.5, laborCost: st.laborCost * 1.5 }))
    },
    {
      id: "rotterdam-koopgoot",
      name: "Rotterdam Koopgoot",
      city: "Rotterdam",
      squareMeters: 320,
      rentPerSqm: 85,
      baseFootfallDir: 28000,
      baseConversion: 9.8,
      baseDiscount: 18, // High discounting behavior here
      nps: 62,
      competitorsInArea: 10,
      
      footfall: 28000,
      conversionRate: 9.8,
      transactions: 2744,
      avgBasket: 92,
      revenue: 252448,
      grossMargin: 93405,
      grossMarginPercent: 37, // Smashed margins due to discounts
      discountUsedPrct: 18,
      returnRate: 16,
      
      totalStockPairs: 7950,
      totalStockValue: 636000,
      sellThroughRate: 52,
      inventoryTurnover: 3.9,
      deadStockPercent: 24, // High deadstock
      sizeBreaksCount: 42,
      neeVerkoopCount: 245,
      
      staffHours: 320,
      staffCost: 9500,
      revPerStaffHour: 789,
      marginPerStaffHour: 292,
      sickLeavePercent: 5.2,
      overtimeHours: 18,
      employeeSatisfaction: 3.5,
      
      onlineOrdersFulfilled: 620,
      clickAndCollectVolume: 290,
      mismatchSearchHits: 125,
      
      otherCosts: 6800,
      ebitda: 49905,
      breakEvenThreshold: 172000,
      status: "ORANGE",
      alarmOffTime: "08:35",
      alarmOnTime: "18:01",
      staffCheckIns: "Sander (08:25), Arjan (08:55), Lisa (11:30)",
      customersInside: 22,
      windowShoppersLooking: 612,
      windowShoppersWalkedBy: 4120,
      
      brands: getBaseBrands().map(b => ({ ...b, sales: b.sales * 1.5, margin: b.margin - 5 })),
      productGroups: getBaseProductGroups().map(pg => ({ ...pg, sales: pg.sales * 1.6, unitsSold: Math.round(pg.unitsSold * 1.6) })),
      sizes: [
        { size: 36, stock: 381, demandForecast: 381 },
        { size: 37, stock: 678, demandForecast: 715 },
        { size: 38, stock: 1017, demandForecast: 1239 },
        { size: 39, stock: 1229, demandForecast: 1430 },
        { size: 40, stock: 1356, demandForecast: 1621 },
        { size: 41, stock: 932, demandForecast: 1144 },
        { size: 42, stock: 297, demandForecast: 1430 }, // size-break! high demand, low stock
        { size: 43, stock: 805, demandForecast: 858 },
        { size: 44, stock: 593, demandForecast: 715 },
        { size: 45, stock: 339, demandForecast: 429 },
        { size: 46, stock: 323, demandForecast: 191 }, // overstock of unpopular size
      ],
      reviews: getBaseReviews("Rotterdam"),
      staff: getBaseStaff().map(st => ({ ...st, hoursWorked: st.hoursWorked * 1.2, laborCost: st.laborCost * 1.2 }))
    },
    {
      id: "amersfoort-joris",
      name: "Amersfoort Sint Joris",
      city: "Amersfoort",
      squareMeters: 150,
      rentPerSqm: 28,
      baseFootfallDir: 9500,
      baseConversion: 11.2,
      baseDiscount: 6,
      nps: 78,
      competitorsInArea: 3,
      
      footfall: 9500,
      conversionRate: 11.2,
      transactions: 1064,
      avgBasket: 110,
      revenue: 117040,
      grossMargin: 56179,
      grossMarginPercent: 48,
      discountUsedPrct: 6,
      returnRate: 7,
      
      totalStockPairs: 3040,
      totalStockValue: 243200,
      sellThroughRate: 61,
      inventoryTurnover: 4.9,
      deadStockPercent: 8,
      sizeBreaksCount: 8,
      neeVerkoopCount: 35,
      
      staffHours: 160,
      staffCost: 4800,
      revPerStaffHour: 731,
      marginPerStaffHour: 351,
      sickLeavePercent: 1.5,
      overtimeHours: 2,
      employeeSatisfaction: 4.5,
      
      onlineOrdersFulfilled: 210,
      clickAndCollectVolume: 150,
      mismatchSearchHits: 85, // High local mismatch search in Amersfoort "zwarte laars maat 39"
      
      otherCosts: 2400,
      ebitda: 44779,
      breakEvenThreshold: 72000,
      status: "GREEN",
      alarmOffTime: "08:29",
      alarmOnTime: "17:59",
      staffCheckIns: "Sander (08:12), Emma (08:45)",
      customersInside: 8,
      windowShoppersLooking: 185,
      windowShoppersWalkedBy: 1150,
      
      brands: getBaseBrands().map(b => ({ ...b, sales: b.sales * 0.8, margin: b.margin + 2 })),
      productGroups: getBaseProductGroups().map(pg => ({ ...pg, sales: pg.sales * 0.8, unitsSold: Math.round(pg.unitsSold * 0.8), returns: pg.returns - 2 })),
      sizes: [
        { size: 36, stock: 146, demandForecast: 138 },
        { size: 37, stock: 259, demandForecast: 259 },
        { size: 38, stock: 389, demandForecast: 450 },
        { size: 39, stock: 470, demandForecast: 519 },
        { size: 40, stock: 519, demandForecast: 588 },
        { size: 41, stock: 357, demandForecast: 413 },
        { size: 42, stock: 113, demandForecast: 519 }, // size-break! high demand, low stock
        { size: 43, stock: 308, demandForecast: 312 },
        { size: 44, stock: 227, demandForecast: 259 },
        { size: 45, stock: 130, demandForecast: 154 },
        { size: 46, stock: 122, demandForecast: 69 }, // overstock of unpopular size
      ],
      reviews: getBaseReviews("Amersfoort"),
      staff: getBaseStaff().map(st => ({ ...st, hoursWorked: Math.round(st.hoursWorked * 0.9), laborCost: Math.round(st.laborCost * 0.9) }))
    },
    {
      id: "den-haag-spuistraat",
      name: "Den Haag Spuistraat",
      city: "Den Haag",
      squareMeters: 240,
      rentPerSqm: 55,
      baseFootfallDir: 15000,
      baseConversion: 10.5,
      baseDiscount: 10,
      nps: 71,
      competitorsInArea: 8,
      
      footfall: 15000,
      conversionRate: 10.5,
      transactions: 1575,
      avgBasket: 108,
      revenue: 170100,
      grossMargin: 74844,
      grossMarginPercent: 44,
      discountUsedPrct: 10,
      returnRate: 10,
      
      totalStockPairs: 4760,
      totalStockValue: 380800,
      sellThroughRate: 54,
      inventoryTurnover: 4.1,
      deadStockPercent: 18,
      sizeBreaksCount: 22,
      neeVerkoopCount: 140, // High lost sales due to size-breaks
      
      staffHours: 200,
      staffCost: 6100,
      revPerStaffHour: 850,
      marginPerStaffHour: 374,
      sickLeavePercent: 8.5, // Severe sickness wave is hitting Haag Spuistraat!
      overtimeHours: 14,
      employeeSatisfaction: 3.4,
      
      onlineOrdersFulfilled: 410,
      clickAndCollectVolume: 220,
      mismatchSearchHits: 105,
      
      otherCosts: 4200,
      ebitda: 51344,
      breakEvenThreshold: 118000,
      status: "GREEN",
      alarmOffTime: "08:42",
      alarmOnTime: "18:02",
      staffCheckIns: "Lisa (08:35)",
      customersInside: 11,
      windowShoppersLooking: 250,
      windowShoppersWalkedBy: 1620,
      
      brands: getBaseBrands().map(b => ({ ...b, sales: b.sales * 1.1 })),
      productGroups: getBaseProductGroups().map(pg => ({ ...pg, sales: pg.sales * 1.1, unitsSold: Math.round(pg.unitsSold * 1.1) })),
      sizes: [
        { size: 36, stock: 230, demandForecast: 203 },
        { size: 37, stock: 405, demandForecast: 382 },
        { size: 38, stock: 608, demandForecast: 658 },
        { size: 39, stock: 737, demandForecast: 760 },
        { size: 40, stock: 810, demandForecast: 861 },
        { size: 41, stock: 557, demandForecast: 608 },
        { size: 42, stock: 180, demandForecast: 760 }, // size-break! high demand, low stock
        { size: 43, stock: 483, demandForecast: 456 },
        { size: 44, stock: 354, demandForecast: 382 },
        { size: 45, stock: 203, demandForecast: 230 },
        { size: 46, stock: 193, demandForecast: 101 }, // overstock of unpopular size
      ],
      reviews: getBaseReviews("Den Haag"),
      staff: getBaseStaff().map(st => ({ ...st, hoursWorked: st.hoursWorked * 1.05, laborCost: st.laborCost * 1.1 }))
    }
  ];
}

// Recalculate store based on simulation parameters
export function runSimulation(stores: Store[], params: SimulationParams): Store[] {
  return stores.map(store => {
    // 1. Weather Impact on Footfall
    let weatherFootfallMod = 1.0;
    let categoryMod: { [key: string]: number } = { Sneakers: 1.0, "Nette schoenen": 1.0, Laarzen: 1.0, Kinderschoenen: 1.0, Onderhoud: 1.0 };
    
    if (params.weatherScenario === "rainy") {
      weatherFootfallMod = 0.85; // Less physical shopping
      categoryMod["Laarzen"] = 1.4; // High boot sale!
      categoryMod["Onderhoud"] = 1.5; // Maintenance products go up in rain
    } else if (params.weatherScenario === "sunny") {
      weatherFootfallMod = 1.15; // More street walking
      categoryMod["Sneakers"] = 1.3;
      categoryMod["Kinderschoenen"] = 1.15;
      categoryMod["Nette schoenen"] = 0.9;
      categoryMod["Laarzen"] = 0.4; // Boots sale crashes
    } else if (params.weatherScenario === "extreme_cold") {
      weatherFootfallMod = 0.75; // Ice & cold keeps people inside
      categoryMod["Laarzen"] = 1.8; // Thermal boots peak
      categoryMod["Sneakers"] = 0.7;
    }
    
    // Campaign footprint
    let isCampaignActive = params.activeLocalCampaignStoreId === store.id;
    let campaignFootfallMod = isCampaignActive ? 1.35 : 1.0;
    
    const footfall = Math.round(store.baseFootfallDir * weatherFootfallMod * campaignFootfallMod);
    
    // 2. Staffing level impacts conversion, labor costs and loose sales
    // Ideal ratio is 1.0. Lower means empty store/no assistance, higher means good service up to a point of saturation
    const staffPlanning = params.staffPlanningRatio;
    let staffConversionMod = 1.0;
    if (staffPlanning < 1.0) {
      staffConversionMod = 0.7 + (staffPlanning * 0.3); // Severe drop
    } else {
      staffConversionMod = 1.0 + (Math.log(staffPlanning) * 0.25); // Logarithmic return
    }
    
    // Sickness influence
    const sicknessDamp = (100 - store.sickLeavePercent) / 100;
    staffConversionMod = staffConversionMod * (0.85 + sicknessDamp * 0.15);
    
    // 3. Size breaks resolution if inter-store transfers is ON
    let sizeBreaksFactor = 1.0;
    let sizeBreaksCount = store.sizeBreaksCount;
    let neeVerkoopCount = store.neeVerkoopCount;
    
    if (params.runInterStoreTransfers) {
      sizeBreaksCount = Math.round(store.sizeBreaksCount * 0.15); // Resolved 85% of breaks
      neeVerkoopCount = Math.round(store.neeVerkoopCount * 0.1); 
      sizeBreaksFactor = 1.12; // Boost conversion because sizes are in stock!
    } else {
      // Stock turns and deadstock damp conversion slightly
      sizeBreaksFactor = 1.0 - (store.sizeBreaksCount / 150);
    }
    
    // 4. Discount parameters
    const totalDiscountRate = store.baseDiscount + params.globalDiscountBoost;
    // Discount increases conversion + transactional volume, but reduces margins and average basket value
    const discountConversionBoost = 1.0 + (params.globalDiscountBoost * 0.015);
    
    // Price adjustments
    const priceAdjustmentMod = 1.0 + (params.priceAdjustment / 100);
    const priceConversionDamp = 1.0 - (params.priceAdjustment > 0 ? (params.priceAdjustment * 0.02) : (params.priceAdjustment * 0.01));
    
    // Combined Conversion Rate
    let conversionRate = store.baseConversion * staffConversionMod * sizeBreaksFactor * discountConversionBoost * priceConversionDamp;
    if (conversionRate < 3) conversionRate = 3;
    if (conversionRate > 25) conversionRate = 25;
    
    const transactions = Math.round((footfall * conversionRate) / 100);
    
    // Adjusted Average Basket Value
    // Discount lowers average basket: e.g. 10% discount boost halves basket value by 5% because of mix
    const discountBasketDamp = 1.0 - (params.globalDiscountBoost * 0.006);
    const avgBasket = Math.round(store.avgBasket * priceAdjustmentMod * discountBasketDamp);
    
    // Revenue
    const revenue = transactions * avgBasket;
    
    // Adjusted margins %
    // Marges are directly eaten 1:1 by additional discount rates, and gained by price adjustments
    let grossMarginPercent = (store.grossMarginPercent + (params.priceAdjustment * 0.45)) - (params.globalDiscountBoost * 0.8);
    if (grossMarginPercent < 20) grossMarginPercent = 20;
    if (grossMarginPercent > 65) grossMarginPercent = 65;
    
    const grossMargin = Math.round((revenue * grossMarginPercent) / 100);
    
    // 5. Staffing costs
    const staffCost = Math.round(store.staffCost * staffPlanning);
    const staffHours = Math.round(store.staffHours * staffPlanning);
    
    const revPerStaffHour = staffHours > 0 ? Math.round(revenue / staffHours) : 0;
    const marginPerStaffHour = staffHours > 0 ? Math.round(grossMargin / staffHours) : 0;
    
    // Rent costs
    const rentCost = store.squareMeters * store.rentPerSqm;
    
    // Webshop overlap
    // If transfers or campaigns are active, local C&C or region online matches improve
    const localCampaignFactor = isCampaignActive ? 1.4 : 1.0;
    const clickAndCollectVolume = Math.round(store.clickAndCollectVolume * localCampaignFactor * (params.runInterStoreTransfers ? 1.25 : 1.0));
    const onlineOrdersFulfilled = Math.round(store.onlineOrdersFulfilled * (params.runInterStoreTransfers ? 1.15 : 1.0));
    
    // Mismatch search hits: drops with transfers active since we have what the region is searching
    const mismatchSearchHits = params.runInterStoreTransfers ? Math.round(store.mismatchSearchHits * 0.2) : store.mismatchSearchHits;
    
    // EBITDA
    const ebitda = grossMargin - rentCost - staffCost - store.otherCosts;
    
    // Sell-through rate & inventory behavior
    const baseSTRBoost = params.globalDiscountBoost * 0.6 + (params.priceAdjustment < 0 ? Math.abs(params.priceAdjustment) * 0.4 : -params.priceAdjustment * 0.5);
    const sellThroughRate = Math.min(95, Math.max(10, Math.round(store.sellThroughRate + baseSTRBoost + (params.runInterStoreTransfers ? 5 : 0))));
    
    const deadStockPercent = params.runInterStoreTransfers ? Math.max(2, Math.round(store.deadStockPercent * 0.5)) : store.deadStockPercent;
    
    // STOPLICHT indicator
    let status: "GREEN" | "ORANGE" | "RED" = "GREEN";
    if (ebitda < 0) {
      status = "RED";
    } else if (ebitda < 15000 || grossMarginPercent < 38) {
      status = "ORANGE";
    }
    
    // GMROI: Gross Margin return of stock values
    const inventoryTurnover = (revenue / store.totalStockValue) * 3; // simulated turnover rate
    const gmroi = parseFloat((grossMargin / store.totalStockValue).toFixed(2));
    
    // Recalculate brand margins & sales based on weather & pricing
    const brands = store.brands.map(b => {
      let salesMod = 1.0;
      if (params.weatherScenario === "sunny" && (b.brand === "Nike" || b.brand === "Ecco")) salesMod = 1.2;
      if (params.weatherScenario === "rainy" && (b.brand === "Floris van Bommel" || b.brand === "Ecco")) salesMod = 1.15;
      
      const bSales = Math.round(b.sales * (revenue / store.revenue) * salesMod);
      const bMargin = Math.min(65, Math.max(20, b.margin + (params.priceAdjustment * 0.45) - (params.globalDiscountBoost * 0.75)));
      return {
        ...b,
        sales: bSales,
        margin: Math.round(bMargin),
        gmroi: parseFloat(((bSales * (bMargin / 100)) / (b.inventory * 60)).toFixed(2)) // simulated item GMROI
      };
    });
    
    const productGroups = store.productGroups.map(pg => {
      const activeCategoryMod = categoryMod[pg.group] || 1.0;
      const pgSales = Math.round(pg.sales * (revenue / store.revenue) * activeCategoryMod);
      const pgMargin = Math.min(75, Math.max(15, pg.margin + (params.priceAdjustment * 0.5) - (params.globalDiscountBoost * 0.8)));
      return {
        ...pg,
        sales: pgSales,
        margin: Math.round(pgMargin),
        unitsSold: Math.round(pg.unitsSold * (transactions / store.transactions) * activeCategoryMod)
      };
    });
    
    const sizes = store.sizes.map(s => {
      let stock = s.stock;
      if (params.runInterStoreTransfers && s.size === 42) {
        // transfers resolves the size break on size 42!
        stock = s.stock + 65; // Transferred 65 pairs to size 42
      }
      return {
        ...s,
        stock
      };
    });
    
    // Realtime calculations of simple operational metrics based on parameters
    const factor = footfall / store.baseFootfallDir;
    const dynamicCustomersInside = Math.max(1, Math.round(store.customersInside * (conversionRate / store.baseConversion) * factor * Math.max(0.6, params.staffPlanningRatio)));
    const dynamicWindowShoppersLooking = Math.round(store.windowShoppersLooking * factor * (params.globalDiscountBoost > 0 ? 1.25 : 1.0));
    const dynamicWindowShoppersWalkedBy = Math.round(store.windowShoppersWalkedBy * factor * (params.globalDiscountBoost > 0 ? 0.85 : 1.0));
    
    let staffCheckInsAdjusted = store.staffCheckIns;
    if (params.staffPlanningRatio < 0.7) {
      staffCheckInsAdjusted = store.staffCheckIns + " (Ingezaagde bezettingsalarm)";
    } else if (params.staffPlanningRatio > 1.3) {
      staffCheckInsAdjusted = store.staffCheckIns + " • Oproepkracht Extra Live";
    }

    return {
      ...store,
      footfall,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      transactions,
      avgBasket,
      revenue,
      grossMarginPercent: Math.round(grossMarginPercent),
      grossMargin,
      staffHours,
      staffCost,
      revPerStaffHour,
      marginPerStaffHour,
      clickAndCollectVolume,
      onlineOrdersFulfilled,
      mismatchSearchHits,
      ebitda,
      sellThroughRate,
      deadStockPercent,
      sizeBreaksCount,
      neeVerkoopCount,
      status,
      inventoryTurnover: parseFloat(inventoryTurnover.toFixed(1)),
      gmroi: parseFloat((gmroi * 10).toFixed(1)), // Amplified index for retail aesthetics
      brands,
      productGroups,
      sizes,
      customersInside: dynamicCustomersInside,
      windowShoppersLooking: dynamicWindowShoppersLooking,
      windowShoppersWalkedBy: dynamicWindowShoppersWalkedBy,
      staffCheckIns: staffCheckInsAdjusted
    };
  });
}

// Generate Live Alerts
export function getLiveAlerts(stores: Store[]): Alert[] {
  const alerts: Alert[] = [];
  
  stores.forEach(store => {
    // Sickness wave alert
    if (store.sickLeavePercent > 8) {
      alerts.push({
        id: `alert-sick-${store.id}`,
        storeId: store.id,
        storeName: store.name,
        type: "staffing_shortage",
        severity: "critical",
        title: "Hoog ziekteverzuim gedetecteerd",
        description: `Ziekteverzuim is momenteel ${store.sickLeavePercent}%. Dit veroorzaakt onderbezetting en gedaalde conversie.`,
        details: "Zaterdag shift mist momenteel 2 ervaren krachten. Plan extern personeel in of mobiliseer personeel uit naburige regio.",
        ctaText: "Plan vliegende kiep in",
        resolved: false
      });
    }
    
    // Size break mismatch
    if (store.sizeBreaksCount > 30) {
      alerts.push({
        id: `alert-size-${store.id}`,
        storeId: store.id,
        storeName: store.name,
        type: "size_break",
        severity: "warning",
        title: "Kritieke Maatbreuken geconstateerd",
        description: `Er zijn ${store.sizeBreaksCount} modellen met kritieke maatbreuken (bijv. hardlopende maten 41-43 uitverkocht).`,
        details: `Populaire Floris van Bommel heren-sneakers hebben 0 voorraad op maat 42 in ${store.city}, terwijl Utrecht er 55 over heeft.`,
        ctaText: "Start Interne Overplaatsing",
        resolved: false
      });
    }
    
    // Low conversion with high traffic
    if (store.conversionRate < 9.0 && store.footfall > 20000) {
      alerts.push({
        id: `alert-conv-${store.id}`,
        storeId: store.id,
        storeName: store.name,
        type: "low_conversion",
        severity: "warning",
        title: "Lage Conversie bij Hoog Bezoekersaantal",
        description: `Conversieratio is gedaald naar ${store.conversionRate}%, ondanks enorme drukte (${store.footfall} bezoekers).`,
        details: "Mogelijk onvoldoende vloerbezetting of verkeerde maatbeschikbaarheid. Klanten verlaten de winkel zonder aankoop.",
        ctaText: "Verhoog bezetting +15%",
        resolved: false
      });
    }
    
    // Omnichannel mismatch
    if (store.mismatchSearchHits > 100) {
      alerts.push({
        id: `alert-omni-${store.id}`,
        storeId: store.id,
        storeName: store.name,
        type: "online_demand",
        severity: "info",
        title: "Lokale Online Vraag Mismatch",
        description: `Webshop ziet ${store.mismatchSearchHits} gerichte zoekopdrachten in regio ${store.city} zonder dat lokale voorraad aanwezig is.`,
        details: "Dameslaarzen maat 39 worden intensief online gezocht rondom de winkelomtrek, maar winkel heeft 0 stuks.",
        ctaText: "Stuur webshop-voorraad op",
        resolved: false
      });
    }
    
    // Unprofitable stoplicht
    if (store.ebitda < 0) {
      alerts.push({
        id: `alert-unprofit-${store.id}`,
        storeId: store.id,
        storeName: store.name,
        type: "unprofitable",
        severity: "critical",
        title: "Structurele negatieve EBITDA bijlages",
        description: `Winkel draait momenteel verliesgevend (EBITDA: €${store.ebitda.toLocaleString("nl-NL")}).`,
        details: "Hoge huurkosten in combinatie met overmatige afprijzingen en matige conversie drukken resultaat onder break-even.",
        ctaText: "Activeer Margeherstel Plan",
        resolved: false
      });
    }
  });
  
  return alerts;
}

// Data Sources List (11. Databronnen)
export function getDataSources(): DataSource[] {
  return [
    { id: "pos-system", name: "POS / Kassa (Centric)", status: "connected", lastSync: "Live (1 minuut geleden)", recordsCount: 45780, category: "Omzet & Transacties" },
    { id: "erp-system", name: "ERP / Voorraad (Axi)", status: "connected", lastSync: "Live (5 minuten geleden)", recordsCount: 112450, category: "Voorraad & Inkoop" },
    { id: "shopify", name: "Webshop (Shopify Omnichannel)", status: "connected", lastSync: "Live (2 minuten geleden)", recordsCount: 89450, category: "Webshop & Online Zoekgedrag" },
    { id: "hr-planning", name: "Personeelsplanning (Dyflexis)", status: "connected", lastSync: "Vandaag, 05:00", recordsCount: 1240, category: "Personeel & Bezetting" },
    { id: "traffic-cam", name: "Bezoekerstellers (Prysm)", status: "connected", lastSync: "Live (Realtime)", recordsCount: 142800, category: "Klantgedrag / Deurentellers" },
    { id: "buienradar", name: "Weer API (Buienradar)", status: "connected", lastSync: "Elk half uur", recordsCount: 220, category: "Weersinvloeden" },
    { id: "google-my-business", name: "Google Reviews API", status: "syncing", lastSync: "Uurlijks", recordsCount: 540, category: "NPS & Reviews" }
  ];
}
