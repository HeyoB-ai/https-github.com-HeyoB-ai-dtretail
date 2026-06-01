import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY key is missing. Falling back to local heuristic advisor.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Heuristic fallback advice in Dutch if Gemini Key is not available or fails
const generateHeuristicAdvice = (storesData: any[], params: any) => {
  const lowMarginStores = storesData.filter((s: any) => s.grossMarginPercent < 40).map((s: any) => s.name);
  const sizeBreakStores = storesData.filter((s: any) => s.sizeBreaksCount > 15).map((s: any) => s.name);
  const sickStores = storesData.filter((s: any) => s.sickLeavePercent > 5).map((s: any) => s.name);
  const redStores = storesData.filter((s: any) => s.status === "RED").map((s: any) => s.name);

  let markdown = `### 🤖 Lokale AI heuristische twin-adviseur\n\n`;
  markdown += `*Let op: de live verbinding met de Gemini API is momenteel niet actief (geen API-sleutel in Secrets). Het systeem draait op de lokale heuristische 'Digital Twin core-engine'.*\n\n`;
  
  markdown += `#### 📊 Algemene statusanalyse\n`;
  markdown += `U heeft momenteel **${storesData.length} winkels** geconfigureerd in uw simulatiemodel. \n`;
  if (redStores.length > 0) {
    markdown += `🚨 **Kritiek:** Vestiging **${redStores.join(", ")}** draait met een negatieve EBITDA. Direct ingrijpen is noodzakelijk om cash leak te voorkomen.\n\n`;
  } else {
    markdown += `✅ **Gezond:** Alle winkels draaien momenteel met een positieve EBITDA-bijdrage. Goed operationeel beheer!\n\n`;
  }

  markdown += `#### 🔍 Knelpunten & aanbevelingen\n`;
  
  if (params.weatherScenario === "rainy") {
    markdown += `🌧️ **Weersinvloed (regenachtig):** De fysieke passantenstroom is met 15% gedaald. Laarzen en onderhoudsproducten verkopen sterk, maar sneakers liggen stil. \n`;
    markdown += `*Advies:* Promoot onderhoudssprays bij elke kassa-transactie. Verhoog de online advertentieradius voor de webshop.\n\n`;
  } else if (params.weatherScenario === "sunny") {
    markdown += `☀️ **Weersinvloed (zonnig):** Straatdrukte stijgt (+15%). Sneakers vliegen de deur uit, maar winterschoenen liggen stil.\n`;
    markdown += `*Advies:* Richt de etalages in voor lichte zomersneakers. Zorg dat de weekendbezetting maximaal is vanwege verhoogde passage.\n\n`;
  }

  if (params.runInterStoreTransfers) {
    markdown += `🔄 **Interne overplaatsingen (ACTIEF):** Uitstekende keuze! Door overschotvoorraad te verplaatsen naar Utrecht en Rotterdam lossen we grote maatbreuken op maat 42 op. \n`;
    markdown += `*Effect:* Conversieratio stijgt landelijk met gemiddeld **+2.5%** en de 'nee-verkoop' daalt met **90%**. Dit levert directe margebijdrage.\n\n`;
  } else {
    markdown += `⚠️ **Interne overplaatsingen (INACTIEF):** Er is een scheve voorraadverdeling! Rotterdam heeft dode voorraad en Utrecht kampt met een nee-verkoop op maat 42. \n`;
    markdown += `*Advies:* Activeer de "Inter-store Stock Transfers" simulation-schuifregelaar om deze maatbreuken direct te corrigeren.\n\n`;
  }

  if (lowMarginStores.length > 0) {
    markdown += `📉 **Marge-uitholling:** Winkels **${lowMarginStores.join(", ")}** hebben een brutomarge onder de critical 40% drempel. Dit wordt veroorzaakt door het hoge kortingpercentage (${params.globalDiscountBoost}% boost).\n`;
    markdown += `*Advies:* Draai de kortingsboost terug. Het "kopen" van omzet via te veel korting sloopt de operationele winst.\n\n`;
  }

  if (sickStores.length > 0) {
    markdown += `🤒 **Personeelsbezetting:** **${sickStores.join(", ")}** lijdt onder uitzonderlijk hoog verzuim. De shiftbezetting is te dun om passanten effectief te converteren.\n`;
    markdown += `*Advies:* Verplaats resources of huur een weekendkracht in om de conversie op peil te houden.\n\n`;
  }

  markdown += `#### 💡 Strategische simulatieprojectie\n`;
  markdown += `- **Huidige prijsmarge-correctie:** ${params.priceAdjustment > 0 ? `+${params.priceAdjustment}%` : `${params.priceAdjustment}%`}. Dit heeft een direct effect op uw landelijke **GMROI**.`;
  
  return markdown;
};

// API: Check health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API: Advisor - Generative strategic feedback based on twin state
app.post("/api/advisor", async (req, res) => {
  const { storesData, params } = req.body;

  if (!storesData || !params) {
    return res.status(400).json({ error: "Missing campaign data or store parameters" });
  }

  const ai = getGeminiClient();
  
  if (!ai) {
    // Return local heuristic response if apiKey isn't configured
    const advice = generateHeuristicAdvice(storesData, params);
    return res.json({ advice, source: "heuristic" });
  }

  try {
    // Construct rich context prompt for Gemini
    const systemPrompt = `
      Je bent de 'Digital Twin Intelligence Engine' voor een schoenenretail-directeur van een keten met 5 winkels.
      Analyseer de geleverde JSON data over de retailers-stores en de actieve scenario-parameters van de directeur.
      Schrijf een uiterst scherpe, professionele en to-the-point strategische analyse in het Nederlands.
      
      Richtlijnen voor je antwoord:
      1. Gebruik concrete getallen en winkelnamen uit de meegestuurde data.
      2. Noem direct welke winkels in 'Stoplicht status RED/ORANGE' staan en waarom.
      3. Analyseer de invloed van de actieve simulatie-parameters en geef concrete aanwijzingen wat de directeur direct moet aanpassen (bijv. korting omlaag, personeel omhoog, of stock transfers aan).
      4. Focus op retail-specifieke KPI's zoals GMROI (marge per euro voorraad), conversieratio, brutomarge versus omzet, dode voorraad, en personeelsproductiviteit (marge per gewerkt uur).
      5. Geef een concrete actielijst met top 3 prioriteiten voor deze week.
      6. Schrijf de tekst in elegante markdown met heldere koppen en bulletpoints. Vermijd jargon en 'buzzwords' van lage kwaliteit. Spreek de directeur aan met 'Directeur' of 'U'.
    `;

    const userPrompt = `
      --- SIMULATIE PARAMETERS ---
      - Globale Kortingsboost: +${params.globalDiscountBoost}% (huidig niveau)
      - Personeelsbezetting Ratio: ${params.staffPlanningRatio}x ten opzichte van regulier
      - Interne Overplaatsing Schoenen: ${params.runInterStoreTransfers ? "ACTIEF (Schoenen worden herverdeeld om maatbreuken te dichten)" : "INACTIEF"}
      - Weerscenario: ${params.weatherScenario}
      - Prijsaanpassing: ${params.priceAdjustment}% ten opzichte van basislijn
      - Actieve Lokale Campagne Winkel ID: ${params.activeLocalCampaignStoreId}

      --- WINKELS STATUS RAPPORT ---
      ${storesData.map((s: any) => `
      * Winkel: ${s.name} (Stad: ${s.city})
        - Status: ${s.status} (Stoplicht)
        - Omzet: €${s.revenue.toLocaleString("nl-NL")} | Brutomarge%: ${s.grossMarginPercent}% | EBITDA: €${s.ebitda.toLocaleString("nl-NL")}
        - Bezoekers (Footfall): ${s.footfall} | Conversie: ${s.conversionRate}% | Transacties: ${s.transactions} | Gem. Bon: €${s.avgBasket}
        - Voorraad: ${s.totalStockPairs} paar (Waarde: €${s.totalStockValue.toLocaleString("nl-NL")}) | GMROI: ${s.gmroi} | Dode voorraad%: ${s.deadStockPercent}%
        - Maatbreuken (Producten): ${s.sizeBreaksCount} | Nee-verkoop (Gemist): ${s.neeVerkoopCount} stuks
        - Personeel gewerkt: ${s.staffHours} uur | Personeelskosten: €${s.staffCost.toLocaleString("nl-NL")} | Marge per uur: €${s.marginPerStaffHour}
        - Ziekteverzuim: ${s.sickLeavePercent}% | NPS: ${s.nps}
        - Online Mismatch regio search hits: ${s.mismatchSearchHits} (online zoekopdrachten naar niet-voorradige maten lokaal)
      `).join("\n")}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ advice: response.text, source: "gemini" });
  } catch (error: any) {
    console.error("Gemini Advisor Request failed:", error);
    // Fallback to local heuristic response
    const advice = generateHeuristicAdvice(storesData, params);
    res.json({ advice, source: "error-fallback", errorMessage: error.message });
  }
});

// Setup Vite development server or production assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Digital Twin Server listening on port ${PORT}`);
  });
}

startServer();
