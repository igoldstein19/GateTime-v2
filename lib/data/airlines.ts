import type { Airline } from '../types'

export const AIRLINES: Airline[] = [
  // Terminal A
  { id: 'al-dl',  name: 'Delta',                  code: 'DL', terminalId: 'term-a', terminalCode: 'A', isInternational: false, displayOrder: 1 },
  // Terminal B
  { id: 'al-aa',  name: 'American Airlines',       code: 'AA', terminalId: 'term-b', terminalCode: 'B', isInternational: false, displayOrder: 2 },
  { id: 'al-ua',  name: 'United',                  code: 'UA', terminalId: 'term-b', terminalCode: 'B', isInternational: false, displayOrder: 3 },
  { id: 'al-ac',  name: 'Air Canada',              code: 'AC', terminalId: 'term-b', terminalCode: 'B', isInternational: false, displayOrder: 4 },
  { id: 'al-wn',  name: 'Southwest',               code: 'WN', terminalId: 'term-b', terminalCode: 'B', isInternational: false, displayOrder: 5 },
  { id: 'al-nk',  name: 'Spirit',                  code: 'NK', terminalId: 'term-b', terminalCode: 'B', isInternational: false, displayOrder: 6 },
  { id: 'al-f9',  name: 'Frontier',                code: 'F9', terminalId: 'term-b', terminalCode: 'B', isInternational: false, displayOrder: 7 },
  // Terminal C
  { id: 'al-b6d', name: 'JetBlue',                 code: 'B6', terminalId: 'term-c', terminalCode: 'C', isInternational: false, displayOrder: 8 },
  { id: 'al-9k',  name: 'Cape Air',                code: '9K', terminalId: 'term-c', terminalCode: 'C', isInternational: false, displayOrder: 9 },
  // Terminal E (International)
  { id: 'al-b6i', name: 'JetBlue (International)', code: 'B6', terminalId: 'term-e', terminalCode: 'E', isInternational: true,  displayOrder: 10 },
  { id: 'al-ba',  name: 'British Airways',         code: 'BA', terminalId: 'term-e', terminalCode: 'E', isInternational: true,  displayOrder: 11 },
  { id: 'al-ek',  name: 'Emirates',                code: 'EK', terminalId: 'term-e', terminalCode: 'E', isInternational: true,  displayOrder: 12 },
  { id: 'al-ei',  name: 'Aer Lingus',              code: 'EI', terminalId: 'term-e', terminalCode: 'E', isInternational: true,  displayOrder: 13 },
  { id: 'al-tp',  name: 'TAP Air Portugal',        code: 'TP', terminalId: 'term-e', terminalCode: 'E', isInternational: true,  displayOrder: 14 },
  { id: 'al-ib',  name: 'Iberia',                  code: 'IB', terminalId: 'term-e', terminalCode: 'E', isInternational: true,  displayOrder: 15 },
  { id: 'al-la',  name: 'LATAM',                   code: 'LA', terminalId: 'term-e', terminalCode: 'E', isInternational: true,  displayOrder: 16 },
  { id: 'al-lh',  name: 'Lufthansa',               code: 'LH', terminalId: 'term-e', terminalCode: 'E', isInternational: true,  displayOrder: 17 },
  { id: 'al-tk',  name: 'Turkish Airlines',        code: 'TK', terminalId: 'term-e', terminalCode: 'E', isInternational: true,  displayOrder: 18 },
  { id: 'al-cm',  name: 'Copa Airlines',           code: 'CM', terminalId: 'term-e', terminalCode: 'E', isInternational: true,  displayOrder: 19 },
]

export function getAirlineById(id: string) {
  return AIRLINES.find(a => a.id === id)
}

export function getAirlinesForTerminal(terminalId: string) {
  return AIRLINES.filter(a => a.terminalId === terminalId)
}

export const DOMESTIC_AIRLINES = AIRLINES.filter(a => !a.isInternational)
export const INTERNATIONAL_AIRLINES = AIRLINES.filter(a => a.isInternational)
