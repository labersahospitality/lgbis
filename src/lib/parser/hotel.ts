import { BaseParser, ParserConfig, ParserResult } from './base';
import type { ParsedMetric } from '../types';

export class HotelParser extends BaseParser {
  constructor(config: ParserConfig) {
    super(config);
  }

  parse(text: string): ParserResult {
    const date = this.extractDate(text);
    const metrics: ParsedMetric[] = [];
    const warnings: string[] = [];

    // Normalize text
    const lines = text.split('\n').map((l) => l.toLowerCase().trim());

    // Extract Occupancy
    const occupancy = this.extractPercent(text, [
      /occupancy\s*[:.]?\s*(\d+[\.,]?\d*)\s*%?/i,
      /occ\s*[:.]?\s*(\d+[\.,]?\d*)\s*%?/i,
      /okupansi\s*[:.]?\s*(\d+[\.,]?\d*)\s*%?/i,
    ]);
    if (occupancy !== null) {
      const budgetOcc = this.extractPercent(text, [
        /occupancy\s*budget\s*[:.]?\s*(\d+[\.,]?\d*)\s*%?/i,
        /budget\s*occupancy\s*[:.]?\s*(\d+[\.,]?\d*)\s*%?/i,
      ]);
      metrics.push({
        name: 'occupancy',
        category: 'room',
        actual: occupancy,
        budget: budgetOcc,
        variance: this.calculateVariance(occupancy, budgetOcc),
        achievement: this.calculateAchievement(occupancy, budgetOcc),
        unit: 'percent',
      });
    }

    // Extract Room Sold
    const roomSold = this.extractNumber(text, [
      /room\s*sold\s*[:.]?\s*([\d.,]+)/i,
      /kamar\s*terjual\s*[:.]?\s*([\d.,]+)/i,
    ]);
    if (roomSold !== null) {
      metrics.push({
        name: 'room_sold',
        category: 'room',
        actual: roomSold,
        budget: null,
        variance: null,
        achievement: null,
        unit: 'number',
      });
    }

    // Extract ARR
    const arr = this.extractNumber(text, [
      /(?:arr|average\s*room\s*rate)\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
    ]);
    if (arr !== null) {
      const budgetArr = this.extractNumber(text, [
        /(?:arr|average\s*room\s*rate)\s*budget\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
        /budget\s*(?:arr|average\s*room\s*rate)\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      ]);
      metrics.push({
        name: 'arr',
        category: 'room',
        actual: arr,
        budget: budgetArr,
        variance: this.calculateVariance(arr, budgetArr),
        achievement: this.calculateAchievement(arr, budgetArr),
        unit: 'currency',
      });
    }

    // Extract Room Revenue
    const roomRevenue = this.extractNumber(text, [
      /room\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      /revenue\s*room\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
    ]);
    if (roomRevenue !== null) {
      metrics.push({
        name: 'room_revenue',
        category: 'revenue',
        actual: roomRevenue,
        budget: null,
        variance: null,
        achievement: null,
        unit: 'currency',
      });
    }

    // Extract F&B Revenue
    const fbRevenue = this.extractNumber(text, [
      /(?:f&?b|food\s*&?\s*beverage)\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      /revenue\s*(?:f&?b|food\s*&?\s*beverage)\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      /fb\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
    ]);
    if (fbRevenue !== null) {
      metrics.push({
        name: 'fb_revenue',
        category: 'revenue',
        actual: fbRevenue,
        budget: null,
        variance: null,
        achievement: null,
        unit: 'currency',
      });
    }

    // Extract Other Revenue
    const otherRevenue = this.extractNumber(text, [
      /other\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      /revenue\s*lain\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
    ]);
    if (otherRevenue !== null) {
      metrics.push({
        name: 'other_revenue',
        category: 'revenue',
        actual: otherRevenue,
        budget: null,
        variance: null,
        achievement: null,
        unit: 'currency',
      });
    }

    // Extract Total Revenue
    const totalRevenue = this.extractNumber(text, [
      /total\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      /total\s*pendapatan\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
    ]);
    if (totalRevenue !== null) {
      const budgetRevenue = this.extractNumber(text, [
        /budget\s*revenue\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
        /revenue\s*budget\s*[:.]?\s*(?:rp\.?\s*)?([\d.,]+)/i,
      ]);
      metrics.push({
        name: 'total_revenue',
        category: 'revenue',
        actual: totalRevenue,
        budget: budgetRevenue,
        variance: this.calculateVariance(totalRevenue, budgetRevenue),
        achievement: this.calculateAchievement(totalRevenue, budgetRevenue),
        unit: 'currency',
      });
    }

    // Check minimum required metrics
    if (metrics.length === 0) {
      warnings.push('Tidak ada metric hotel yang berhasil diparsing');
    }

    return this.createResult(metrics, date, warnings);
  }
}
