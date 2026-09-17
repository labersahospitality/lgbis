import { BaseParser, ParserConfig, ParserResult } from './base';
import type { ParsedMetric } from '../types';

// ── Metric Schema ───────────────────────────────────────────
interface MetricDef {
  name: string;
  category: string;
  dataType: 'currency' | 'percent' | 'number';
}

const METRIC_SCHEMA: Record<string, MetricDef> = {
  // Core revenue
  room_revenue:          { name: 'room_revenue',          category: 'revenue',   dataType: 'currency' },
  food_revenue:          { name: 'food_revenue',          category: 'revenue',   dataType: 'currency' },
  beverage_revenue:      { name: 'beverage_revenue',      category: 'revenue',   dataType: 'currency' },
  other_fb_revenue:      { name: 'other_fb_revenue',      category: 'revenue',   dataType: 'currency' },
  fb_revenue:            { name: 'fb_revenue',            category: 'revenue',   dataType: 'currency' },
  other_dept_revenue:    { name: 'other_dept_revenue',    category: 'revenue',   dataType: 'currency' },
  total_revenue:         { name: 'total_revenue',         category: 'revenue',   dataType: 'currency' },
  // Room metrics
  occupancy:             { name: 'occupancy',             category: 'room',      dataType: 'percent' },
  room_sold:             { name: 'room_sold',             category: 'room',      dataType: 'number' },
  arr:                   { name: 'arr',                   category: 'room',      dataType: 'currency' },
  // Room inventory
  room_available:        { name: 'room_available',        category: 'room',      dataType: 'number' },
  vacant_room:           { name: 'vacant_room',           category: 'room',      dataType: 'number' },
  room_occupied:         { name: 'room_occupied',         category: 'room',      dataType: 'number' },
  room_saleable:         { name: 'room_saleable',         category: 'room',      dataType: 'number' },
  compliment:            { name: 'compliment',            category: 'room',      dataType: 'number' },
  house_use:             { name: 'house_use',             category: 'room',      dataType: 'number' },
  day_use:               { name: 'day_use',               category: 'room',      dataType: 'number' },
  out_of_order:          { name: 'out_of_order',          category: 'room',      dataType: 'number' },
  out_of_inventory:      { name: 'out_of_inventory',      category: 'room',      dataType: 'number' },
  extra_bed:             { name: 'extra_bed',             category: 'room',      dataType: 'number' },
  // Guest
  number_of_guest:       { name: 'number_of_guest',       category: 'guest',     dataType: 'number' },
  today_arrival:         { name: 'today_arrival',         category: 'guest',     dataType: 'number' },
  today_departure:       { name: 'today_departure',       category: 'guest',     dataType: 'number' },
  next_arrival:          { name: 'next_arrival',          category: 'guest',     dataType: 'number' },
  next_departure:        { name: 'next_departure',        category: 'guest',     dataType: 'number' },
  // Segments
  segment_fit:           { name: 'segment_fit',           category: 'segment',   dataType: 'number' },
  segment_corporate:     { name: 'segment_corporate',     category: 'segment',   dataType: 'number' },
  segment_government:    { name: 'segment_government',    category: 'segment',   dataType: 'number' },
  segment_travel_agent:  { name: 'segment_travel_agent',  category: 'segment',   dataType: 'number' },
  segment_ota:           { name: 'segment_ota',           category: 'segment',   dataType: 'number' },
  // F&B outlets (food)
  outlet_breakfast:      { name: 'outlet_breakfast',      category: 'outlet',    dataType: 'currency' },
  outlet_restaurant:     { name: 'outlet_restaurant',     category: 'outlet',    dataType: 'currency' },
  outlet_room_service:   { name: 'outlet_room_service',   category: 'outlet',    dataType: 'currency' },
  outlet_banquet:        { name: 'outlet_banquet',        category: 'outlet',    dataType: 'currency' },
  outlet_sky_bar:        { name: 'outlet_sky_bar',        category: 'outlet',    dataType: 'currency' },
  outlet_all_day_dining: { name: 'outlet_all_day_dining', category: 'outlet',    dataType: 'currency' },
  outlet_lounge:         { name: 'outlet_lounge',         category: 'outlet',    dataType: 'currency' },
  outlet_exec_lounge:    { name: 'outlet_exec_lounge',    category: 'outlet',    dataType: 'currency' },
  outlet_pastry:         { name: 'outlet_pastry',         category: 'outlet',    dataType: 'currency' },
  outlet_food_promo:     { name: 'outlet_food_promo',     category: 'outlet',    dataType: 'currency' },
  outlet_pool_bar:       { name: 'outlet_pool_bar',       category: 'outlet',    dataType: 'currency' },
  // F&B outlets (beverage)
  bev_restaurant:        { name: 'bev_restaurant',        category: 'outlet',    dataType: 'currency' },
  bev_sky_bar:           { name: 'bev_sky_bar',           category: 'outlet',    dataType: 'currency' },
  bev_lobby_bar:         { name: 'bev_lobby_bar',         category: 'outlet',    dataType: 'currency' },
  bev_room_service:      { name: 'bev_room_service',      category: 'outlet',    dataType: 'currency' },
  bev_banquet:           { name: 'bev_banquet',           category: 'outlet',    dataType: 'currency' },
  bev_pastry:            { name: 'bev_pastry',            category: 'outlet',    dataType: 'currency' },
  bev_pool_bar:          { name: 'bev_pool_bar',          category: 'outlet',    dataType: 'currency' },
  // Other FB sub-items
  fb_tobacco:            { name: 'fb_tobacco',            category: 'outlet',    dataType: 'currency' },
  fb_other_revenue:      { name: 'fb_other_revenue',      category: 'outlet',    dataType: 'currency' },
  fb_room_rental:        { name: 'fb_room_rental',        category: 'outlet',    dataType: 'currency' },
  fb_equipment_rental:   { name: 'fb_equipment_rental',   category: 'outlet',    dataType: 'currency' },
  // Other department sub-items
  dept_communication:    { name: 'dept_communication',    category: 'department', dataType: 'currency' },
  dept_business_center:  { name: 'dept_business_center',  category: 'department', dataType: 'currency' },
  dept_drug_store:       { name: 'dept_drug_store',       category: 'department', dataType: 'currency' },
  dept_swimming_pool:    { name: 'dept_swimming_pool',    category: 'department', dataType: 'currency' },
  dept_laundry:          { name: 'dept_laundry',          category: 'department', dataType: 'currency' },
  dept_minibar:          { name: 'dept_minibar',          category: 'department', dataType: 'currency' },
  dept_spa:              { name: 'dept_spa',              category: 'department', dataType: 'currency' },
  dept_decoration:       { name: 'dept_decoration',       category: 'department', dataType: 'currency' },
  dept_car_rental:       { name: 'dept_car_rental',       category: 'department', dataType: 'currency' },
  dept_jamu:             { name: 'dept_jamu',             category: 'department', dataType: 'currency' },
  dept_wp_from_room:     { name: 'dept_wp_from_room',     category: 'department', dataType: 'currency' },
  dept_misc:             { name: 'dept_misc',             category: 'department', dataType: 'currency' },
};

// ── Line Pattern Definitions ────────────────────────────────
// Order matters: more specific patterns first.
// Each pattern: [regex, metricName, context?]
// context: 'actual' | 'budget' | 'variance' — helps disambiguate Variance lines
type LinePattern = [RegExp, string, 'actual' | 'budget' | 'variance'];

const LINE_PATTERNS: LinePattern[] = [
  // ── BUDGET patterns (must come before actual patterns to avoid false matches) ──
  // Budget Room Revenue (various prefixes)
  [/budget\s*(?:mtd|ytd)?\s*room\s*revenue/i, 'room_revenue', 'budget'],
  [/budget\s*(?:mtd|ytd)?\s*room\s*revenue\s*nett/i, 'room_revenue', 'budget'],
  // Budget Food Revenue
  [/budget\s*(?:mtd|ytd)?\s*(?:food|food\s*rev)/i, 'food_revenue', 'budget'],
  // Budget Beverage Revenue
  [/budget\s*(?:mtd|ytd)?\s*(?:beverage|beverage\s*rev)/i, 'beverage_revenue', 'budget'],
  // Budget F&B / Dept F&B
  [/budget\s*(?:mtd|ytd)?\s*(?:dept\s*)?f\s*&\s*b/i, 'fb_revenue', 'budget'],
  // Budget Total Hotel Revenue / Revenue Hotel
  [/budget\s*(?:mtd|ytd)?\s*(?:total\s*hotel\s*revenue|revenue\s*hotel)/i, 'total_revenue', 'budget'],
  // Budget Other Revenue / Other Dept
  [/budget\s*(?:mtd|ytd)?\s*other\s*(?:revenue|dept)/i, 'other_dept_revenue', 'budget'],

  // ── VARIANCE patterns ──
  [/^variance\b/i, '_VARIANCE_MARKER', 'variance'],

  // ── CORE REVENUE (actual) ──
  // Total Hotel Revenue Nett (most specific — must come before room_revenue)
  [/total\s*hotel\s*revenue\s*nett/i, 'total_revenue', 'actual'],
  // Total Dept F & B Rev (Pekanbaru variant)
  [/total\s*(?:dept\s*)?f\s*&\s*b\s*rev/i, 'fb_revenue', 'actual'],
  // F & B Rev. (all hotels)
  [/^f\s*&\s*b\s*rev/i, 'fb_revenue', 'actual'],
  // Other Departement Revenue / Other Dept Rev / Other Rev (Pekanbaru variant)
  [/other\s*(?:departement|dept)\s*rev/i, 'other_dept_revenue', 'actual'],
  [/^other\s*rev\b/i, 'other_dept_revenue', 'actual'],
  // Other Revenue FB (Pekanbaru)
  [/other\s*revenue\s*fb/i, 'other_fb_revenue', 'actual'],
  // OTHER FB Rev. (Samosir/Toba)
  [/other\s*fb\s*rev/i, 'other_fb_revenue', 'actual'],
  // FOOD Rev.
  [/food\s*rev/i, 'food_revenue', 'actual'],
  // BEVERAGE Rev.
  [/beverage\s*rev/i, 'beverage_revenue', 'actual'],
  // Room Revenue.
  [/room\s*revenue/i, 'room_revenue', 'actual'],

  // ── ROOM METRICS (actual) ──
  [/occupancy\s*(?:by\s*room\s*sold)?/i, 'occupancy', 'actual'],
  [/room\s*sold/i, 'room_sold', 'actual'],
  [/a\s*r\s*r/i, 'arr', 'actual'],
  [/room\s*available/i, 'room_available', 'actual'],
  [/room\s*saleable/i, 'room_saleable', 'actual'],
  [/room\s*occupied/i, 'room_occupied', 'actual'],
  [/vacant\s*room/i, 'vacant_room', 'actual'],
  [/compliment/i, 'compliment', 'actual'],
  [/house\s*use/i, 'house_use', 'actual'],
  [/day\s*use/i, 'day_use', 'actual'],
  [/out\s*of\s*order/i, 'out_of_order', 'actual'],
  [/out\s*of\s*inventory/i, 'out_of_inventory', 'actual'],
  [/extra\s*bed/i, 'extra_bed', 'actual'],

  // ── GUEST METRICS ──
  [/number\s*of\s*guest/i, 'number_of_guest', 'actual'],
  [/t\/a\s*(?:-?\s*today\s*arrival)?/i, 'today_arrival', 'actual'],
  [/t\/d\s*(?:-?\s*today\s*departure)?/i, 'today_departure', 'actual'],
  [/next\s*arrival/i, 'next_arrival', 'actual'],
  [/next\s*departure/i, 'next_departure', 'actual'],

  // ── SEGMENT ──
  [/free\s*individual\s*traveller/i, 'segment_fit', 'actual'],
  [/^corporate/i, 'segment_corporate', 'actual'],
  [/^government/i, 'segment_government', 'actual'],
  [/travel\s*agent/i, 'segment_travel_agent', 'actual'],
  [/online\s*travel\s*agent/i, 'segment_ota', 'actual'],

  // ── F&B OUTLETS (food) ──
  [/breakfast\s*rev/i, 'outlet_breakfast', 'actual'],
  [/sada\s*restaurant/i, 'outlet_restaurant', 'actual'],
  [/the\s*croquet/i, 'outlet_restaurant', 'actual'],
  [/orient\s*restaurant/i, 'outlet_restaurant', 'actual'],
  [/room\s*service/i, 'outlet_room_service', 'actual'],
  [/banquet/i, 'outlet_banquet', 'actual'],
  [/desanawalu\s*sky\s*bar/i, 'outlet_sky_bar', 'actual'],
  [/sky\s*8/i, 'outlet_sky_bar', 'actual'],
  [/betahita\s*all\s*day\s*dining/i, 'outlet_all_day_dining', 'actual'],
  [/lobby\s*bar/i, 'outlet_lounge', 'actual'],
  [/uluba\s*lounge/i, 'outlet_lounge', 'actual'],
  [/hariara\s*executive\s*lounge/i, 'outlet_exec_lounge', 'actual'],
  [/clove\s*lounge/i, 'outlet_lounge', 'actual'],
  [/laffete\s*&?\s*pastry\s*shop/i, 'outlet_pastry', 'actual'],
  [/pastry\s*shope/i, 'outlet_pastry', 'actual'],
  [/aek\s*simare/i, 'outlet_restaurant', 'actual'],
  [/food\s*promotion/i, 'outlet_food_promo', 'actual'],
  [/pool\s*bar/i, 'outlet_pool_bar', 'actual'],

  // ── F&B OUTLETS (beverage context — prefix with bev_) ──
  // Note: These patterns are matched in beverage section context
  // handled separately in parseBeverageSection()

  // ── OTHER FB SUB-ITEMS ──
  [/fb\s*-\s*tobacco/i, 'fb_tobacco', 'actual'],
  [/fb\s*-\s*fb\s*other\s*revenue/i, 'fb_other_revenue', 'actual'],
  [/fb\s*-\s*room\s*rental/i, 'fb_room_rental', 'actual'],
  [/fb\s*-\s*equipment\s*rental/i, 'fb_equipment_rental', 'actual'],

  // ── OTHER DEPARTMENT SUB-ITEMS ──
  [/communication/i, 'dept_communication', 'actual'],
  [/buss?ines?s\s*center/i, 'dept_business_center', 'actual'],
  [/drug\s*store/i, 'dept_drug_store', 'actual'],
  [/swimming\s*pool\s*golf/i, 'dept_swimming_pool', 'actual'],
  [/water\s*park\s*revenue\s*from\s*room/i, 'dept_wp_from_room', 'actual'],
  [/laundry\s*rev/i, 'dept_laundry', 'actual'],
  [/minibar/i, 'dept_minibar', 'actual'],
  [/spa\s*&?\s*massage/i, 'dept_spa', 'actual'],
  [/decoration/i, 'dept_decoration', 'actual'],
  [/car\s*rental/i, 'dept_car_rental', 'actual'],
  [/^jamu\b/i, 'dept_jamu', 'actual'],
  [/other\s*income\s*-?\s*misc/i, 'dept_misc', 'actual'],
];

// ── Helper: Parse Number ────────────────────────────────────
function parseNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  // "-" or empty = no value
  if (cleaned === '-' || cleaned === '' || cleaned === '\u00A0') return 0;
  // Remove thousand separators (commas), keep decimal dot
  const num = parseFloat(cleaned.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// ── Helper: Split line on ===> and extract value + percentage ──
function splitArrowPair(raw: string): { value: string; percent: string | null } {
  const arrowIdx = raw.indexOf('==>');
  if (arrowIdx === -1) return { value: raw, percent: null };
  const left = raw.substring(0, arrowIdx).trim();
  const right = raw.substring(arrowIdx + 3).trim().replace('%', '');
  return { value: left, percent: right };
}

// ── Hotel Parser ────────────────────────────────────────────
export class HotelParser extends BaseParser {
  constructor(config: ParserConfig) {
    super(config);
  }

  parse(text: string): ParserResult {
    const warnings: string[] = [];

    // 1. Extract date from header
    const date = this.extractDate(text);

    // 2. Split into periods
    const periods = this.splitIntoPeriods(text);

    // 3. Parse each period
    const allMetrics: ParsedMetric[] = [];

    for (const period of periods) {
      const periodMetrics = this.parsePeriod(period.lines);
      // Tag each metric with period info
      for (const m of periodMetrics) {
        m.name = `${period.type}_${m.name}`;
        allMetrics.push(m);
      }
    }

    // 4. Validate
    if (allMetrics.length === 0) {
      warnings.push('Tidak ada metric hotel yang berhasil diparsing');
    }

    return this.createResult(allMetrics, date, warnings);
  }

  // ── Period Detection ──────────────────────────────────────
  private splitIntoPeriods(text: string): Array<{ type: 'today' | 'mtd' | 'ytd'; label: string; lines: string[] }> {
    const lines = text.split('\n');
    const periods: Array<{ type: 'today' | 'mtd' | 'ytd'; label: string; lines: string[] }> = [];
    let currentPeriod: { type: 'today' | 'mtd' | 'ytd'; label: string; lines: string[] } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      // Detect period headers
      if (/^today\b/i.test(trimmed)) {
        if (currentPeriod) periods.push(currentPeriod);
        currentPeriod = { type: 'today', label: trimmed, lines: [] };
        continue;
      }
      if (/\bmtd\b/i.test(trimmed) && !/room|food|beverage|hotel|revenue|f\s*&\s*b|dept/i.test(trimmed)) {
        if (currentPeriod) periods.push(currentPeriod);
        currentPeriod = { type: 'mtd', label: trimmed, lines: [] };
        continue;
      }
      if (/\bytd\b/i.test(trimmed) && !/room|food|beverage|hotel|revenue|f\s*&\s*b|dept/i.test(trimmed)) {
        if (currentPeriod) periods.push(currentPeriod);
        currentPeriod = { type: 'ytd', label: trimmed, lines: [] };
        continue;
      }

      // Skip header lines before first period
      if (!currentPeriod) continue;

      // Add line to current period
      currentPeriod.lines.push(line);
    }

    // Push last period
    if (currentPeriod) periods.push(currentPeriod);

    // If no periods detected, treat entire text as 'today'
    if (periods.length === 0) {
      periods.push({ type: 'today', label: 'TODAY (implicit)', lines });
    }

    return periods;
  }

  // ── Parse a Single Period ─────────────────────────────────
  private parsePeriod(lines: string[]): ParsedMetric[] {
    const metrics: ParsedMetric[] = [];
    const seen = new Set<string>(); // track metric names to avoid duplicates
    let inBeverageSection = false;
    let inOutletBevSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect section boundaries
      if (/beverage\s*rev/i.test(trimmed)) {
        inBeverageSection = true;
        inOutletBevSection = true;
      } else if (/food\s*rev/i.test(trimmed)) {
        inOutletBevSection = false;
        inBeverageSection = false;
      } else if (/other\s*(?:fb|revenue\s*fb)/i.test(trimmed) || /^fb\s*-/i.test(trimmed)) {
        inOutletBevSection = false;
        inBeverageSection = false;
      } else if (/other\s*(?:departement|dept)\s*rev|^other\s*rev\b/i.test(trimmed)) {
        inOutletBevSection = false;
        inBeverageSection = false;
      } else if (/total\s*(?:dept\s*)?f\s*&\s*b|f\s*&\s*b\s*rev/i.test(trimmed)) {
        // Total F&B line — reset sub-sections
        inOutletBevSection = false;
      }

      // Split on ===>
      const { value: rawValue, percent } = splitArrowPair(trimmed);

      // Extract the "Label : Value" part
      // Handle both ":" and tab as separators
      const colonMatch = rawValue.match(/^(.+?)\s*:\s*(.*)$/);
      let label = '';
      let rawVal = '';
      if (colonMatch) {
        label = colonMatch[1].trim();
        rawVal = colonMatch[2].trim();
      } else {
        // Try tab-separated: "Label\tValue"
        const tabParts = trimmed.split(/\t+/);
        if (tabParts.length >= 2) {
          label = tabParts[0].trim();
          // Get the value part (may be after ===> split)
          rawVal = rawValue.replace(label, '').trim();
        } else {
          continue; // Can't parse this line
        }
      }

      if (!label) continue;

      // Skip section headers that have no value
      if (/^segment$/i.test(label)) continue;

      // Match against patterns
      let matched = false;
      for (const [regex, metricName, context] of LINE_PATTERNS) {
        if (!regex.test(label)) continue;

        // Handle variance marker
        if (metricName === '_VARIANCE_MARKER') {
          // Extract the value from this variance line
          const val = parseNumber(rawVal);
          if (val !== null && val !== 0) {
            // Find the last "actual" metric to apply variance to
            const lastActual = [...metrics].reverse().find(
              (m) => m.category !== 'budget' && m.variance === null
            );
            if (lastActual) {
              lastActual.variance = val;
              if (percent !== null) {
                lastActual.achievement = parseFloat(percent);
              }
            }
          }
          matched = true;
          break;
        }

        // Determine if this is budget context
        const isBudget = context === 'budget';
        const metricKey = isBudget ? `${metricName}_budget` : metricName;

        // For variance context, apply to the existing metric
        if (context === 'variance') {
          matched = true;
          break;
        }

        // Check if metric already exists (for duplicates in same period)
        if (seen.has(metricKey) && !isBudget) {
          matched = true;
          break;
        }

        // Parse value
        const val = parseNumber(rawVal);
        if (val === null) {
          matched = true;
          break;
        }

        // Get metric schema
        const schema = METRIC_SCHEMA[metricName];
        if (!schema) {
          matched = true;
          break;
        }

        // Handle beverage section context
        let actualMetricName = metricName;
        if (inBeverageSection && inOutletBevSection && !/beverage\s*rev/i.test(label)) {
          // Map food outlet names to beverage equivalents
          if (metricName === 'outlet_restaurant') actualMetricName = 'bev_restaurant';
          else if (metricName === 'outlet_sky_bar') actualMetricName = 'bev_sky_bar';
          else if (metricName === 'outlet_lounge') actualMetricName = 'bev_lobby_bar';
          else if (metricName === 'outlet_room_service') actualMetricName = 'bev_room_service';
          else if (metricName === 'outlet_banquet') actualMetricName = 'bev_banquet';
          else if (metricName === 'outlet_pastry') actualMetricName = 'bev_pastry';
          else if (metricName === 'outlet_pool_bar') actualMetricName = 'bev_pool_bar';
        }

        if (isBudget) {
          // Find existing metric and set its budget
          const existing = metrics.find((m) => m.name === actualMetricName);
          if (existing) {
            existing.budget = val;
            // Only set achievement from budget line if not already set by actual line
            if (percent !== null && existing.achievement === null) {
              existing.achievement = parseFloat(percent);
            }
            // Calculate variance if not set
            if (existing.variance === null && existing.actual !== null) {
              existing.variance = existing.actual - val;
            }
          } else {
            // Create budget-only metric (actual will come later or is missing)
            metrics.push({
              name: actualMetricName,
              category: schema.category,
              actual: null,
              budget: val,
              variance: null,
              achievement: percent !== null ? parseFloat(percent) : null,
              unit: schema.dataType === 'percent' ? 'percent' : schema.dataType === 'number' ? 'number' : 'currency',
            });
            seen.add(metricKey);
          }
        } else {
          // Actual value
          const achievement = percent !== null ? parseFloat(percent) : null;

          // Find existing metric (budget might have been set first)
          const existing = metrics.find((m) => m.name === actualMetricName);
          if (existing) {
            existing.actual = val;
            if (achievement !== null) existing.achievement = achievement;
            if (existing.budget !== null) {
              existing.variance = val - existing.budget;
            }
          } else {
            metrics.push({
              name: actualMetricName,
              category: schema.category,
              actual: val,
              budget: null,
              variance: null,
              achievement,
              unit: schema.dataType === 'percent' ? 'percent' : schema.dataType === 'number' ? 'number' : 'currency',
            });
            seen.add(metricKey);
          }
        }

        matched = true;
        break;
      }

      if (!matched) {
        // Check if this is an OTA sub-channel (skip — already counted in segment_ota)
        if (/^\s*(pegi|tiket|traveloka|ctrip|agoda|expedia|booking|website|mg\s*holiday|klik\s*(?:n|&)\s*book|bookcabin|mco|mgo|com)\b/i.test(label)) {
          continue;
        }
      }
    }

    return metrics;
  }
}
