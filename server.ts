import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Heuristic fallback advice in Dutch if the Claude (Anthropic) key is not available or fails
const generateHeuristicAdvice = (storesData: any[], params: any) => {
  const lowMarginStores = storesData.filter((s: any) => s.grossMarginPercent < 40).map((s: any) => s.name);
  const sizeBreakStores = storesData.filter((s: any) => s.sizeBreaksCount > 15).map((s: any) => s.name);
  const sickStores = storesData.filter((s: any) => s.sickLeavePercent > 5).map((s: any) => s.name);
  const redStores = storesData.filter((s: any) => s.status === "RED").map((s: any) => s.name);

  let markdown = `### 🤖 Lokale AI heuristische twin-adviseur\n\n`;
  markdown += `*Let op: de live verbinding met de Claude (Anthropic) API is momenteel niet actief (geen API-sleutel ingesteld). Het systeem draait op de lokale heuristische 'Digital Twin core-engine'.*\n\n`;
  
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
  const { storesData, params, question } = req.body;

  if (!storesData || !params) {
    return res.status(400).json({ error: "Missing campaign data or store parameters" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Return local heuristic response if the Anthropic key isn't configured
    const advice = generateHeuristicAdvice(storesData, params);
    return res.json({ advice, source: "heuristic" });
  }

  try {
    // Construct rich context prompt for Claude
    const systemPrompt = `
      Je bent een scherpe, vriendelijke retail-sparringpartner voor een schoenenketen. Je denkt mee als een ervaren collega, niet als een adviesbureau.

      Toon en stijl:
      - Schrijf in natuurlijk, vlot Nederlands en spreek de lezer INFORMEEL aan met "je/jij". Noem de lezer NOOIT "directeur" en gebruik nooit "u".
      - Klink als een slimme, betrokken sparringpartner, niet als een consultancy-rapport. Vermijd corporate jargon en buzzwords.
      - Houd de markdown licht: geen ALL-CAPS koppen en geen star sjabloon van hoofdletter-koppen. Korte alinea's met af en toe een bullet zijn prima.

      Feiten:
      - Baseer elk getal en elke telling strikt op de meegeleverde data. Verzin nooit cijfers, winkels of namen.
      - Gebruik concrete getallen en winkelnamen uit de data waar dat helpt.

      Hoe je antwoordt:
      - Wordt er een specifieke vraag gesteld? Beantwoord dan precies die vraag, direct en concreet, en blijf erbij. Voeg geen ongevraagd strategisch advies of volledige sjabloon-analyse toe.
      - Vraagt iemand welke informatie je nodig hebt om te kunnen adviseren? Geef dan een gerichte, overzichtelijke lijst van precies de informatie/data die je daarvoor nodig zou hebben — en niets meer.
      - Alleen wanneer er GEEN specifieke vraag is gesteld, geef je de volledige gestructureerde analyse: welke winkels op stoplicht RED/ORANGE staan en waarom, de invloed van de actieve simulatie-parameters, de retail-KPI's (GMROI, conversie, brutomarge, dode voorraad, marge per gewerkt uur) en een korte lijst met de top 3 prioriteiten voor deze week.
    `;

    let userPrompt = `
      Het bedrijf heeft op dit moment exact ${storesData.length} winkels: ${storesData.map((s: any) => s.city).join(", ")}. Een eventuele nieuwe winkel zou dus de ${storesData.length + 1}e zijn.

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

    // Als de directeur een specifieke vraag stelt, voeg die toe; anders volledige analyse
    if (typeof question === "string" && question.trim()) {
      userPrompt += "\n\nVraag van de directeur: " + question + "\n\nBeantwoord deze vraag concreet op basis van bovenstaande digital-twin data.";
    }

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const data = await resp.json();
    const advice = data?.content?.[0]?.text || "";

    res.json({ advice, source: "claude" });
  } catch (error: any) {
    console.error("Claude Advisor Request failed:", error);
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
