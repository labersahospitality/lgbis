import { BaseParser, ParserConfig, ParserResult } from './base';
import type { ParsedMetric } from '../types';

export class WaterparkParser extends BaseParser {
  constructor(config: ParserConfig) {
    super(config);
  }

  parse(text: string): ParserResult {
    const date = this.extractDate(text);
    const metrics: ParsedMetric[] = [];
    const warnings: string[] = [];

    // Split into periods: DTD/TODAY, MTD, YTD
    const sections = this.splitPeriods(text);

    for (const [period, sectionText] of Object.entries(sections)) {
      const prefix = period === 'daily' ? 'today' : period === 'mtd' ? 'mtd' : 'ytd';

      // --- Revenue Metrics ---
      // Total revenue first (highest priority)
      const totalRevenue = this.extractRevenue(sectionText, [
        /total\s*:\s*(?:rp\.?\s*)?([\d.,]+)\s*,?\s*-/i,
        /total\s*(?:rev|pendapatan|revenue)?\s*(?:tofan|wtp|sifan|rifan)?\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)\s*,?\s*-/i,
        /total\s*(?:rev|pendapatan|revenue)?\s*(?:tofan|wtp|sifan|rifan)?\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      ]);

      // Actual WTP revenue
      const wtpRevenue = this.extractRevenue(sectionText, [
        /actual\s*wtp\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)\s*,?\s*-/i,
        /actual\s*wtp\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      ]);

      // Plain "Actual :" for simpler reports (SIFAN)
      const plainActual = this.extractRevenue(sectionText, [
        /actual\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)\s*,?\s*-/i,
        /actual\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      ]);

      // "Rev DTD Tofan" format (TOFAN) — also handle ".1.Rev  DTD Tofan  Rp"
      const revDtd = this.extractRevenue(sectionText, [
        /\.?1\s*[.)]?\s*rev\s*(?:dtd|mt|ytd)?\s*(?:tofan|wtp|sifan|rifan)?\s*(?:rp\.?\s*)([\d.,]+)/i,
        /rev\s*(?:dtd|mt|ytd)?\s*(?:tofan|wtp|sifan|rifan)?\s*(?:rp\.?\s*)([\d.,]+)/i,
      ]);

      // Go-kart revenue
      const gokartRevenue = this.extractRevenue(sectionText, [
        /go[\s-]*kart\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)\s*,?\s*-/i,
        /go[\s-]*kart\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      ]);

      // Mobil Listrik revenue
      const mobilListrikRevenue = this.extractRevenue(sectionText, [
        /mobil\s*listrik\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)\s*,?\s*-/i,
        /mobil\s*listrik\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      ]);

      // Sport Center revenue — require Rp prefix to avoid matching dates
      const sportCenterRevenue = this.extractRevenue(sectionText, [
        /sport\s*center\s*[:.]?\s*(?:rp\.?\s*)([\d.,]+)\s*,?\s*-/i,
        /sport\s*center\s*[:.]?\s*(?:rp\.?\s*)([\d.,]+)/i,
      ]);

      // Determine best actual revenue
      const actualRevenue = totalRevenue || wtpRevenue || plainActual || revDtd;

      if (actualRevenue !== null && actualRevenue > 0) {
        metrics.push({
          name: `${prefix}_revenue`,
          category: 'revenue',
          actual: actualRevenue,
          budget: null,
          variance: null,
          achievement: null,
          unit: 'currency',
        });
      }

      // Sub-revenue streams
      if (wtpRevenue !== null && wtpRevenue > 0 && wtpRevenue !== actualRevenue) {
        metrics.push({
          name: `${prefix}_wtp_revenue`,
          category: 'revenue',
          actual: wtpRevenue,
          budget: null, variance: null, achievement: null,
          unit: 'currency',
        });
      }
      if (gokartRevenue !== null && gokartRevenue > 0) {
        metrics.push({
          name: `${prefix}_gokart_revenue`,
          category: 'revenue',
          actual: gokartRevenue,
          budget: null, variance: null, achievement: null,
          unit: 'currency',
        });
      }
      if (mobilListrikRevenue !== null && mobilListrikRevenue > 0) {
        metrics.push({
          name: `${prefix}_mobil_listrik_revenue`,
          category: 'revenue',
          actual: mobilListrikRevenue,
          budget: null, variance: null, achievement: null,
          unit: 'currency',
        });
      }
      if (sportCenterRevenue !== null && sportCenterRevenue > 0) {
        metrics.push({
          name: `${prefix}_sport_center_revenue`,
          category: 'revenue',
          actual: sportCenterRevenue,
          budget: null, variance: null, achievement: null,
          unit: 'currency',
        });
      }

      // --- Budget (MTD/YTD only) ---
      // Handle multi-line budget format (e.g., "budged\nrev Rp 620.433.437")
      const budgetRevenue = this.extractRevenue(sectionText, [
        /budget\s*(?:rev|revenue|pendapatan)?\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)\s*,?\s*-/i,
        /budget\s*(?:rev|revenue|pendapatan)?\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
        /budget\s*:\s*(?:rp\.?\s*)?([\d.,]+)\s*,?\s*-/i,
        /budget\s*:\s*(?:rp\.?\s*)?([\d.,]+)/i,
        /budged\s*\n\s*rev\s*(?:rp\.?\s*)?([\d.,]+)/i,
        /budget\s*\n\s*rev\s*(?:rp\.?\s*)?([\d.,]+)/i,
      ]);

      if (budgetRevenue !== null && budgetRevenue > 0) {
        const revMetric = metrics.find(m => m.name === `${prefix}_revenue`);
        if (revMetric) {
          revMetric.budget = budgetRevenue;
          revMetric.variance = this.calculateVariance(revMetric.actual, budgetRevenue);
          revMetric.achievement = this.calculateAchievement(revMetric.actual, budgetRevenue);
        }
      }

      // --- Achievement (Pencapaian) — handle comma as decimal ---
      const pencapaian = this.extractAchievement(sectionText);

      if (pencapaian !== null) {
        const revMetric = metrics.find(m => m.name === `${prefix}_revenue`);
        if (revMetric && !revMetric.achievement) {
          revMetric.achievement = pencapaian;
        }
      }

      // --- Visitors ---
      // Must have "pax" suffix to avoid matching revenue numbers.
      // Real-world source lines vary widely, e.g.:
      //   "Total pengunjung : 16 pax"                (HTN)
      //   "Total Pengunjung Wtp : 203 pax"           (RIFAN)
      //   "Total Pengunjung: 72.614 pax."            (RIFAN YTD)
      //   "Pengunjung Wtp : 247 pax"                 (SIFAN)
      //   "Total pengunjung tofan 3.653 pax"         (TOFAN MTD)
      //   "Total pengunjung WTP/TP TOFAN = 69 pax"   (TOFAN Today)
      //   "Total pengunjung Tofan  := 44.722  pax"   (TOFAN YTD)
      // Between "pengunjung" and the count there can be unit tokens
      // ("wtp/tp tofan") and separators (":", "=", ":=", or none), so skip
      // any non-digit text on the same line up to the first number that
      // ends with "pax". This preserves 0-separator parsing (TOFAN MTD)
      // while also handling "="/":=" and multi-token phrasing.
      const visitors = this.extractNumber(sectionText, [
        /total\s*pengunjung[^0-9\r\n]*?([\d.,]+)\s*pax/i,
        /pengunjung[^0-9\r\n]*?([\d.,]+)\s*pax/i,
      ]);

      if (visitors !== null && visitors > 0) {
        metrics.push({
          name: `${prefix}_visitors`,
          category: 'traffic',
          actual: visitors,
          budget: null,
          variance: null,
          achievement: null,
          unit: 'number',
        });
      }

      // Visitor budget (MTD/YTD)
      const visitorBudget = this.extractNumber(sectionText, [
        /budget\s*pengunjung\s*[:.]?\s*([\d.,]+)\s*pax/i,
        /pengunjung\s*budget\s*[:.]?\s*([\d.,]+)\s*pax/i,
      ]);

      if (visitorBudget !== null && visitorBudget > 0) {
        const visMetric = metrics.find(m => m.name === `${prefix}_visitors`);
        if (visMetric) {
          visMetric.budget = visitorBudget;
          visMetric.variance = this.calculateVariance(visMetric.actual, visitorBudget);
          visMetric.achievement = this.calculateAchievement(visMetric.actual, visitorBudget);
        }
      }
    }

    if (metrics.length === 0) {
      warnings.push('Tidak ada metric waterpark yang berhasil diparsing');
    }

    return this.createResult(metrics, date, warnings);
  }

  // Simple number parse from a string — removes commas, dots as thousands, spaces
  private parseNumberStr(s: string): number | null {
    const cleaned = s.replace(/[.,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  // Extract revenue — only match numbers that appear with Rp or in revenue context
  private extractRevenue(text: string, patterns: RegExp[]): number | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const num = this.parseNumberStr(match[1]);
        if (num !== null && num > 0) return num;
      }
    }
    return null;
  }

  // Extract achievement percentage — handle comma as decimal (Indonesian format)
  private extractAchievement(text: string): number | null {
    // Try "Pencapaian: 68,54 %" or "Pencapaian: 35 %"
    const patterns = [
      /pencapaian\s*[:.]?\s*([\d]+)[,.]([\d]+)\s*%/i,
      /pencapaian\s*[:.]?\s*([\d]+)\s*%/i,
      /pencapaian\s*[:.]?\s*([\d]+)[,.]([\d]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[2]) {
          // Has decimal part: "68,54" → 68.54
          return parseFloat(`${match[1]}.${match[2]}`);
        }
        return parseFloat(match[1]);
      }
    }
    return null;
  }

  private splitPeriods(text: string): Record<string, string> {
    const lines = text.split(/\r?\n/);
    const periodLines: Record<string, string[]> = { daily: [], mtd: [], ytd: [] };
    let currentPeriod = 'daily';

    for (const line of lines) {
      const lower = line.toLowerCase().trim();

      // Detect period boundaries by numbered sections or keywords
      // Handle patterns: "1.Rev", ".1.Rev", "1. Rev", "1)", "net DTD", "Rev DTD", etc.
      // IMPORTANT: push the line into the NEW period before switching —
      // the boundary line often carries data (e.g. revenue) on the same line.
      if (
        (lower.match(/^[.]*1[.)\s].*(?:dtd|rev|net)/) && lower.includes('dtd'))
        || lower.match(/net\s*dtd/i)
        || lower.match(/rev\s*dtd/i)
        || lower.match(/rev\s+dtd/i)
      ) {
        currentPeriod = 'daily';
        periodLines[currentPeriod].push(line);
        continue;
      }
      if (
        (lower.match(/^[.]*2[.)\s].*mtd/) && lower.includes('mtd'))
        || lower.match(/net\s*mtd/i)
        || lower.match(/rev\s*mtd/i)
        || lower.match(/^mtd[\s-]/i)
        || lower.match(/^mtd\s+agustus/i)
      ) {
        currentPeriod = 'mtd';
        periodLines[currentPeriod].push(line);
        continue;
      }
      if (
        (lower.match(/^[.]*3[.)\s].*ytd/) && lower.includes('ytd'))
        || lower.match(/net\s*ytd/i)
        || lower.match(/rev\s*ytd/i)
        || lower.match(/^ytd[\s-]/i)
        || lower.match(/ytd\s*-\s*periode/i)
        || lower.match(/ytd\s+januari/i)
      ) {
        currentPeriod = 'ytd';
        periodLines[currentPeriod].push(line);
        continue;
      }

      periodLines[currentPeriod].push(line);
    }

    const sections: Record<string, string> = {};
    for (const [period, lines] of Object.entries(periodLines)) {
      sections[period] = lines.join('\n');
    }
    return sections;
  }
}
