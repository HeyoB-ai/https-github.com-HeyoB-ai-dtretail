// Heuristic fallback advice in Dutch if the Claude (Anthropic) key is not available or fails
const generateHeuristicAdvice = (storesData, params) => {
  const lowMarginStores = storesData.filter((s) => s.grossMarginPercent < 40).map((s) => s.name);
  const sizeBreakStores = storesData.filter((s) => s.sizeBreaksCount > 15).map((s) => s.name);
  const sickStores = storesData.filter((s) => s.sickLeavePercent > 5).map((s) => s.name);
  const redStores = storesData.filter((s) => s.status === "RED").map((s) => s.name);

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

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  let storesData, params, question;
  try {
    ({ storesData, params, question } = JSON.parse(event.body || "{}"));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  if (!storesData || !params) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing campaign data or store parameters" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Return local heuristic response if the Anthropic key isn't configured
    const advice = generateHeuristicAdvice(storesData, params);
    return { statusCode: 200, body: JSON.stringify({ advice, source: "heuristic" }) };
  }

  try {
    // Construct rich context prompt for Claude
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

    let userPrompt = `
      --- SIMULATIE PARAMETERS ---
      - Globale Kortingsboost: +${params.globalDiscountBoost}% (huidig niveau)
      - Personeelsbezetting Ratio: ${params.staffPlanningRatio}x ten opzichte van regulier
      - Interne Overplaatsing Schoenen: ${params.runInterStoreTransfers ? "ACTIEF (Schoenen worden herverdeeld om maatbreuken te dichten)" : "INACTIEF"}
      - Weerscenario: ${params.weatherScenario}
      - Prijsaanpassing: ${params.priceAdjustment}% ten opzichte van basislijn
      - Actieve Lokale Campagne Winkel ID: ${params.activeLocalCampaignStoreId}

      --- WINKELS STATUS RAPPORT ---
      ${storesData.map((s) => `
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
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const data = await resp.json();
    const advice = data?.content?.[0]?.text || "";

    return { statusCode: 200, body: JSON.stringify({ advice, source: "claude" }) };
  } catch (error) {
    console.error("Claude Advisor Request failed:", error);
    // Fallback to local heuristic response
    const advice = generateHeuristicAdvice(storesData, params);
    return { statusCode: 200, body: JSON.stringify({ advice, source: "error-fallback", errorMessage: error.message }) };
  }
};
