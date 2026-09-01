import type { DivisionCode, ParsedMetric, ParsedReportData } from '../types';

export interface ParserConfig {
  division: DivisionCode;
  unitCode: string;
  unitName: string;
}

export interface ParserResult {
  success: boolean;
  data: ParsedReportData;
  errors: string[];
  warnings: string[];
}

export abstract class BaseParser {
  protected config: ParserConfig;

  constructor(config: ParserConfig) {
    this.config = config;
  }

  abstract parse(text: string): ParserResult;

  protected extractDate(text: string): string | null {
    const patterns = [
      /date\s*[:.]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
      /tanggal\s*[:.]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }
    }

    return null;
  }

  protected extractNumber(text: string, patterns: RegExp[]): number | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const cleaned = match[1].replace(/[.,\s]/g, '');
        const num = parseFloat(cleaned);
        if (!isNaN(num)) return num;
      }
    }
    return null;
  }

  protected extractPercent(text: string, patterns: RegExp[]): number | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const num = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(num)) return num;
      }
    }
    return null;
  }

  protected calculateVariance(actual: number | null, budget: number | null): number | null {
    if (actual === null || budget === null) return null;
    return actual - budget;
  }

  protected calculateAchievement(actual: number | null, budget: number | null): number | null {
    if (actual === null || budget === null || budget === 0) return null;
    return (actual / budget) * 100;
  }

  protected createResult(
    metrics: ParsedMetric[],
    date: string | null,
    warnings: string[],
  ): ParserResult {
    const success = metrics.length > 0 && date !== null;

    if (!date) {
      warnings.push('Tanggal laporan tidak dikenali');
    }

    return {
      success,
      data: {
        unit_name: this.config.unitName,
        unit_code: this.config.unitCode,
        division_code: this.config.division,
        report_date: date || new Date().toISOString().split('T')[0],
        metrics,
        warnings,
        confidence: this.calculateConfidence(metrics, date),
      },
      errors: success ? [] : ['Parsing gagal - data tidak cukup'],
      warnings,
    };
  }

  protected calculateConfidence(metrics: ParsedMetric[], date: string | null): number {
    let score = 0;
    if (date) score += 30;
    if (metrics.length > 0) score += 20;
    if (metrics.length >= 3) score += 20;
    if (metrics.length >= 5) score += 15;
    if (metrics.some((m) => m.budget !== null)) score += 15;
    return Math.min(score, 100);
  }
}
