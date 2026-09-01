import { BaseParser, ParserConfig, ParserResult } from './base';
import type { ParsedMetric } from '../types';

export class GolfParser extends BaseParser {
  constructor(config: ParserConfig) {
    super(config);
  }

  parse(text: string): ParserResult {
    const date = this.extractDate(text);
    const metrics: ParsedMetric[] = [];
    const warnings: string[] = [];

    // Extract Player count
    const player = this.extractNumber(text, [
      /(?:total\s*)?player\s*[:.]?\s*([\d.,]+)/i,
      /jumlah\s*player\s*[:.]?\s*([\d.,]+)/i,
      /pemain\s*[:.]?\s*([\d.,]+)/i,
    ]);
    if (player !== null) {
      const budgetPlayer = this.extractNumber(text, [
        /player\s*budget\s*[:.]?\s*([\d.,]+)/i,
        /budget\s*player\s*[:.]?\s*([\d.,]+)/i,
      ]);
      metrics.push({
        name: 'total_player',
        category: 'traffic',
        actual: player,
        budget: budgetPlayer,
        variance: this.calculateVariance(player, budgetPlayer),
        achievement: this.calculateAchievement(player, budgetPlayer),
        unit: 'number',
      });
    }

    // Extract Revenue
    const revenue = this.extractNumber(text, [
      /revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      /pendapatan\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      /total\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
    ]);
    if (revenue !== null) {
      const budgetRevenue = this.extractNumber(text, [
        /revenue\s*budget\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
        /budget\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
        /budget\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      ]);
      metrics.push({
        name: 'revenue',
        category: 'revenue',
        actual: revenue,
        budget: budgetRevenue,
        variance: this.calculateVariance(revenue, budgetRevenue),
        achievement: this.calculateAchievement(revenue, budgetRevenue),
        unit: 'currency',
      });
    }

    // MTD data
    const mtdPlayer = this.extractNumber(text, [
      /player\s*mtd\s*[:.]?\s*([\d.,]+)/i,
      /mtd\s*player\s*[:.]?\s*([\d.,]+)/i,
    ]);
    if (mtdPlayer !== null) {
      metrics.push({
        name: 'player_mtd',
        category: 'traffic',
        actual: mtdPlayer,
        budget: null,
        variance: null,
        achievement: null,
        unit: 'number',
      });
    }

    const mtdRevenue = this.extractNumber(text, [
      /revenue\s*mtd\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      /mtd\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
    ]);
    if (mtdRevenue !== null) {
      metrics.push({
        name: 'revenue_mtd',
        category: 'revenue',
        actual: mtdRevenue,
        budget: null,
        variance: null,
        achievement: null,
        unit: 'currency',
      });
    }

    if (metrics.length === 0) {
      warnings.push('Tidak ada metric golf yang berhasil diparsing');
    }

    return this.createResult(metrics, date, warnings);
  }
}
