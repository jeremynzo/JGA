import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Car, Truck, Tent, Music, Plus, ChevronUp, ChevronDown, X, Search,
  Mountain, Building2, Beer, PartyPopper, Utensils, ArrowDown, AlertTriangle,
  MapPin, Check, RotateCcw, Clock, Sparkles, EyeOff, Eye, Undo2,
  Users, LogOut, Copy, Wifi, WifiOff, Loader2, Globe, Map as MapIcon,
  ThumbsUp, User as UserIcon, Pencil
} from 'lucide-react';
import { supabase } from './supabase';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// ============= Konstanten =============
const STUTTGART = [48.7758, 9.1829];
const DAYS = ['sat', 'sun'];
const DAY_LABEL = { sat: 'Samstag 22.08.', sun: 'Sonntag 23.08.' };
const DAY_SHORT = { sat: 'Sa 22.08.', sun: 'So 23.08.' };
const DAY_START_TIME = { sat: 9 * 60, sun: 9 * 60 };

const CATS = {
  transport:  { label: 'Transport',   Icon: Truck,        badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  auto:       { label: 'Ring & Auto', Icon: Car,          badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  adventure:  { label: 'Adventure',   Icon: Mountain,     badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  party:      { label: 'Party',       Icon: Music,        badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  essen:      { label: 'Essen',       Icon: Utensils,     badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  schlafen:   { label: 'Schlafen',    Icon: Tent,         badge: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
  kultur:     { label: 'Kultur',      Icon: Building2,    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  chill:      { label: 'Chill',       Icon: Beer,         badge: 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300' },
  braeutigam: { label: 'Bräutigam',   Icon: PartyPopper,  badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' }
};

const STATUS_LIST = ['offen', 'angefragt', 'gebucht'];
const STATUS_CLASS = {
  offen:     'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  angefragt: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  gebucht:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
};

const ACTIVITIES = [
  { id: 'transport', cat: 'transport', name: '9-Sitzer Sprinter Anreise Stuttgart → Eifel', region: 'Transport', coords: [50.3356, 6.9475], duration: 240, price: 60, desc: 'Mietwagen-Anteil pro Person fürs Wochenende' },
  { id: 'ringtaxi-m3', cat: 'auto', name: 'Ringtaxi BMW M3 CS Karussell', region: 'Nürburgring', coords: [50.3356, 6.9475], duration: 90, price: 135, desc: '3 BMW M3 CS parallel, alle 8 fahren mit Profi über die Nordschleife' },
  { id: 'gt3rs', cat: 'auto', name: 'Hot Lap Porsche GT3 RS (nur Bräutigam)', region: 'Nürburgring', coords: [50.3356, 6.9475], duration: 30, price: 50, desc: 'Manthey-Porsche, 399 € auf Gruppe aufgeteilt' },
  { id: 'rent4ring', cat: 'auto', name: 'Touristenfahrt Rent4Ring Mini Cooper S', region: 'Nürburgring', coords: [50.3356, 6.9475], duration: 60, price: 80, desc: 'Mietwagen mit Ringversicherung, selbst fahren' },
  { id: 'kart-ring', cat: 'auto', name: 'ring°kartbahn E-Karts indoor', region: 'Nürburgring', coords: [50.3329, 6.9410], duration: 75, price: 25, desc: 'Indoor E-Karts direkt am Ring' },
  { id: 'bruennchen', cat: 'chill', name: 'Brünnchen zuschauen + Bier', region: 'Nürburgring', coords: [50.3445, 6.9747], duration: 90, price: 5, desc: 'Vom Brünnchen-Parkplatz Touristenfahrten beobachten' },
  { id: 'pistenklause', cat: 'essen', name: 'Pistenklause Steak vom heißen Stein', region: 'Nürburg', coords: [50.3389, 6.9489], duration: 120, price: 45, desc: 'Ring-Kult, Reservierung 02691 922053' },
  { id: 'devils', cat: 'essen', name: "Devil's Diner Mittag", region: 'Nürburgring', coords: [50.3324, 6.9410], duration: 60, price: 18, desc: 'Burger und Bier an der Döttinger Höhe' },
  { id: 'fascination', cat: 'essen', name: 'Brunch Dorint Fascination', region: 'Nürburg', coords: [50.3361, 6.9509], duration: 90, price: 22, desc: 'Sonntag-Brunch im Dorint Hocheifel' },
  { id: 'ringwerk', cat: 'kultur', name: 'ring°werk Museum', region: 'Nürburgring', coords: [50.3329, 6.9484], duration: 90, price: 14, desc: 'Motorsport-Museum direkt am Ring' },
  { id: 'zipline', cat: 'adventure', name: 'EifelAdventures Zipline-Tour', region: 'Berlingen', coords: [50.0989, 6.6275], duration: 150, price: 49, desc: '12 Ziplines inkl. Mega-Zipline, 2,5 h' },
  { id: 'kletterwald', cat: 'adventure', name: 'Kletterwald Vulkanpark Mayen', region: 'Mayen', coords: [50.3266, 7.2247], duration: 240, price: 26, desc: 'Hochseilgarten, viele Parcours' },
  { id: 'camp-ring', cat: 'schlafen', name: 'Camping am Nürburgring (1 Nacht)', region: 'Müllenbach', coords: [50.3450, 6.9050], duration: 0, price: 22, desc: '2,5 km vom Ring, Tel. 02692 224' },
  { id: 'cochem-essen', cat: 'essen', name: 'Weinstube Zum Kapuziner Cochem', region: 'Cochem', coords: [50.1456, 7.1672], duration: 120, price: 40, desc: 'Mosel-Restaurant mit Blick' },
  { id: 'kingstons', cat: 'party', name: 'Kingstons Club Cochem', region: 'Cochem', coords: [50.1447, 7.1685], duration: 180, price: 25, desc: 'Der Club in Cochem' },
  { id: 'reichsburg', cat: 'kultur', name: 'Reichsburg Cochem', region: 'Cochem', coords: [50.1469, 7.1631], duration: 90, price: 8, desc: 'Burg-Besichtigung über der Mosel' },
  { id: 'bauchladen-cochem', cat: 'party', name: 'Bauchladen-Tour Cochem Altstadt', region: 'Cochem', coords: [50.1454, 7.1660], duration: 120, price: 15, desc: 'Bräutigam verkauft Shots an Passanten' },
  { id: 'ash', cat: 'essen', name: 'The ASH Steakhouse Stuttgart', region: 'Stuttgart', coords: [48.7758, 9.1773], duration: 120, price: 50, desc: 'Premium Steakhouse Bolzstraße' },
  { id: 'perkins', cat: 'party', name: 'Perkins Park Stuttgart', region: 'Stuttgart', coords: [48.8068, 9.1681], duration: 240, price: 20, desc: 'Funk, Soul, Charts Club' },
  { id: 'proton', cat: 'party', name: 'Proton Club Stuttgart', region: 'Stuttgart', coords: [48.7787, 9.1761], duration: 240, price: 20, desc: 'Elektro Club Königstraße' },
  { id: 'theo', cat: 'party', name: 'Theodor-Heuss-Straße Bar-Hopping', region: 'Stuttgart', coords: [48.7775, 9.1750], duration: 180, price: 45, desc: 'Stuttgarter Partymeile' },
  { id: 'rafting', cat: 'adventure', name: 'Murgtal Rafting + BBQ', region: 'Forbach', coords: [48.6857, 8.3597], duration: 270, price: 99, desc: 'Rafting, Flussbett, Abseilen inkl. BBQ' },
  { id: 'buggy', cat: 'adventure', name: 'Buggy Offroad Schenkenzell', region: 'Schenkenzell', coords: [48.3225, 8.3475], duration: 120, price: 200, desc: '80-PS Side-by-Side selbst fahren' },
  { id: 'schloessle', cat: 'schlafen', name: 'Schlössle Schenkenzell (1 Nacht)', region: 'Schenkenzell', coords: [48.3225, 8.3475], duration: 0, price: 90, desc: 'Gruppenunterkunft mit Sauna und Beefer-Grill' },
  { id: 'kartion', cat: 'auto', name: 'Kartion Gärtringen exklusiv', region: 'Gärtringen', coords: [48.6406, 8.9039], duration: 90, price: 70, desc: '600 m Indoor-Kartbahn, exklusiv buchbar' },
  { id: 'lasertag', cat: 'adventure', name: 'Lasertag Stuttgart', region: 'Stuttgart', coords: [48.7860, 9.1850], duration: 90, price: 25, desc: 'Indoor-Lasertag in der City' },
  { id: 'paintball', cat: 'adventure', name: 'Paintball Outdoor', region: 'Stuttgart-Umland', coords: [48.8200, 9.3000], duration: 180, price: 60, desc: '500 Bälle inklusive' },
  { id: 'escape', cat: 'adventure', name: 'Escape Room Stuttgart', region: 'Stuttgart', coords: [48.7765, 9.1800], duration: 75, price: 30, desc: 'Rätsel mit der Gruppe knacken' },
  { id: 'area47', cat: 'adventure', name: 'Area47 Ötztal Tageskarte', region: 'Ötztal', coords: [47.2306, 10.8389], duration: 480, price: 49, desc: 'Wasserpark, Cliff Jumps, Megaswing - aber weit weg!' },
  { id: 'area47-camp', cat: 'schlafen', name: 'Area47 Camp Übernachtung', region: 'Ötztal', coords: [47.2306, 10.8389], duration: 0, price: 28, desc: 'Camping direkt am Area47' },
  { id: 'b-shirts', cat: 'braeutigam', name: 'T-Shirts mit Team-Logo drucken', region: 'Vorbereitung', coords: null, duration: 0, price: 25, desc: 'Mind. 2 Wochen Vorlauf bei Spreadshirt' },
  { id: 'b-bauchladen', cat: 'braeutigam', name: 'Bauchladen befüllen', region: 'Vorbereitung', coords: null, duration: 0, price: 15, desc: 'Shots, Süßes, Mini-Geschenke, Aufkleber' },
  { id: 'b-overall', cat: 'braeutigam', name: 'Bräutigam-Overall + Helm', region: 'Vorbereitung', coords: null, duration: 0, price: 10, desc: 'Weißer Overall mit Renn-Aufklebern' },
  { id: 'b-shots', cat: 'braeutigam', name: 'Mini-Vodka 24er-Pack', region: 'Vorbereitung', coords: null, duration: 0, price: 8, desc: 'Für Bauchladen und Spiele' },
  { id: 'b-krone', cat: 'braeutigam', name: 'Bräutigam-Sash + Krone', region: 'Vorbereitung', coords: null, duration: 0, price: 5, desc: 'JGA-Shop oder Amazon' },
  { id: 'b-polaroid', cat: 'braeutigam', name: 'Polaroid-Kamera + Filme', region: 'Vorbereitung', coords: null, duration: 0, price: 12, desc: 'Reicht für ca. 30 Fotos' },
  { id: 'g-reifen', cat: 'braeutigam', name: 'Spiel: Reifenwechsel auf Zeit', region: 'Vor Ort', coords: null, duration: 30, price: 0, desc: 'Reifen mitbringen, Bräutigam mit Augenbinde' },
  { id: 'g-boxenstopp', cat: 'braeutigam', name: 'Spiel: Boxenstopp-Challenge', region: 'Vor Ort', coords: null, duration: 20, price: 0, desc: 'Mini-Parcours mit Hütchen, pro Patzer ein Shot' },
  { id: 'g-schnaps', cat: 'braeutigam', name: 'Spiel: Schnaps blind verkosten', region: 'Vor Ort', coords: null, duration: 30, price: 5, desc: '5 Schnäpse blind erraten' },
  { id: 'g-karaoke', cat: 'braeutigam', name: 'Pflicht-Song Karaoke', region: 'Vor Ort', coords: null, duration: 10, price: 0, desc: 'Bräutigam singt vorgegebenen Song' },
  { id: 'm-bauchladen', cat: 'braeutigam', name: 'Mission: Bauchladen ausverkaufen', region: 'Vor Ort', coords: null, duration: 0, price: 0, desc: 'Läuft parallel zu anderen Aktivitäten' },
  { id: 'm-foto', cat: 'braeutigam', name: 'Mission: 15 Foto-Aufgaben', region: 'Vor Ort', coords: null, duration: 0, price: 0, desc: 'z. B. mit Polizist, vor Burg, Headstand' }
];

const PLACES = [
  { name: 'Stuttgart', coords: [48.7758, 9.1829] },
  { name: 'Stuttgart-Vaihingen', coords: [48.7280, 9.1075] },
  { name: 'Esslingen', coords: [48.7407, 9.3066] },
  { name: 'Sindelfingen', coords: [48.7088, 9.0086] },
  { name: 'Böblingen', coords: [48.6849, 9.0148] },
  { name: 'Gärtringen', coords: [48.6406, 8.9039] },
  { name: 'Tübingen', coords: [48.5216, 9.0576] },
  { name: 'Heilbronn', coords: [49.1427, 9.2109] },
  { name: 'Pforzheim', coords: [48.8924, 8.6946] },
  { name: 'Baden-Baden', coords: [48.7606, 8.2398] },
  { name: 'Karlsruhe', coords: [49.0069, 8.4037] },
  { name: 'Heidelberg', coords: [49.3988, 8.6724] },
  { name: 'Mannheim', coords: [49.4875, 8.4660] },
  { name: 'Forbach (Schwarzwald)', coords: [48.6857, 8.3597] },
  { name: 'Freudenstadt', coords: [48.4636, 8.4126] },
  { name: 'Triberg', coords: [48.1297, 8.2317] },
  { name: 'Schenkenzell', coords: [48.3225, 8.3475] },
  { name: 'Schluchsee', coords: [47.8170, 8.1639] },
  { name: 'Freiburg', coords: [47.9990, 7.8421] },
  { name: 'Titisee', coords: [47.9072, 8.1497] },
  { name: 'Nürburgring', coords: [50.3356, 6.9475] },
  { name: 'Nürburg', coords: [50.3334, 6.9491] },
  { name: 'Adenau', coords: [50.3829, 6.9419] },
  { name: 'Müllenbach (Eifel)', coords: [50.3504, 6.9131] },
  { name: 'Mayen', coords: [50.3266, 7.2247] },
  { name: 'Daun', coords: [50.1958, 6.8311] },
  { name: 'Berlingen (Eifel)', coords: [50.0989, 6.6275] },
  { name: 'Cochem', coords: [50.1432, 7.1660] },
  { name: 'Koblenz', coords: [50.3569, 7.5890] },
  { name: 'Trier', coords: [49.7596, 6.6442] },
  { name: 'Bernkastel-Kues', coords: [49.9170, 7.0728] },
  { name: 'München', coords: [48.1351, 11.5820] },
  { name: 'Frankfurt am Main', coords: [50.1109, 8.6821] },
  { name: 'Köln', coords: [50.9375, 6.9603] },
  { name: 'Mainz', coords: [50.0026, 8.2730] },
  { name: 'Wiesbaden', coords: [50.0826, 8.2493] },
  { name: 'Saarbrücken', coords: [49.2401, 6.9969] },
  { name: 'Hockenheimring', coords: [49.3289, 8.5575] },
  { name: 'Europa-Park Rust', coords: [48.2667, 7.7167] },
  { name: 'Bilster Berg', coords: [51.8408, 9.1750] },
  { name: 'Bodensee (Konstanz)', coords: [47.6603, 9.1755] },
  { name: 'Innsbruck', coords: [47.2692, 11.4041] },
  { name: 'Ötztal (Roppen)', coords: [47.2306, 10.8389] },
  { name: 'Sölden', coords: [46.9692, 11.0078] },
  { name: 'Salzburg', coords: [47.8095, 13.0550] },
  { name: 'Garmisch-Partenkirchen', coords: [47.4917, 11.0958] },
  { name: 'Eibsee (Grainau)', coords: [47.4569, 10.9819] },
  { name: 'Zugspitze', coords: [47.4211, 10.9853] },
  { name: 'Mittenwald', coords: [47.4421, 11.2628] },
  { name: 'Oberammergau', coords: [47.5994, 11.0656] },
  { name: 'Füssen / Neuschwanstein', coords: [47.5575, 10.7497] },
  { name: 'Lindau (Bodensee)', coords: [47.5497, 9.6843] },
  { name: 'Friedrichshafen', coords: [47.6541, 9.4759] },
  { name: 'Meersburg', coords: [47.6953, 9.2719] },
  { name: 'Bregenz (Vorarlberg)', coords: [47.5031, 9.7471] },
  { name: 'Oberstdorf', coords: [47.4097, 10.2789] },
  { name: 'Kempten', coords: [47.7263, 10.3142] },
  { name: 'Memmingen', coords: [47.9878, 10.1809] },
  { name: 'Ulm', coords: [48.4011, 9.9876] },
  { name: 'Augsburg', coords: [48.3705, 10.8978] },
  { name: 'Plansee (Tirol)', coords: [47.4811, 10.8169] },
  { name: 'Reutte (Tirol)', coords: [47.4906, 10.7158] },
  { name: 'Berchtesgaden', coords: [47.6303, 13.0044] },
  { name: 'Königssee', coords: [47.5500, 12.9831] },
  { name: 'Tegernsee', coords: [47.7286, 11.7569] },
  { name: 'Schliersee', coords: [47.7383, 11.8606] },
  { name: 'Walchensee', coords: [47.5694, 11.3286] },
  { name: 'Bad Tölz', coords: [47.7611, 11.5611] },
  { name: 'Imst', coords: [47.2406, 10.7372] },
  { name: 'Landeck', coords: [47.1394, 10.5664] }
];

// ============= Helpers =============
function haversine(c1, c2) {
  if (!c1 || !c2) return 0;
  const R = 6371;
  const dLat = (c2[0] - c1[0]) * Math.PI / 180;
  const dLng = (c2[1] - c1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(c1[0] * Math.PI / 180) * Math.cos(c2[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.35;
}
function travelMin(km) { return Math.ceil((km / 85) * 60); }
function fmtDur(min) {
  if (min === 0) return '—';
  if (min < 60) return Math.round(min) + ' min';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? h + ' h' : h + ' h ' + m + ' min';
}
function fmtTime(m) {
  if (m >= 24 * 60) {
    const d = Math.floor(m / (24 * 60));
    const r = m % (24 * 60);
    return '+' + d + 'd ' + String(Math.floor(r / 60)).padStart(2, '0') + ':' + String(r % 60).padStart(2, '0');
  }
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}
function uid() { return Math.random().toString(36).substring(2, 10); }
function generateRoomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function shortenDisplayName(name) {
  if (!name) return '';
  const parts = name.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length <= 2) return name;
  const main = parts[0];
  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];
  if (secondLast && secondLast.length < 20 && !/\d/.test(secondLast)) {
    return `${main}, ${secondLast}`;
  }
  return `${main}, ${last}`;
}

// OSM-Tags auf JGA-Kategorien mappen
function osmTagsToCategory(tags) {
  if (!tags) return null;
  if (tags.amenity === 'nightclub' || tags.club === 'nightclub' || tags.amenity === 'disco') return 'party';
  if (tags.amenity === 'bar' || tags.amenity === 'pub' || tags.amenity === 'biergarten') return 'chill';
  if (tags.amenity === 'cafe' || tags.amenity === 'ice_cream') return 'chill';
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food' || tags.amenity === 'food_court') return 'essen';
  if (tags.sport === 'karting' || tags.sport === 'motor' || tags.leisure === 'motorsports_centre') return 'auto';
  if (tags.tourism === 'museum') return 'kultur';
  if (tags.historic) return 'kultur';
  if (tags.tourism === 'attraction' || tags.tourism === 'viewpoint' || tags.tourism === 'gallery') return 'kultur';
  if (tags.tourism === 'theme_park' || tags.leisure === 'water_park' || tags.leisure === 'adventure_park') return 'adventure';
  if (tags.leisure === 'sports_centre' || tags.leisure === 'escape_game' || tags.leisure === 'bowling_alley' || tags.leisure === 'miniature_golf' || tags.leisure === 'climbing') return 'adventure';
  return null;
}

function estimateDuration(cat) {
  if (cat === 'essen') return 90;
  if (cat === 'party') return 180;
  if (cat === 'chill') return 90;
  if (cat === 'kultur') return 60;
  if (cat === 'adventure') return 120;
  if (cat === 'auto') return 60;
  return 60;
}

async function fetchNearbyPOIs(lat, lng, radiusKm, signal) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return [];
  const r = Math.round((radiusKm || 30) * 1000);
  const query = `[out:json][timeout:20];
(
  node["amenity"~"^(bar|pub|biergarten|nightclub|restaurant|fast_food|cafe|food_court|ice_cream)$"]["name"](around:${r},${lat},${lng});
  node["tourism"~"^(museum|attraction|viewpoint|theme_park|gallery)$"]["name"](around:${r},${lat},${lng});
  node["leisure"~"^(water_park|adventure_park|sports_centre|escape_game|bowling_alley|miniature_golf|climbing)$"]["name"](around:${r},${lat},${lng});
  node["sport"~"^(karting|motor)$"]["name"](around:${r},${lat},${lng});
  node["historic"~"^(castle|monument|memorial|ruins|fort)$"]["name"](around:${r},${lat},${lng});
);
out 100;`;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
      signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    const seen = new Set();
    const results = [];
    for (const el of (data.elements || [])) {
      const name = el.tags && el.tags.name;
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      const cat = osmTagsToCategory(el.tags);
      if (!cat) continue;
      const coords = [el.lat, el.lon];
      const dist = haversine([lat, lng], coords);
      seen.add(key);
      const region = el.tags['addr:city'] || el.tags['addr:town'] || el.tags['addr:village'] || el.tags['addr:suburb'] || '';
      results.push({
        id: 'osm-' + el.id,
        cat,
        name,
        region: region || `${dist.toFixed(0)} km entfernt`,
        coords,
        duration: estimateDuration(cat),
        price: 0,
        desc: `OSM-Vorschlag · ${dist.toFixed(1)} km vom letzten Stopp`,
        source: 'osm',
        _distanceKm: dist,
      });
    }
    results.sort((a, b) => a._distanceKm - b._distanceKm);
    return results;
  } catch (e) {
    if (e.name !== 'AbortError') console.error('Overpass error:', e);
    return [];
  }
}

async function searchPlacesOnline(query, signal) {
  if (!query || query.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&accept-language=de&countrycodes=de,at,ch,it,fr,li,lu,nl,be,cz`;
  try {
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(d => ({
      name: shortenDisplayName(d.display_name),
      coords: [parseFloat(d.lat), parseFloat(d.lon)],
      fullName: d.display_name,
      source: 'online'
    })).filter(p => !isNaN(p.coords[0]) && !isNaN(p.coords[1]));
  } catch (e) {
    if (e.name !== 'AbortError') console.error('Nominatim error:', e);
    return [];
  }
}

// ============= Map-Komponente =============
function makeNumberIcon(label, color) {
  return L.divIcon({
    html: `<div style="background:${color};color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    className: 'jga-marker'
  });
}

function FitBoundsHelper({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    // Erst auf nächsten Tick warten, damit Container-Größe stimmt
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (points.length === 1) {
        map.setView(points[0], 10);
        return;
      }
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }, 50);
    return () => clearTimeout(timer);
  }, [points, map]);
  return null;
}

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    // Mehrfach nach Mount, weil das Layout sich evtl. noch ändert (Bilder laden, Fonts, etc.)
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 400);
    const t3 = setTimeout(invalidate, 1000);
    // Auch auf Container-Size-Changes reagieren (z.B. wenn Map ein-/ausgeblendet wird)
    const container = map.getContainer();
    let observer;
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(invalidate);
      observer.observe(container);
    }
    window.addEventListener('resize', invalidate);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', invalidate);
      if (observer) observer.disconnect();
    };
  }, [map]);
  return null;
}

function RouteMap({ plan, startLocation }) {
  const items = useMemo(() => {
    const list = [];
    let n = 1;
    plan.sat.forEach(i => { if (i.coords) list.push({ ...i, num: n++, day: 'sat' }); });
    plan.sun.forEach(i => { if (i.coords) list.push({ ...i, num: n++, day: 'sun' }); });
    return list;
  }, [plan]);

  const satRoute = useMemo(() => {
    const pts = [startLocation.coords];
    plan.sat.forEach(i => { if (i.coords) pts.push(i.coords); });
    return pts.length >= 2 ? pts : [];
  }, [plan.sat, startLocation]);

  const sunRoute = useMemo(() => {
    let last = startLocation.coords;
    for (let i = plan.sat.length - 1; i >= 0; i--) {
      if (plan.sat[i].coords) { last = plan.sat[i].coords; break; }
    }
    const pts = [last];
    plan.sun.forEach(i => { if (i.coords) pts.push(i.coords); });
    return pts.length >= 2 ? pts : [];
  }, [plan.sun, plan.sat, startLocation]);

  const allCoords = useMemo(() => {
    const c = [startLocation.coords];
    items.forEach(i => c.push(i.coords));
    return c;
  }, [items, startLocation]);

  const satCount = plan.sat.filter(i => i.coords).length;
  const sunCount = plan.sun.filter(i => i.coords).length;

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Füge Aktivitäten mit Standort hinzu, dann erscheint hier eure Route auf der Karte.
      </div>
    );
  }

  const startIconObj = makeNumberIcon('★', '#6b7280');

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <MapContainer
        center={startLocation.coords}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: 380, width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        {satRoute.length >= 2 && (
          <Polyline positions={satRoute} pathOptions={{ color: '#7c3aed', weight: 3, opacity: 0.75, dashArray: '6,8' }} />
        )}
        {sunRoute.length >= 2 && (
          <Polyline positions={sunRoute} pathOptions={{ color: '#059669', weight: 3, opacity: 0.75, dashArray: '6,8' }} />
        )}
        <Marker position={startLocation.coords} icon={startIconObj}>
          <Popup>Start: <strong>{startLocation.name}</strong></Popup>
        </Marker>
        {items.map(i => (
          <Marker
            key={i.instanceId}
            position={i.coords}
            icon={makeNumberIcon(i.num, i.day === 'sat' ? '#7c3aed' : '#059669')}
          >
            <Popup>
              <strong>{i.name}</strong><br />
              {i.day === 'sat' ? 'Samstag' : 'Sonntag'} · {i.price} €/P
            </Popup>
          </Marker>
        ))}
        <FitBoundsHelper points={allCoords} />
        <MapResizeHandler />
      </MapContainer>
      <div className="bg-zinc-100 dark:bg-zinc-900/50 px-4 py-2 flex items-center gap-4 text-xs flex-wrap text-zinc-600 dark:text-zinc-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-zinc-500"></span>Start</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{background:'#7c3aed'}}></span>Samstag ({satCount})</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{background:'#059669'}}></span>Sonntag ({sunCount})</span>
      </div>
    </div>
  );
}

function getTimeSlot(item) {
  const name = (item.name || '').toLowerCase();
  if (item.cat === 'transport') return 0;
  if (item.cat === 'schlafen') return 9;
  if (item.cat === 'party') return 8;
  if (item.cat === 'essen') {
    if (name.includes('brunch') || name.includes('frühstück') || name.includes('fruehstueck')) return 1;
    if (name.includes('mittag') || name.includes('lunch')) return 4;
    return 6;
  }
  if (item.cat === 'auto') return 2;
  if (item.cat === 'adventure') return 3;
  if (item.cat === 'kultur') return 3;
  if (item.cat === 'chill') return 5;
  if (item.cat === 'braeutigam') {
    if (name.startsWith('spiel')) return 5;
    return 0;
  }
  return 5;
}
function optimizeDay(items, startCoords) {
  if (items.length <= 1) return [...items];
  const slots = {};
  items.forEach(it => {
    const s = getTimeSlot(it);
    if (!slots[s]) slots[s] = [];
    slots[s].push(it);
  });
  const sortedKeys = Object.keys(slots).map(Number).sort((a, b) => a - b);
  const result = [];
  let lastCoords = startCoords;
  for (const k of sortedKeys) {
    const bucket = slots[k];
    const noCoords = bucket.filter(i => !i.coords);
    const withCoords = bucket.filter(i => i.coords);
    while (withCoords.length > 0) {
      let nearest = 0;
      let best = Infinity;
      for (let i = 0; i < withCoords.length; i++) {
        const d = haversine(lastCoords, withCoords[i].coords);
        if (d < best) { best = d; nearest = i; }
      }
      const pick = withCoords.splice(nearest, 1)[0];
      result.push(pick);
      lastCoords = pick.coords;
    }
    result.push(...noCoords);
  }
  return result;
}
function optimizeWholePlan(plan, startCoords) {
  let lastCoords = startCoords;
  const result = {};
  for (const day of DAYS) {
    const ordered = optimizeDay(plan[day], lastCoords);
    result[day] = ordered;
    for (let i = ordered.length - 1; i >= 0; i--) {
      if (ordered[i].coords) { lastCoords = ordered[i].coords; break; }
    }
  }
  return result;
}

// ============= App-Root mit Raum-System =============
export default function App() {
  const [roomCode, setRoomCode] = useState(null);
  const [userName, setUserNameState] = useState('');
  const [checking, setChecking] = useState(true);
  const [pendingHashCode, setPendingHashCode] = useState('');

  const setUserName = (name) => {
    const trimmed = (name || '').trim().slice(0, 24);
    setUserNameState(trimmed);
    if (trimmed) localStorage.setItem('jga-user-name', trimmed);
    else localStorage.removeItem('jga-user-name');
  };

  useEffect(() => {
    const storedName = localStorage.getItem('jga-user-name') || '';
    setUserNameState(storedName.slice(0, 24));

    const hash = window.location.hash.replace('#', '').trim().toUpperCase();
    if (hash && /^[A-Z0-9]{6}$/.test(hash)) {
      setPendingHashCode(hash);
      if (storedName) setRoomCode(hash);
      setChecking(false);
      return;
    }
    const last = localStorage.getItem('jga-last-room');
    if (last && /^[A-Z0-9]{6}$/.test(last)) {
      setPendingHashCode(last);
      if (storedName) {
        setRoomCode(last);
        window.location.hash = last;
      }
    }
    setChecking(false);
  }, []);

  const enterRoom = (code, name) => {
    if (name) setUserName(name);
    setRoomCode(code);
    window.location.hash = code;
    localStorage.setItem('jga-last-room', code);
  };
  const leaveRoom = () => {
    setRoomCode(null);
    window.location.hash = '';
    localStorage.removeItem('jga-last-room');
  };

  if (checking) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-sm text-zinc-500">Lädt…</div>;
  }
  if (!roomCode) return <RoomScreen onEnter={enterRoom} initialName={userName} initialJoinCode={pendingHashCode} />;
  return <JGAPlaner roomCode={roomCode} onLeave={leaveRoom} userName={userName} setUserName={setUserName} />;
}

// ============= Raum-Screen =============
function RoomScreen({ onEnter, initialName = '', initialJoinCode = '' }) {
  const [name, setName] = useState(initialName);
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [error, setError] = useState('');

  const cleanName = name.trim().slice(0, 24);
  const canAct = cleanName.length >= 2;

  const createRoom = async () => {
    if (!canAct) { setError('Bitte gib zuerst deinen Namen ein.'); return; }
    const code = generateRoomCode();
    setError('');
    try {
      const { error: insertError } = await supabase
        .from('jga_plans')
        .insert({ room_code: code, data: { budget: 400, groupSize: 8, startLocation: { name: 'Stuttgart', coords: STUTTGART }, plan: { sat: [], sun: [] }, hiddenIds: [], customActivities: [], votes: {} } });
      if (insertError && insertError.code !== '23505') throw insertError;
      onEnter(code, cleanName);
    } catch (e) {
      setError('Raum konnte nicht erstellt werden: ' + (e.message || e));
    }
  };
  const joinRoom = async () => {
    if (!canAct) { setError('Bitte gib zuerst deinen Namen ein.'); return; }
    const code = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError('Code muss 6 Buchstaben/Zahlen sein');
      return;
    }
    setError('');
    try {
      const { data, error: selectError } = await supabase
        .from('jga_plans')
        .select('room_code')
        .eq('room_code', code)
        .maybeSingle();
      if (selectError) throw selectError;
      if (!data) {
        setError('Raum nicht gefunden. Frag deine Freunde nach dem Code.');
        return;
      }
      onEnter(code, cleanName);
    } catch (e) {
      setError('Fehler: ' + (e.message || e));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-5">
        <div className="text-center">
          <h1 className="text-3xl font-medium">JGA-Planer</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">22.–23. August 2026</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-2">
          <label className="text-xs text-zinc-500 dark:text-zinc-400 block">Dein Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="z. B. Max"
            maxLength="24"
            autoFocus={!initialName}
            className="w-full px-3 py-2.5 text-base bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-zinc-400"
          />
          <p className="text-[11px] text-zinc-400">So sehen deine Freunde, wer für welche Aktivität abgestimmt hat.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
          <h2 className="font-medium">Neuen Raum erstellen</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Erzeugt einen 6-stelligen Code. Teil den per WhatsApp mit deinen Freunden.</p>
          <button onClick={createRoom} disabled={!canAct} className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed">
            Raum erstellen
          </button>
        </div>

        <div className="text-center text-xs text-zinc-400">ODER</div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
          <h2 className="font-medium">Bestehendem Raum beitreten</h2>
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            placeholder="z. B. AB12CD"
            maxLength="6"
            className="w-full px-3 py-2.5 text-center text-lg font-mono tracking-widest bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-zinc-400"
          />
          <button onClick={joinRoom} disabled={joinCode.length !== 6 || !canAct} className="w-full py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed">
            Beitreten
          </button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
      </div>
    </div>
  );
}

// ============= Haupt-Planer =============
function JGAPlaner({ roomCode, onLeave, userName, setUserName }) {
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState('connecting');
  const [budget, setBudget] = useState(400);
  const [groupSize, setGroupSize] = useState(8);
  const [startLocation, setStartLocation] = useState({ name: 'Stuttgart', coords: STUTTGART });
  const [plan, setPlan] = useState({ sat: [], sun: [] });
  const [activeDay, setActiveDay] = useState('sat');
  const [filterCat, setFilterCat] = useState('all');
  const [search, setSearch] = useState('');
  const [dragInfo, setDragInfo] = useState(null);
  const [dragOverTab, setDragOverTab] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [hiddenIds, setHiddenIds] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [previousPlan, setPreviousPlan] = useState(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [customActivities, setCustomActivities] = useState([]);
  const [votes, setVotes] = useState({});
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName || '');
  const [nearbySuggestions, setNearbySuggestions] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState(false);
  const [showNearby, setShowNearby] = useState(true);

  const isApplyingRemoteUpdate = useRef(false);
  const lastSavedJson = useRef('');

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('jga_plans')
          .select('data')
          .eq('room_code', roomCode)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (data && data.data) {
          const d = data.data;
          if (typeof d.budget === 'number') setBudget(d.budget);
          if (typeof d.groupSize === 'number') setGroupSize(d.groupSize);
          if (d.startLocation && d.startLocation.coords) setStartLocation(d.startLocation);
          if (d.plan && d.plan.sat && d.plan.sun) setPlan(d.plan);
          if (Array.isArray(d.hiddenIds)) setHiddenIds(d.hiddenIds);
          if (Array.isArray(d.customActivities)) setCustomActivities(d.customActivities);
          if (d.votes && typeof d.votes === 'object' && !Array.isArray(d.votes)) setVotes(d.votes);
          lastSavedJson.current = JSON.stringify(d);
        }
        setSyncStatus('connected');
        setLoaded(true);
      } catch (e) {
        console.error(e);
        setSyncStatus('error');
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [roomCode]);

  // Realtime-Subscription für Live-Updates der anderen
  useEffect(() => {
    if (!loaded) return;
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jga_plans', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          const d = payload.new && payload.new.data;
          if (!d) return;
          const remoteJson = JSON.stringify(d);
          if (remoteJson === lastSavedJson.current) return; // eigener Save
          isApplyingRemoteUpdate.current = true;
          if (typeof d.budget === 'number') setBudget(d.budget);
          if (typeof d.groupSize === 'number') setGroupSize(d.groupSize);
          if (d.startLocation && d.startLocation.coords) setStartLocation(d.startLocation);
          if (d.plan && d.plan.sat && d.plan.sun) setPlan(d.plan);
          if (Array.isArray(d.hiddenIds)) setHiddenIds(d.hiddenIds);
          if (Array.isArray(d.customActivities)) setCustomActivities(d.customActivities);
          if (d.votes && typeof d.votes === 'object' && !Array.isArray(d.votes)) setVotes(d.votes);
          lastSavedJson.current = remoteJson;
          setTimeout(() => { isApplyingRemoteUpdate.current = false; }, 100);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setSyncStatus('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setSyncStatus('error');
      });
    return () => { supabase.removeChannel(channel); };
  }, [loaded, roomCode]);

  // Auto-Save mit Debounce
  useEffect(() => {
    if (!loaded || isApplyingRemoteUpdate.current) return;
    const payload = { budget, groupSize, startLocation, plan, hiddenIds, customActivities, votes };
    const json = JSON.stringify(payload);
    if (json === lastSavedJson.current) return;
    const timer = setTimeout(async () => {
      try {
        setSyncStatus('saving');
        const { error } = await supabase
          .from('jga_plans')
          .upsert({ room_code: roomCode, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'room_code' });
        if (error) throw error;
        lastSavedJson.current = json;
        setSyncStatus('connected');
      } catch (e) {
        console.error(e);
        setSyncStatus('error');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [budget, groupSize, startLocation, plan, hiddenIds, customActivities, votes, loaded, roomCode]);

  const enriched = useMemo(() => {
    const result = { sat: [], sun: [] };
    let lastCoords = startLocation.coords;
    DAYS.forEach(day => {
      let cur = DAY_START_TIME[day];
      plan[day].forEach(item => {
        const hasLoc = item.coords && item.coords.length === 2;
        const km = hasLoc ? haversine(lastCoords, item.coords) : 0;
        const tm = hasLoc ? travelMin(km) : 0;
        const start = cur + tm;
        const isTrans = item.cat === 'transport';
        const end = start + (isTrans ? 0 : item.duration);
        result[day].push({ ...item, travelKm: Math.round(km), travelMin: tm, startMin: start, endMin: end, hasLoc });
        cur = end;
        if (hasLoc) lastCoords = item.coords;
      });
    });
    return result;
  }, [plan, startLocation]);

  const totalSpent = useMemo(() => {
    let t = 0;
    DAYS.forEach(d => plan[d].forEach(i => { if (!(i.cat === 'braeutigam' && i.done)) t += i.price; }));
    return t;
  }, [plan]);

  const remaining = budget - totalSpent;
  const pct = Math.min(100, Math.max(0, (totalSpent / Math.max(budget, 1)) * 100));

  const allLibraryActivities = useMemo(
    () => [...ACTIVITIES, ...customActivities.map(a => ({ ...a, isCustom: true }))],
    [customActivities]
  );

  const filteredActivities = useMemo(() => {
    const filtered = allLibraryActivities.filter(a => {
      const isHidden = hiddenIds.includes(a.id);
      if (isHidden && !showHidden) return false;
      if (filterCat !== 'all' && a.cat !== filterCat) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!a.name.toLowerCase().includes(s) &&
            !(a.region || '').toLowerCase().includes(s) &&
            !(a.desc || '').toLowerCase().includes(s)) return false;
      }
      return true;
    });
    // Stabil nach Stimmen sortieren (absteigend) – Index als Tiebreaker für deterministische Reihenfolge
    return filtered
      .map((a, idx) => ({ a, idx, voteCount: (Array.isArray(votes[a.id]) ? votes[a.id].length : 0) }))
      .sort((x, y) => (y.voteCount - x.voteCount) || (x.idx - y.idx))
      .map(({ a }) => a);
  }, [allLibraryActivities, filterCat, search, hiddenIds, showHidden, votes]);

  const lastPlannedItem = useMemo(() => {
    for (let i = plan.sun.length - 1; i >= 0; i--) {
      if (plan.sun[i].coords) return plan.sun[i];
    }
    for (let i = plan.sat.length - 1; i >= 0; i--) {
      if (plan.sat[i].coords) return plan.sat[i];
    }
    return null;
  }, [plan]);

  const nearbyOrigin = lastPlannedItem || startLocation;
  const nearbyKey = nearbyOrigin && nearbyOrigin.coords
    ? `${nearbyOrigin.coords[0].toFixed(3)},${nearbyOrigin.coords[1].toFixed(3)}`
    : null;

  useEffect(() => {
    if (!nearbyKey) {
      setNearbySuggestions([]);
      setLoadingNearby(false);
      setNearbyError(false);
      return;
    }
    setLoadingNearby(true);
    setNearbyError(false);
    const controller = new AbortController();
    const [latStr, lngStr] = nearbyKey.split(',');
    const timer = setTimeout(async () => {
      try {
        const results = await fetchNearbyPOIs(parseFloat(latStr), parseFloat(lngStr), 30, controller.signal);
        if (!controller.signal.aborted) {
          setNearbySuggestions(results);
          setLoadingNearby(false);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setNearbyError(true);
          setLoadingNearby(false);
        }
      }
    }, 800);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [nearbyKey]);

  const plannedIds = useMemo(() => {
    const s = new Set();
    DAYS.forEach(d => plan[d].forEach(i => s.add(i.id)));
    return s;
  }, [plan]);

  const filteredNearby = useMemo(() => {
    const customIds = new Set(customActivities.map(c => c.id));
    return nearbySuggestions
      .filter(s => !hiddenIds.includes(s.id) && !plannedIds.has(s.id) && !customIds.has(s.id))
      .slice(0, 8);
  }, [nearbySuggestions, hiddenIds, plannedIds, customActivities]);

  const addActivity = (act) => {
    setPlan(prev => ({ ...prev, [activeDay]: [...prev[activeDay], { ...act, instanceId: uid(), status: 'offen', done: false }] }));
  };
  const addCustomToLibrary = (act) => {
    setCustomActivities(prev => prev.some(p => p.id === act.id) ? prev : [...prev, act]);
  };
  const removeCustomFromLibrary = (id) => {
    setCustomActivities(prev => prev.filter(a => a.id !== id));
  };
  const handleCustomSave = (act, alsoAddToPlan) => {
    addCustomToLibrary(act);
    if (alsoAddToPlan) addActivity(act);
  };
  const addSuggestionToLibraryAndPlan = (suggestion) => {
    const { _distanceKm, source, isCustom, ...rest } = suggestion;
    addCustomToLibrary(rest);
    addActivity(rest);
  };

  const toggleVote = (activityId) => {
    if (!userName) return;
    setVotes(prev => {
      const current = Array.isArray(prev[activityId]) ? prev[activityId] : [];
      const already = current.includes(userName);
      const next = already ? current.filter(n => n !== userName) : [...current, userName];
      const out = { ...prev };
      if (next.length === 0) delete out[activityId];
      else out[activityId] = next;
      return out;
    });
  };

  const saveName = () => {
    const cleaned = (nameDraft || '').trim().slice(0, 24);
    if (cleaned.length >= 2) {
      setUserName(cleaned);
      setEditingName(false);
    }
  };
  const removeItem = (day, instanceId) => setPlan(prev => ({ ...prev, [day]: prev[day].filter(i => i.instanceId !== instanceId) }));
  const moveItem = (day, instanceId, dir) => {
    setPlan(prev => {
      const arr = [...prev[day]];
      const idx = arr.findIndex(i => i.instanceId === instanceId);
      const ni = idx + dir;
      if (ni < 0 || ni >= arr.length) return prev;
      [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
      return { ...prev, [day]: arr };
    });
  };
  const moveToDay = (fromDay, toDay, instanceId) => {
    if (fromDay === toDay) return;
    setPlan(prev => {
      const item = prev[fromDay].find(i => i.instanceId === instanceId);
      if (!item) return prev;
      return { ...prev, [fromDay]: prev[fromDay].filter(i => i.instanceId !== instanceId), [toDay]: [...prev[toDay], item] };
    });
    setActiveDay(toDay);
  };
  const cycleStatus = (day, instanceId) => setPlan(prev => ({
    ...prev,
    [day]: prev[day].map(i => {
      if (i.instanceId !== instanceId) return i;
      const cur = i.status || 'offen';
      return { ...i, status: STATUS_LIST[(STATUS_LIST.indexOf(cur) + 1) % STATUS_LIST.length] };
    })
  }));
  const toggleDone = (day, instanceId) => setPlan(prev => ({
    ...prev,
    [day]: prev[day].map(i => i.instanceId === instanceId ? { ...i, done: !i.done } : i)
  }));
  const resetPlan = () => { if (confirm('Wirklich kompletten Plan löschen? Auch für deine Freunde!')) setPlan({ sat: [], sun: [] }); };

  const optimizePlan = () => {
    const hasItems = plan.sat.length + plan.sun.length > 0;
    if (!hasItems) return;
    setPreviousPlan(plan);
    setPlan(optimizeWholePlan(plan, startLocation.coords));
  };
  const undoOptimize = () => { if (previousPlan) { setPlan(previousPlan); setPreviousPlan(null); } };

  const hideActivity = (id) => { setHiddenIds(prev => prev.includes(id) ? prev : [...prev, id]); };
  const unhideActivity = (id) => { setHiddenIds(prev => prev.filter(x => x !== id)); };
  const unhideAll = () => { setHiddenIds([]); setShowHidden(false); };

  const onDragEnd = () => { setDragInfo(null); setDragOverTab(null); setDragOverIdx(null); };
  const dropOnItem = (targetIdx) => {
    if (!dragInfo || dragInfo.day !== activeDay) { onDragEnd(); return; }
    setPlan(prev => {
      const arr = [...prev[activeDay]];
      const fromIdx = arr.findIndex(i => i.instanceId === dragInfo.instanceId);
      if (fromIdx < 0 || fromIdx === targetIdx) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(targetIdx > fromIdx ? targetIdx - 1 : targetIdx, 0, moved);
      return { ...prev, [activeDay]: arr };
    });
    onDragEnd();
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    } catch {
      prompt('Link kopieren:', url);
    }
  };

  const dayItems = enriched[activeDay];
  const dayCost = plan[activeDay].reduce((s, i) => s + (i.cat === 'braeutigam' && i.done ? 0 : i.price), 0);
  const dayEnd = dayItems.length > 0 ? dayItems[dayItems.length - 1].endMin : null;
  const dayKm = dayItems.reduce((s, i) => s + i.travelKm, 0);

  const remColor = remaining < 0 ? 'text-red-600 dark:text-red-400' : (remaining < budget * 0.2 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400');
  const barColor = pct > 100 ? 'bg-red-500' : (pct > 80 ? 'bg-amber-500' : 'bg-emerald-500');

  if (!loaded) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-500 flex items-center justify-center text-sm">Plan wird geladen…</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-3xl mx-auto p-4 space-y-5">

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-medium">JGA-Planer</h1>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">22.–23. August 2026</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
              <button onClick={copyShareLink} className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700">
                <Users size={12} />
                <span className="font-mono font-medium">{roomCode}</span>
                <Copy size={11} className="text-zinc-400" />
              </button>
              {editingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={e => setNameDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameDraft(userName || ''); } }}
                    maxLength="24"
                    autoFocus
                    placeholder="Dein Name"
                    className="px-2 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-zinc-400 w-28"
                  />
                  <button onClick={saveName} className="px-2 py-1 text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md">OK</button>
                </div>
              ) : (
                <button onClick={() => { setNameDraft(userName || ''); setEditingName(true); }} className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700" title="Name ändern">
                  <UserIcon size={12} />
                  <span className="font-medium">{userName || 'Anonym'}</span>
                  <Pencil size={10} className="text-zinc-400" />
                </button>
              )}
              <span className={`flex items-center gap-1 ${
                syncStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-400' :
                syncStatus === 'saving' ? 'text-zinc-500' :
                syncStatus === 'error' ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'
              }`}>
                {syncStatus === 'connected' && <><Wifi size={11} /> Live</>}
                {syncStatus === 'saving' && <>… speichert</>}
                {syncStatus === 'error' && <><WifiOff size={11} /> offline</>}
                {syncStatus === 'connecting' && <>… verbindet</>}
              </span>
            </div>
          </div>
          <button onClick={onLeave} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1">
            <LogOut size={12} /> Raum verlassen
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Budget / Person</p>
              <div className="flex items-baseline gap-1">
                <input type="number" value={budget} onChange={e => setBudget(Math.max(0, parseInt(e.target.value) || 0))} className="w-full text-xl font-medium bg-transparent border-0 p-0 focus:outline-none text-zinc-900 dark:text-zinc-100" min="0" step="50" />
                <span className="text-sm text-zinc-400">€</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Gruppe</p>
              <div className="flex items-baseline gap-1">
                <input type="number" value={groupSize} onChange={e => setGroupSize(Math.max(1, parseInt(e.target.value) || 1))} className="w-full text-xl font-medium bg-transparent border-0 p-0 focus:outline-none text-zinc-900 dark:text-zinc-100" min="1" />
                <span className="text-sm text-zinc-400">Pers.</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Ausgegeben</p>
              <p className="text-xl font-medium">{Math.round(totalSpent)} €</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Verbleibend</p>
              <p className={`text-xl font-medium ${remColor}`}>{Math.round(remaining)} €</p>
            </div>
          </div>
          <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full ${barColor} transition-all`} style={{ width: pct + '%' }} />
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <button onClick={() => setShowStartPicker(true)} className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100">
              <MapPin size={12} />
              Start am Samstag: {startLocation.name}
            </button>
            <span>Gruppen-Total: {Math.round(totalSpent * groupSize)} €</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <MapIcon size={14} /> Routen-Überblick
            </h2>
            <button onClick={() => setShowMap(s => !s)} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1">
              {showMap ? <><EyeOff size={11} /> Ausblenden</> : <><Eye size={11} /> Anzeigen</>}
            </button>
          </div>
          {showMap && <RouteMap plan={plan} startLocation={startLocation} />}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DAYS.map(day => {
            const cost = plan[day].reduce((s, i) => s + (i.cat === 'braeutigam' && i.done ? 0 : i.price), 0);
            const isOver = dragOverTab === day && dragInfo && dragInfo.day !== day;
            return (
              <button key={day} onClick={() => setActiveDay(day)}
                onDragOver={(e) => { if (dragInfo && dragInfo.day !== day) { e.preventDefault(); setDragOverTab(day); } }}
                onDragLeave={() => setDragOverTab(null)}
                onDrop={() => { if (dragInfo) moveToDay(dragInfo.day, day, dragInfo.instanceId); onDragEnd(); }}
                className={`text-left p-3 rounded-lg border transition-all ${activeDay === day ? 'bg-white dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100' : 'bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'} ${isOver ? 'ring-2 ring-amber-500 border-amber-500' : ''}`}>
                <div className="text-sm font-medium">{DAY_SHORT[day]}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{plan[day].length} {plan[day].length === 1 ? 'Aktivität' : 'Aktivitäten'} · {cost} €</div>
              </button>
            );
          })}
        </div>

        <div>
          {dayItems.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center">
              <ArrowDown className="mx-auto mb-2 text-zinc-400" size={24} />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Noch leer für {DAY_LABEL[activeDay]}. Unten Aktivitäten auswählen.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {dayItems.map((item, idx) => {
                const Cat = CATS[item.cat];
                const showTravel = item.hasLoc && item.travelKm > 0;
                const travelWarn = item.travelMin > 120;
                const fromLabel = idx === 0 ? startLocation.name : 'letzte Station';
                return (
                  <React.Fragment key={item.instanceId}>
                    {showTravel && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 ml-12 text-xs ${travelWarn ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        <ArrowDown size={12} /><Car size={12} />
                        <span>{idx === 0 && <span>von {fromLabel}: </span>}{item.travelKm} km · {fmtDur(item.travelMin)}</span>
                        {travelWarn && <AlertTriangle size={12} />}
                      </div>
                    )}
                    {dragInfo && dragInfo.day === activeDay && dragOverIdx === idx && dragInfo.instanceId !== item.instanceId && (
                      <div className="h-0.5 bg-amber-500 my-1 rounded-full" />
                    )}
                    <div draggable
                      onDragStart={() => setDragInfo({ day: activeDay, instanceId: item.instanceId })}
                      onDragEnd={onDragEnd}
                      onDragOver={(e) => { if (dragInfo) { e.preventDefault(); setDragOverIdx(idx); } }}
                      onDrop={() => dropOnItem(idx)}
                      className={`bg-white dark:bg-zinc-900 border rounded-lg p-3 flex gap-3 cursor-grab active:cursor-grabbing ${dragInfo && dragInfo.instanceId === item.instanceId ? 'opacity-40 border-zinc-300 dark:border-zinc-700' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'} ${item.cat === 'braeutigam' && item.done ? 'opacity-60' : ''}`}>
                      <div className="flex-shrink-0 w-12 text-center">
                        {item.hasLoc ? (
                          <>
                            <div className="text-sm font-medium leading-tight">{fmtTime(item.startMin)}</div>
                            {item.duration > 0 && <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{fmtTime(item.endMin)}</div>}
                          </>
                        ) : (
                          <Clock size={14} className="text-zinc-400 mx-auto mt-1" />
                        )}
                      </div>
                      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${Cat.badge}`}>
                        <Cat.Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-snug mb-1 ${item.cat === 'braeutigam' && item.done ? 'line-through' : ''}`}>{item.name}</p>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-500 dark:text-zinc-400">
                          {item.duration > 0 && <span>{fmtDur(item.duration)}</span>}
                          {item.duration > 0 && <span>·</span>}
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.price} €/P</span>
                          {groupSize > 1 && <span>· {item.price * groupSize} € ges.</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {item.cat === 'braeutigam' ? (
                            <button onClick={() => toggleDone(activeDay, item.instanceId)}
                              className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${item.done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                              {item.done ? <><Check size={10} /> Erledigt</> : 'Offen'}
                            </button>
                          ) : (
                            <button onClick={() => cycleStatus(activeDay, item.instanceId)}
                              className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_CLASS[item.status || 'offen']}`}
                              title="Klick zum Wechseln">
                              {item.status || 'offen'}
                            </button>
                          )}
                          {(() => {
                            const voters = Array.isArray(votes[item.id]) ? votes[item.id] : [];
                            const iVoted = userName && voters.includes(userName);
                            return (
                              <button
                                onClick={() => toggleVote(item.id)}
                                disabled={!userName}
                                title={voters.length > 0 ? `Dabei: ${voters.join(', ')}` : 'Noch keine Stimmen'}
                                className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${iVoted ? 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-700' : 'bg-zinc-100 text-zinc-600 border-transparent dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'} disabled:opacity-30 disabled:cursor-not-allowed`}>
                                <ThumbsUp size={10} className={iVoted ? 'fill-current' : ''} />
                                <span className="font-medium">{voters.length}{groupSize > 1 ? `/${groupSize}` : ''}</span>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col gap-1">
                        <button onClick={() => moveItem(activeDay, item.instanceId, -1)} disabled={idx === 0} className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"><ChevronUp size={14} /></button>
                        <button onClick={() => moveItem(activeDay, item.instanceId, 1)} disabled={idx === dayItems.length - 1} className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"><ChevronDown size={14} /></button>
                        <button onClick={() => removeItem(activeDay, item.instanceId)} className="w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"><X size={14} /></button>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-lg px-4 py-2.5 mt-3 flex justify-between items-center flex-wrap gap-2 text-xs">
                <div><span className="text-zinc-500 dark:text-zinc-400">Ende: </span><span className="font-medium">{dayEnd !== null ? fmtTime(dayEnd) : '—'}</span></div>
                <div><span className="text-zinc-500 dark:text-zinc-400">Kosten: </span><span className="font-medium">{dayCost} €/P</span></div>
                <div><span className="text-zinc-500 dark:text-zinc-400">Fahrt: </span><span className="font-medium">{dayKm} km</span></div>
              </div>
              <div className="flex justify-between items-center mt-2 gap-2 flex-wrap">
                <div className="flex gap-2">
                  <button onClick={optimizePlan} className="text-xs px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:bg-zinc-700 dark:hover:bg-zinc-300 flex items-center gap-1.5 font-medium">
                    <Sparkles size={12} /> Plan optimieren
                  </button>
                  {previousPlan && (
                    <button onClick={undoOptimize} className="text-xs px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-white dark:hover:bg-zinc-800 flex items-center gap-1.5">
                      <Undo2 size={12} /> Rückgängig
                    </button>
                  )}
                </div>
                <button onClick={resetPlan} className="text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1">
                  <RotateCcw size={12} /> Plan zurücksetzen
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-lg font-medium">Bibliothek</h2>
            <button onClick={() => setShowCustomModal(true)} className="text-sm px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-white dark:hover:bg-zinc-800 inline-flex items-center gap-1.5">
              <Plus size={14} /> Eigene Aktivität
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen (Ring, Cochem, Steak…)"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-zinc-400" />
          </div>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            <button onClick={() => setFilterCat('all')} className={`text-xs px-3 py-1 rounded-full border ${filterCat === 'all' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>Alle</button>
            {Object.entries(CATS).map(([key, c]) => {
              const Ic = c.Icon;
              return (
                <button key={key} onClick={() => setFilterCat(key)} className={`text-xs px-3 py-1 rounded-full border inline-flex items-center gap-1 ${filterCat === key ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                  <Ic size={12} />{c.label}
                </button>
              );
            })}
          </div>
          <div className="mb-3 rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20 p-3">
            <div className="flex items-center justify-between mb-2 gap-2">
              <h3 className="text-sm font-medium flex items-center gap-1.5 min-w-0">
                <Sparkles size={14} className="text-violet-500 flex-shrink-0" />
                <span className="truncate">
                  In der Nähe von <span className="text-violet-700 dark:text-violet-300">{nearbyOrigin ? nearbyOrigin.name : 'Start'}</span>
                </span>
              </h3>
              <button onClick={() => setShowNearby(s => !s)} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 flex-shrink-0">
                {showNearby ? <><EyeOff size={11} /> Aus</> : <><Eye size={11} /> Ein</>}
              </button>
            </div>
            {showNearby && (
              <>
                {loadingNearby && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 py-2">
                    <Loader2 size={12} className="animate-spin" /> Suche Vorschläge bei OpenStreetMap…
                  </div>
                )}
                {!loadingNearby && nearbyError && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 py-1">Overpass-API antwortet gerade nicht – später nochmal versuchen.</div>
                )}
                {!loadingNearby && !nearbyError && !nearbyKey && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 py-1">Plane eine Aktivität mit Standort – dann schlagen wir hier Spots in 30 km Umkreis vor.</div>
                )}
                {!loadingNearby && !nearbyError && nearbyKey && filteredNearby.length === 0 && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 py-1">Keine weiteren Vorschläge im 30-km-Radius.</div>
                )}
                {!loadingNearby && filteredNearby.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredNearby.map(s => {
                      const Cat = CATS[s.cat];
                      return (
                        <div key={s.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 flex gap-2 items-center">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${Cat.badge}`}><Cat.Icon size={14} /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug truncate">{s.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{Cat.label} · {s._distanceKm.toFixed(1)} km</p>
                          </div>
                          <button onClick={() => addSuggestionToLibraryAndPlan(s)} className="flex-shrink-0 text-xs px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 inline-flex items-center gap-1" title="In Bibliothek + Tag übernehmen">
                            <Plus size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
          {hiddenIds.length > 0 && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs">
              <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <EyeOff size={12} />{hiddenIds.length} {hiddenIds.length === 1 ? 'Aktivität' : 'Aktivitäten'} ausgeblendet
              </span>
              <div className="flex gap-3">
                <button onClick={() => setShowHidden(s => !s)} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline flex items-center gap-1">
                  {showHidden ? <><EyeOff size={11} /> Verstecken</> : <><Eye size={11} /> Anzeigen</>}
                </button>
                <button onClick={unhideAll} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline">Alle wiederherstellen</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredActivities.map(a => {
              const Cat = CATS[a.cat];
              const isHidden = hiddenIds.includes(a.id);
              const isCustom = !!a.isCustom;
              return (
                <div key={a.id} className={`relative bg-white dark:bg-zinc-900 border ${isCustom ? 'border-violet-300 dark:border-violet-800' : 'border-zinc-200 dark:border-zinc-800'} rounded-lg p-3 flex flex-col gap-2 ${isHidden ? 'opacity-50' : ''}`}>
                  {isCustom ? (
                    <button onClick={() => { if (confirm('Eigene Aktivität endgültig aus der Bibliothek löschen?')) removeCustomFromLibrary(a.id); }} className="absolute top-2 right-2 w-6 h-6 rounded-md text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center" title="Eigene Aktivität löschen">
                      <X size={12} />
                    </button>
                  ) : (
                    <button onClick={() => isHidden ? unhideActivity(a.id) : hideActivity(a.id)} className="absolute top-2 right-2 w-6 h-6 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center" title={isHidden ? 'Wieder einblenden' : 'Aus Bibliothek ausblenden'}>
                      {isHidden ? <Undo2 size={12} /> : <X size={12} />}
                    </button>
                  )}
                  <div className="flex gap-2 items-start pr-6">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${Cat.badge}`}><Cat.Icon size={16} /></div>
                    <p className="text-sm font-medium leading-snug flex-1">{a.name}</p>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 flex gap-1.5 flex-wrap items-center">
                    {isCustom && <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-medium">Eigene</span>}
                    <span>{Cat.label}</span><span>·</span><span>{a.region}</span>
                    {a.duration > 0 && <><span>·</span><span>{fmtDur(a.duration)}</span></>}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{a.desc}</p>
                  {(() => {
                    const voters = Array.isArray(votes[a.id]) ? votes[a.id] : [];
                    const iVoted = userName && voters.includes(userName);
                    return (
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-sm font-medium">
                          {a.price > 0 ? <>{a.price} €<span className="text-xs text-zinc-400 font-normal">/P</span></> : <span className="text-zinc-400 font-normal text-xs">gratis</span>}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleVote(a.id)}
                            disabled={!userName}
                            title={voters.length > 0 ? `Stimmen: ${voters.join(', ')}` : 'Noch keine Stimmen'}
                            className={`text-xs px-2 py-1 rounded-md inline-flex items-center gap-1 border ${iVoted ? 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-700' : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'} disabled:opacity-30 disabled:cursor-not-allowed`}>
                            <ThumbsUp size={11} className={iVoted ? 'fill-current' : ''} />
                            <span className="font-medium">{voters.length}</span>
                          </button>
                          <button onClick={() => addActivity(a)} disabled={isHidden} className="text-xs px-2.5 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 inline-flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed">
                            <Plus size={12} /> Zu {DAY_SHORT[activeDay].split(' ')[0]}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
          {filteredActivities.length === 0 && (
            <div className="text-center py-8 text-sm text-zinc-500 dark:text-zinc-400">
              Nichts gefunden. <button onClick={() => setShowCustomModal(true)} className="underline">Eigene anlegen?</button>
            </div>
          )}
        </div>
      </div>

      {showCustomModal && <CustomActivityModal onClose={() => setShowCustomModal(false)} onSave={handleCustomSave} activeDay={activeDay} />}
      {showStartPicker && <PlaceModal title="Start am Samstag" subtitle="Wo seid ihr Samstag früh?" initial={startLocation.name} onClose={() => setShowStartPicker(false)} onSelect={(p) => { setStartLocation(p); setShowStartPicker(false); }} />}

      {showShareToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Check size={14} /> Link kopiert
        </div>
      )}
    </div>
  );
}

function CustomActivityModal({ onClose, onSave, activeDay }) {
  const [name, setName] = useState('');
  const [cat, setCat] = useState('adventure');
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(20);
  const [desc, setDesc] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [onlineMatches, setOnlineMatches] = useState([]);
  const [searching, setSearching] = useState(false);

  const localMatches = useMemo(() => {
    if (!placeQuery) return [];
    const q = placeQuery.toLowerCase();
    return PLACES.filter(p => p.name.toLowerCase().includes(q)).slice(0, 4).map(p => ({ ...p, source: 'local' }));
  }, [placeQuery]);

  useEffect(() => {
    if (selectedPlace || !placeQuery || placeQuery.length < 3) {
      setOnlineMatches([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const results = await searchPlacesOnline(placeQuery, controller.signal);
      if (!controller.signal.aborted) {
        setOnlineMatches(results);
        setSearching(false);
      }
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [placeQuery, selectedPlace]);

  const allMatches = useMemo(() => {
    if (selectedPlace) return [];
    const localNames = new Set(localMatches.map(m => m.name.toLowerCase()));
    const online = onlineMatches.filter(m => !localNames.has(m.name.toLowerCase()));
    return [...localMatches, ...online];
  }, [localMatches, onlineMatches, selectedPlace]);

  const canSave = name.trim().length > 0;
  const buildActivity = () => ({
    id: 'custom-' + uid(),
    cat,
    name: name.trim(),
    region: selectedPlace ? selectedPlace.name : (placeQuery.trim() || 'Eigene'),
    coords: selectedPlace ? selectedPlace.coords : null,
    duration: Math.max(0, duration),
    price: Math.max(0, price),
    desc: desc.trim() || 'Eigene Aktivität'
  });
  const submitLibraryOnly = () => {
    if (!canSave) return;
    onSave(buildActivity(), false);
    onClose();
  };
  const submitAndAdd = () => {
    if (!canSave) return;
    onSave(buildActivity(), true);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-medium">Eigene Aktivität</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="z. B. Heißluftballon Mosel"
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-zinc-400" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Standort (für Fahrzeitberechnung)</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" value={placeQuery} onChange={e => { setPlaceQuery(e.target.value); setSelectedPlace(null); }} placeholder="Ort suchen (weltweit)…"
                className="w-full pl-9 pr-9 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-zinc-400" />
              {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />}
            </div>
            {selectedPlace && (
              <div className="mt-2 text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-md flex items-center gap-2">
                <Check size={12} /> {selectedPlace.name} – Fahrzeit wird berechnet
              </div>
            )}
            {!selectedPlace && allMatches.length > 0 && (
              <div className="mt-2 border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
                {allMatches.map((p, i) => (
                  <button key={`${p.source}-${p.name}-${i}`} onClick={() => { setSelectedPlace(p); setPlaceQuery(p.name); }} className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 border-b last:border-0 border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    {p.source === 'online' ? <Globe size={12} className="text-zinc-400 flex-shrink-0" /> : <MapPin size={12} className="text-zinc-400 flex-shrink-0" />}
                    <span className="flex-1 truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
            {!selectedPlace && placeQuery.length >= 3 && !searching && allMatches.length === 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Kein Ort gefunden – Aktivität wird ohne Fahrzeitberechnung gespeichert.</p>
            )}
            {!selectedPlace && placeQuery.length > 0 && placeQuery.length < 3 && (
              <p className="mt-2 text-xs text-zinc-400">Mindestens 3 Zeichen für Online-Suche…</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Dauer (Min)</label>
              <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} min="0" step="15"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-zinc-400" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Preis €/P</label>
              <input type="number" value={price} onChange={e => setPrice(parseInt(e.target.value) || 0)} min="0" step="5"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-zinc-400" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Kategorie</label>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(CATS).map(([key, c]) => {
                const Ic = c.Icon;
                return (
                  <button key={key} onClick={() => setCat(key)} className={`text-xs px-2 py-1.5 rounded-md border inline-flex items-center justify-center gap-1 ${cat === key ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                    <Ic size={12} />{c.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Notiz</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows="2" placeholder="Kontakt, Link, Hinweis…"
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-zinc-400 resize-none" />
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900">
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">Abbrechen</button>
            <button onClick={submitLibraryOnly} disabled={!canSave} className="flex-1 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed">
              Nur in Bibliothek
            </button>
          </div>
          <button onClick={submitAndAdd} disabled={!canSave} className="w-full py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed">
            In Bibliothek + zu {DAY_SHORT[activeDay].split(' ')[0]} hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceModal({ title, subtitle, initial, onClose, onSelect }) {
  const [q, setQ] = useState(initial || '');
  const [onlineMatches, setOnlineMatches] = useState([]);
  const [searching, setSearching] = useState(false);

  const localMatches = useMemo(() => {
    if (!q) return PLACES.slice(0, 8).map(p => ({ ...p, source: 'local' }));
    const s = q.toLowerCase();
    return PLACES.filter(p => p.name.toLowerCase().includes(s)).slice(0, 6).map(p => ({ ...p, source: 'local' }));
  }, [q]);

  useEffect(() => {
    if (!q || q.length < 3 || q === initial) {
      setOnlineMatches([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const results = await searchPlacesOnline(q, controller.signal);
      if (!controller.signal.aborted) {
        setOnlineMatches(results);
        setSearching(false);
      }
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q, initial]);

  const allMatches = useMemo(() => {
    const localNames = new Set(localMatches.map(m => m.name.toLowerCase()));
    const online = onlineMatches.filter(m => !localNames.has(m.name.toLowerCase()));
    return [...localMatches, ...online];
  }, [localMatches, onlineMatches]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-medium">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="text" value={q} onChange={e => setQ(e.target.value)} autoFocus
              className="w-full pl-9 pr-9 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-zinc-400" placeholder="Ort suchen (weltweit)…" />
            {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />}
          </div>
          <div className="space-y-1">
            {allMatches.map((p, i) => (
              <button key={`${p.source}-${p.name}-${i}`} onClick={() => onSelect(p)} className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md flex items-center gap-2">
                {p.source === 'online' ? <Globe size={12} className="text-zinc-400 flex-shrink-0" /> : <MapPin size={12} className="text-zinc-400 flex-shrink-0" />}
                <span className="flex-1 truncate">{p.name}</span>
              </button>
            ))}
            {allMatches.length === 0 && q.length >= 3 && !searching && <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">Nichts gefunden.</p>}
            {allMatches.length === 0 && q.length > 0 && q.length < 3 && <p className="text-xs text-zinc-400 text-center py-4">Mindestens 3 Zeichen…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
