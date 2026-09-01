import type { DivisionCode } from '../types';
import { BaseParser, ParserConfig, ParserResult } from './base';
import { HotelParser } from './hotel';
import { WaterparkParser } from './waterpark';
import { GolfParser } from './golf';

export type { ParserResult, ParserConfig };

export function createParser(division: DivisionCode, unitCode: string, unitName: string): BaseParser {
  const config: ParserConfig = { division, unitCode, unitName };

  switch (division) {
    case 'HOTEL':
      return new HotelParser(config);
    case 'WATERPARK':
      return new WaterparkParser(config);
    case 'GOLF':
      return new GolfParser(config);
    default:
      throw new Error(`Unknown division: ${division}`);
  }
}

export function parseReport(
  division: DivisionCode,
  unitCode: string,
  unitName: string,
  text: string,
): ParserResult {
  const parser = createParser(division, unitCode, unitName);
  return parser.parse(text);
}
