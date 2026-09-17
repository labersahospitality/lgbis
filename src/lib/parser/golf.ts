import { BaseParser, ParserConfig, ParserResult } from './base';
import type { ParsedMetric } from '../types';

export class GolfParser extends BaseParser {
  constructor(config: ParserConfig) {
    super(config);
  }

  // ── Indonesian number format: 16.936.936,92 → 16936936.92 ──
  private parseIndonesianNumber(s: string): number | null {
    if (!s || s.trim() === '' || s.trim() === '-') return null;
    const cleaned = s.trim();
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? null : num;
  }

  private extractNumberID(text: string, patterns: RegExp[]): number | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const num = this.parseIndonesianNumber(match[1]);
        if (num !== null) return num;
      }
    }
    return null;
  }

  // ── Format detection ──
  private isMultiPeriod(text: string): boolean {
    return /month\s*to\s*date/i.test(text) && /year\s*to\s*date/i.test(text);
  }

  parse(text: string): ParserResult {
    if (this.isMultiPeriod(text)) {
      return this.parseMultiPeriod(text);
    }
    return this.parseSinglePeriod(text);
  }

  // ═══════════════════════════════════════════════════════════
  // MULTI-PERIOD FORMAT (TODAY + MTD + YTD in one report)
  // ═══════════════════════════════════════════════════════════
  // Column layout (tab-separated):
  //   [0]  Description
  //   [4]  Today Actual
  //   [7]  Today Budget
  //   [8]  MTD Actual
  //   [9]  MTD Budget
  //   [12] Variance Amount
  //   [13] Achievement %
  //   [16] YTD Actual
  //   [20] YTD Budget

  private readonly COL = {
    TODAY_ACT: 4,
    TODAY_BUD: 7,
    MTD_ACT: 8,
    MTD_BUD: 9,
    MTD_VARIANCE: 12,
    MTD_ACHIEVE: 13,
    YTD_ACT: 16,
    YTD_BUD: 20,
  } as const;

  // Map row labels to metric names.
  // Section context is tracked to disambiguate duplicate labels.
  // Format: [label, sectionContext?, metricName, period, valueType]
  private parseMultiPeriod(text: string): ParserResult {
    const date = this.extractGolfDate(text);
    const metrics: ParsedMetric[] = [];
    const warnings: string[] = [];
    const lines = text.split(/\r?\n/);

    let section = 'root'; // root, golf, practice, fb_3fields, fb_driving, service_charge, tax

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 5) continue;

      const label = parts[0]?.trim();
      if (!label) continue;

      // Detect section boundaries
      const labelLower = label.toLowerCase();
      if (labelLower === 'outlet revenue') { section = 'root'; continue; }
      if (labelLower === 'service charge') { section = 'service_charge'; continue; }
      if (labelLower === 'tax' || labelLower === 'tax2') { section = 'tax'; continue; }

      if (label === 'GOLF') {
        // Could be section header or data row with values
        const hasData = this.parseIndonesianNumber(parts[this.COL.MTD_ACT]) !== null;
        if (!hasData) {
          // Section header — determine which GOLF section based on context
          if (section === 'root' || section === 'practice' || section === 'fb_3fields' || section === 'fb_driving') {
            section = 'golf';
          } else if (section === 'service_charge') {
            section = 'service_golf';
          } else if (section === 'tax') {
            section = 'tax_golf';
          }
          continue;
        }
        // Data row with 'GOLF' label — keep current section
      }
      if (labelLower === 'practice rng' || labelLower === 'practige rng') {
        if (section === 'root' || section === 'golf') {
          section = 'practice';
        } else if (section === 'service_charge') {
          section = 'service_practice';
        } else if (section === 'tax') {
          section = 'tax_practice';
        }
        continue;
      }
      if (labelLower === '3fields') {
        const hasData3f = this.parseIndonesianNumber(parts[this.COL.MTD_ACT]) !== null;
        if (!hasData3f) {
          // Section header
          if (section.startsWith('service')) {
            section = 'service_fb';
          } else if (section.startsWith('tax')) {
            section = 'tax_fb';
          } else {
            section = 'fb_3fields';
          }
          continue;
        }
        // Data row with 3fields label — keep section
      }
      if (labelLower === 'driving rest') {
        const hasDataDr = this.parseIndonesianNumber(parts[this.COL.MTD_ACT]) !== null;
        if (!hasDataDr) {
          // Section header
          if (section.startsWith('service')) {
            section = 'service_driving';
          } else if (section.startsWith('tax')) {
            section = 'tax_driving';
          } else {
            section = 'fb_driving';
          }
          continue;
        }
        // Data row — keep section
      }
      if (labelLower === 'outlet revenue') { section = 'root'; continue; }
      if (labelLower === 'service charge') { section = 'service_charge'; continue; }
      if (labelLower.startsWith('tax') && !labelLower.startsWith('total')) { section = 'tax'; continue; }

      // Parse numeric values from this row
      const todayAct = this.parseIndonesianNumber(parts[this.COL.TODAY_ACT]);
      const todayBud = this.parseIndonesianNumber(parts[this.COL.TODAY_BUD]);
      const mtdAct = this.parseIndonesianNumber(parts[this.COL.MTD_ACT]);
      const mtdBud = this.parseIndonesianNumber(parts[this.COL.MTD_BUD]);
      const mtdVariance = this.parseIndonesianNumber(parts[this.COL.MTD_VARIANCE]);
      const mtdAchieve = this.parseIndonesianNumber(parts[this.COL.MTD_ACHIEVE]);
      const ytdAct = this.parseIndonesianNumber(parts[this.COL.YTD_ACT]);
      const ytdBud = this.parseIndonesianNumber(parts[this.COL.YTD_BUD]);

      // Skip rows with no data at all.
      // Explicit 0 is a valid reported value; only null ('-', empty) means absent.
      const hasAnyData = [todayAct, mtdAct, ytdAct].some(v => v !== null);
      if (!hasAnyData) continue;

      // Map label to metric based on section context
      const metricMapping = this.mapLabelToMetric(labelLower, section);
      if (!metricMapping) continue;

      // Add metrics for each period. Today keeps explicit 0 (report exists, value 0).
      if (todayAct !== null) {
        metrics.push({
          name: `today_${metricMapping.name}`,
          category: metricMapping.category,
          actual: todayAct,
          budget: todayBud,
          variance: todayBud !== null ? todayAct - todayBud : null,
          achievement: todayBud && todayBud > 0 ? (todayAct / todayBud) * 100 : null,
          unit: metricMapping.unit,
        });
      }
      if (mtdAct !== null && mtdAct !== 0) {
        metrics.push({
          name: `mtd_${metricMapping.name}`,
          category: metricMapping.category,
          actual: mtdAct,
          budget: mtdBud,
          variance: mtdVariance,
          achievement: mtdAchieve,
          unit: metricMapping.unit,
        });
      }
      if (ytdAct !== null && ytdAct !== 0) {
        metrics.push({
          name: `ytd_${metricMapping.name}`,
          category: metricMapping.category,
          actual: ytdAct,
          budget: ytdBud,
          variance: ytdBud !== null ? ytdAct - ytdBud : null,
          achievement: ytdBud && ytdBud > 0 ? (ytdAct / ytdBud) * 100 : null,
          unit: metricMapping.unit,
        });
      }
    }

    if (metrics.length === 0) {
      warnings.push('Tidak ada metric golf yang berhasil diparsing dari format multi-period');
    }

    return this.createResult(metrics, date, warnings);
  }

  private mapLabelToMetric(label: string, section: string): { name: string; category: string; unit: string } | null {
    // ── Player counts (traffic) ──
    if (label === 'guest' && section === 'root') return { name: 'player_guest', category: 'traffic', unit: 'number' };
    if (label === 'main membership' && section === 'root') return { name: 'player_membership', category: 'traffic', unit: 'number' };
    if (label === 'supplementary membership' && section === 'root') return null; // skip zero-rows
    if (label === 'without discount card' && section === 'root') return { name: 'total_player', category: 'traffic', unit: 'number' };
    if (label === 'male' && section === 'root') return { name: 'player_male', category: 'traffic', unit: 'number' };
    if (label === 'female' && section === 'root') return { name: 'player_female', category: 'traffic', unit: 'number' };
    if (label === 'food covers' && section === 'root') return { name: 'food_covers', category: 'traffic', unit: 'number' };
    if (label === 'average check' && section === 'root') return { name: 'average_check', category: 'revenue', unit: 'currency' };

    // ── Golf Revenue (section = 'golf') ──
    if (section === 'golf') {
      if (label === 'buggy fee') return { name: 'buggy_fee', category: 'revenue', unit: 'currency' };
      if (label === 'caddy fee') return { name: 'caddy_fee', category: 'revenue', unit: 'currency' };
      if (label === 'green fee') return { name: 'green_fee', category: 'revenue', unit: 'currency' };
      if (label === 'membership fee') return { name: 'membership_fee', category: 'revenue', unit: 'currency' };
      if (label === 'miscellaneous golf') return { name: 'misc_golf', category: 'revenue', unit: 'currency' };
      if (label === 'total golf') return { name: 'golf_revenue', category: 'revenue', unit: 'currency' };
    }

    // ── Practice Range ──
    if (section === 'practice') {
      if (label === 'total practige rng' || label === 'total practice rng') return { name: 'practice_range_revenue', category: 'revenue', unit: 'currency' };
      if (label === 'practige range' || label === 'practice range') return null; // skip individual row, use total
    }

    // ── F&B 3Fields (section = 'fb_3fields') ──
    if (section === 'fb_3fields') {
      if (label === 'beverage') return { name: 'fb_beverage', category: 'revenue', unit: 'currency' };
      if (label === 'cigarette') return { name: 'fb_cigarette', category: 'revenue', unit: 'currency' };
      if (label === 'food') return { name: 'fb_food', category: 'revenue', unit: 'currency' };
      if (label === 'other') return { name: 'fb_other', category: 'revenue', unit: 'currency' };
      if (label === 'total 3fields') return { name: 'fb_revenue', category: 'revenue', unit: 'currency' };
    }

    // ── Driving Restaurant (section = 'fb_driving') ──
    if (section === 'fb_driving') {
      if (label === 'beverage') return { name: 'driving_beverage', category: 'revenue', unit: 'currency' };
      if (label === 'food') return { name: 'driving_food', category: 'revenue', unit: 'currency' };
      if (label === 'total driving rest') return { name: 'driving_restaurant_revenue', category: 'revenue', unit: 'currency' };
    }

    // ── Totals ──
    if (label === 'total revenue') return { name: 'total_revenue', category: 'revenue', unit: 'currency' };
    if (label === 'total service') return { name: 'service_charge', category: 'revenue', unit: 'currency' };
    if (label === 'total tax') return { name: 'tax', category: 'revenue', unit: 'currency' };
    if (label === 'total tax2') return { name: 'total_tax', category: 'revenue', unit: 'currency' };
    if (label === 'total with service & tax') return { name: 'total_revenue_with_tax', category: 'revenue', unit: 'currency' };

    // ── Payment methods ──
    if (label === 'cash') return { name: 'payment_cash', category: 'revenue', unit: 'currency' };
    if (label === 'credit card') return { name: 'payment_credit_card', category: 'revenue', unit: 'currency' };
    if (label === 'city ledger') return { name: 'payment_city_ledger', category: 'revenue', unit: 'currency' };

    // Skip unknown labels
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // SINGLE-PERIOD FORMAT (old format: TODAY only)
  // ═══════════════════════════════════════════════════════════

  private parseSinglePeriod(text: string): ParserResult {
    const date = this.extractGolfDate(text);
    const metrics: ParsedMetric[] = [];
    const warnings: string[] = [];

    // ── Player counts ──
    const guest = this.extractNumberID(text, [/^Guest\s+([\d.,]+)/im]);
    const mainMembership = this.extractNumberID(text, [/^Main Membership\s+([\d.,]+)/im]);
    const withoutDiscountCard = this.extractNumberID(text, [/^Without Discount Card\s+([\d.,]+)/im]);
    const male = this.extractNumberID(text, [/^Male\s+([\d.,]+)/im]);
    const female = this.extractNumberID(text, [/^Female\s+([\d.,]+)/im]);

    const totalPlayers = withoutDiscountCard || ((guest || 0) + (mainMembership || 0)) || null;

    if (totalPlayers !== null && totalPlayers > 0) {
      metrics.push({ name: 'today_total_player', category: 'traffic', actual: totalPlayers, budget: null, variance: null, achievement: null, unit: 'number' });
    }
    if (guest !== null) {
      metrics.push({ name: 'today_player_guest', category: 'traffic', actual: guest, budget: null, variance: null, achievement: null, unit: 'number' });
    }
    if (mainMembership !== null) {
      metrics.push({ name: 'today_player_membership', category: 'traffic', actual: mainMembership, budget: null, variance: null, achievement: null, unit: 'number' });
    }
    if (male !== null) {
      metrics.push({ name: 'today_player_male', category: 'traffic', actual: male, budget: null, variance: null, achievement: null, unit: 'number' });
    }
    if (female !== null) {
      metrics.push({ name: 'today_player_female', category: 'traffic', actual: female, budget: null, variance: null, achievement: null, unit: 'number' });
    }

    // ── Golf Revenue ──
    const buggyFee = this.extractNumberID(text, [/^BUGGY FEE\s+([\d.,]+)/im]);
    const greenFee = this.extractNumberID(text, [/^GREEN FEE\s+([\d.,]+)/im]);
    const totalGolf = this.extractNumberID(text, [/^TOTAL GOLF\s+([\d.,]+)/im]);

    if (totalGolf !== null && totalGolf > 0) {
      metrics.push({ name: 'today_golf_revenue', category: 'revenue', actual: totalGolf, budget: null, variance: null, achievement: null, unit: 'currency' });
    }
    if (buggyFee !== null) {
      metrics.push({ name: 'today_buggy_fee', category: 'revenue', actual: buggyFee, budget: null, variance: null, achievement: null, unit: 'currency' });
    }
    if (greenFee !== null) {
      metrics.push({ name: 'today_green_fee', category: 'revenue', actual: greenFee, budget: null, variance: null, achievement: null, unit: 'currency' });
    }

    // ── Practice Range ──
    const practiceRange = this.extractNumberID(text, [/^TOTAL PRACTIGE RNG\s+([\d.,]+)/im]);
    if (practiceRange !== null && practiceRange > 0) {
      metrics.push({ name: 'today_practice_range_revenue', category: 'revenue', actual: practiceRange, budget: null, variance: null, achievement: null, unit: 'currency' });
    }

    // ── 3Fields (F&B) ──
    const total3Fields = this.extractNumberID(text, [/^TOTAL 3FIELDS\s+([\d.,]+)/im]);
    if (total3Fields !== null && total3Fields > 0) {
      metrics.push({ name: 'today_fb_revenue', category: 'revenue', actual: total3Fields, budget: null, variance: null, achievement: null, unit: 'currency' });
    }

    // ── Driving Restaurant ──
    const drivingRest = this.extractNumberID(text, [/^TOTAL DRIVING REST\s+([\d.,]+)/im]);
    if (drivingRest !== null && drivingRest > 0) {
      metrics.push({ name: 'today_driving_restaurant_revenue', category: 'revenue', actual: drivingRest, budget: null, variance: null, achievement: null, unit: 'currency' });
    }

    // ── Totals ──
    const totalRevenue = this.extractNumberID(text, [/^TOTAL REVENUE\s+([\d.,]+)/im]);
    if (totalRevenue !== null && totalRevenue > 0) {
      metrics.push({ name: 'today_total_revenue', category: 'revenue', actual: totalRevenue, budget: null, variance: null, achievement: null, unit: 'currency' });
    }

    const totalWithServiceTax = this.extractNumberID(text, [/^TOTAL with Service & Tax\s+([\d.,]+)/im]);
    if (totalWithServiceTax !== null && totalWithServiceTax > 0) {
      metrics.push({ name: 'today_total_revenue_with_tax', category: 'revenue', actual: totalWithServiceTax, budget: null, variance: null, achievement: null, unit: 'currency' });
    }

    // ── Food Covers / Average Check ──
    const foodCovers = this.extractNumberID(text, [/^FOOD COVERS\s+([\d.,]+)/im]);
    if (foodCovers !== null) {
      metrics.push({ name: 'today_food_covers', category: 'traffic', actual: foodCovers, budget: null, variance: null, achievement: null, unit: 'number' });
    }

    const avgCheck = this.extractNumberID(text, [/^AVERAGE CHECK\s+([\d.,]+)/im]);
    if (avgCheck !== null && avgCheck > 0) {
      metrics.push({ name: 'today_average_check', category: 'revenue', actual: avgCheck, budget: null, variance: null, achievement: null, unit: 'currency' });
    }

    // ── Payment methods ──
    const cash = this.extractNumberID(text, [/^CASH\s+([\d.,]+)/im]);
    if (cash !== null && cash > 0) {
      metrics.push({ name: 'today_payment_cash', category: 'revenue', actual: cash, budget: null, variance: null, achievement: null, unit: 'currency' });
    }
    const creditCard = this.extractNumberID(text, [/^CREDIT CARD\s+([\d.,]+)/im]);
    if (creditCard !== null && creditCard > 0) {
      metrics.push({ name: 'today_payment_credit_card', category: 'revenue', actual: creditCard, budget: null, variance: null, achievement: null, unit: 'currency' });
    }
    const cityLedger = this.extractNumberID(text, [/^CITY LEDGER\s+([\d.,]+)/im]);
    if (cityLedger !== null && cityLedger > 0) {
      metrics.push({ name: 'today_payment_city_ledger', category: 'revenue', actual: cityLedger, budget: null, variance: null, achievement: null, unit: 'currency' });
    }

    if (metrics.length === 0) {
      warnings.push('Tidak ada metric golf yang berhasil diparsing');
    }

    return this.createResult(metrics, date, warnings);
  }

  // ── Date extraction ──
  private extractGolfDate(text: string): string | null {
    const monthMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', des: '12',
    };

    // Multi-period format: "Date :\t31-Aug-2026" (tab-separated, on its own line)
    const dateLineMatch = text.match(/^Date\s*:\s*(\d{1,2})-(\w{3})-(\d{4})/im);
    if (dateLineMatch) {
      const day = dateLineMatch[1];
      const monthStr = dateLineMatch[2].toLowerCase();
      const year = dateLineMatch[3];
      const monthNum = monthMap[monthStr];
      if (monthNum) {
        return `${year}-${monthNum}-${day.padStart(2, '0')}`;
      }
    }

    // Single-period format: "Print Date : 1-Jun-2026"
    const printDateMatch = text.match(/Print\s+Date\s*:\s*(\d{1,2})-(\w{3})-(\d{4})/i);
    if (printDateMatch) {
      const day = printDateMatch[1];
      const monthStr = printDateMatch[2].toLowerCase();
      const year = printDateMatch[3];
      const monthNum = monthMap[monthStr];
      if (monthNum) {
        return `${year}-${monthNum}-${day.padStart(2, '0')}`;
      }
    }

    return this.extractDate(text);
  }
}
