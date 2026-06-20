/**
 * Canonical team names + a map from the spreadsheet's misspelled / Spanish
 * spellings (e.g. "MEJICO", "BONCIA y HERCE") to clean names. Used when the
 * admin imports or edits fixtures so the UI always shows tidy names while the
 * group's original sheet stays recognisable.
 *
 * Keys are compared case-insensitively after trimming.
 */
export const TEAM_ALIASES: Record<string, string> = {
  // Mexico
  "MEJICO": "Mexico",
  "MEXICO": "Mexico",
  // South Africa
  "SOUTH AFRICA": "South Africa",
  // Korea Republic
  "REPUB COREA": "South Korea",
  "KOREA REPUB": "South Korea",
  // Czechia
  "CZECHIA": "Czechia",
  // Canada
  "CANADA": "Canada",
  // Bosnia and Herzegovina
  "BONCIA Y HERCE": "Bosnia and Herzegovina",
  "BOSNIA - HERZE": "Bosnia and Herzegovina",
  "BOSNIA HERZEG": "Bosnia and Herzegovina",
  // USA
  "USA": "United States",
  // Paraguay
  "PARAGUAY": "Paraguay",
  // Haiti
  "HAITI": "Haiti",
  // Scotland
  "SCOTLAN": "Scotland",
  "SCOTLAND": "Scotland",
  // Australia
  "AUSTRALIA": "Australia",
  // Türkiye
  "TURKIA": "Türkiye",
  "TURKIYE": "Türkiye",
  "TUKIYE": "Türkiye",
  // Brazil
  "BRAZIL": "Brazil",
  // Morocco
  "MOROCA": "Morocco",
  "MOROCO": "Morocco",
  // Qatar
  "QATAR": "Qatar",
  // Switzerland
  "SWITZELAND": "Switzerland",
  "SWITZERLAND": "Switzerland",
  // Côte d'Ivoire
  "COTE D'IVORE": "Côte d'Ivoire",
  "COTR D' IVOIRE": "Côte d'Ivoire",
  // Ecuador
  "ECUADOR": "Ecuador",
  // Germany
  "GERMANY": "Germany",
  // Curaçao
  "CURACAO": "Curaçao",
  // Netherlands
  "NETHERLAND": "Netherlands",
  "NETHERLANDS": "Netherlands",
  // Japan
  "JAPON": "Japan",
  // Sweden
  "SWEDEN": "Sweden",
  // Tunisia
  "TUNISIA": "Tunisia",
  // Saudi Arabia
  "SOUDI ARABIA": "Saudi Arabia",
  "SAUDI ARABIA": "Saudi Arabia",
  // Uruguay
  "URUGUAY": "Uruguay",
  "URUGAY": "Uruguay",
  // Spain
  "SPAIN": "Spain",
  "SPANA": "Spain",
  // Cape Verde
  "CABO VERDE": "Cape Verde",
  // Iran
  "IR IRAN": "Iran",
  // New Zealand
  "NEW ZEALAND": "New Zealand",
  // Belgium
  "BELGIUM": "Belgium",
  // Egypt
  "EGYPT": "Egypt",
  "EGIPTO": "Egypt",
  // France
  "FRANCIA": "France",
  "FRANCE": "France",
  // Senegal
  "SENEGAL": "Senegal",
  // Iraq
  "INAQ": "Iraq",
  "IRAQ": "Iraq",
  // Norway
  "NORWAY": "Norway",
  // Argentina
  "ARGENTINA": "Argentina",
  // Algeria
  "ALGERIA": "Algeria",
  "ARGELIA": "Algeria",
  // Austria
  "AUSTRIA": "Austria",
  // Jordan
  "JORDANIA": "Jordan",
  "JORDAN": "Jordan",
  // Ghana
  "GHANA": "Ghana",
  // Panama
  "PANAMA": "Panama",
  // England
  "ENGLAND": "England",
  // Croatia
  "CROATIA": "Croatia",
  // Portugal
  "PORTUGAL": "Portugal",
  // DR Congo
  "CONGO DR": "DR Congo",
  // Uzbekistan
  "UZBEKISTAN": "Uzbekistan",
  "LIZBEKISTAN": "Uzbekistan",
  // Colombia
  "COLOMBIA": "Colombia",
};

/** Returns the clean team name for a raw (possibly misspelled) spreadsheet value. */
export function canonicalTeam(raw: string): string {
  const key = raw.trim().toUpperCase();
  return TEAM_ALIASES[key] ?? raw.trim();
}
