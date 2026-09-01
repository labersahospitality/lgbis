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

    // Extract Visitor
    const visitor = this.extractNumber(text, [
      /visitor\s*[:.]?\s*([\d.,]+)/i,
      /pengunjung\s*[:.]?\s*([\d.,]+)/i,
      /jumlah\s*visitor\s*[:.]?\s*([\d.,]+)/i,
      /total\s*visitor\s*[:.]?\s*([\d.,]+)/i,
    ]);
    if (visitor !== null) {
      const budgetVisitor = this.extractNumber(text, [
        /visitor\s*budget\s*[:.]?\s*([\d.,]+)/i,
        /budget\s*visitor\s*[:.]?\s*([\d.,]+)/i,
      ]);
      metrics.push({
        name: 'visitor',
        category: 'traffic',
        actual: visitor,
        budget: budgetVisitor,
        variance: this.calculateVariance(visitor, budgetVisitor),
        achievement: this.calculateAchievement(visitor, budgetVisitor),
        unit: 'number',
      });
    }

    // Extract Revenue
    const revenue = this.extractNumber(text, [
      /revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      /pendapatan\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      /total\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      /total\s*pendapatan\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
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

    // Extract MTD specific data
    const mtdVisitor = this.extractNumber(text, [
      /visitor\s*mtd\s*[:.]?\s*([\d.,]+)/i,
      /mtd\s*visitor\s*[:.]?\s*([\d.,]+)/i,
    ]);
    if (mtdVisitor !== null) {
      metrics.push({
        name: 'visitor_mtd',
        category: 'traffic',
        actual: mtdVisitor,
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
      warnings.push('Tidak ada metric waterpark yang berhasil diparsing');
    }

    return this.createResult(metrics, date, warnings);
  }
}
