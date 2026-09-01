// ============================================================
// DEMO DATA - UNTUK PREVIEW UI SAJA
// Data ini BUKAN data nyata dari Supabase
// ============================================================

export const DEMO_KPI = {
  revenueToday: { value: 456000000, budget: 500000000, achievement: 91.2 },
  revenueMTD: { value: 12500000000, budget: 14000000000, achievement: 89.3 },
  revenueYTD: { value: 98000000000, budget: 110000000000, achievement: 89.1 },
  expenseToday: { value: 280000000, budget: 300000000, achievement: 93.3 },
  profitToday: { value: 176000000, budget: 200000000, achievement: 88.0 },
  varianceToday: { value: -44000000 },
  trend: { value: 5.2 },
};

export const DEMO_REVENUE_CHART = [
  { name: 'Jan', actual: 8500000000, budget: 9000000000 },
  { name: 'Feb', actual: 9200000000, budget: 9500000000 },
  { name: 'Mar', actual: 10100000000, budget: 10000000000 },
  { name: 'Apr', actual: 8800000000, budget: 9200000000 },
  { name: 'Mei', actual: 9500000000, budget: 9800000000 },
  { name: 'Jun', actual: 10500000000, budget: 10200000000 },
  { name: 'Jul', actual: 11200000000, budget: 11000000000 },
  { name: 'Agu', actual: 12500000000, budget: 14000000000 },
];

export const DEMO_DAILY_TREND = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}`,
  actual: Math.floor(300000000 + Math.random() * 300000000),
  budget: Math.floor(400000000 + Math.random() * 200000000),
}));

export const DEMO_DIVISION_REVENUE = [
  { name: 'Hotel', actual: 6800000000, budget: 7500000000 },
  { name: 'Waterpark', actual: 4200000000, budget: 5000000000 },
  { name: 'Golf', actual: 1500000000, budget: 1500000000 },
];

export const DEMO_UNIT_REVENUE = [
  { name: 'Hotel Pekanbaru', actual: 3200000000, budget: 3500000000 },
  { name: 'Hotel Toba', actual: 2100000000, budget: 2200000000 },
  { name: 'Hotel Samosir', actual: 1500000000, budget: 1800000000 },
  { name: 'WP HTN', actual: 1500000000, budget: 1800000000 },
  { name: 'WP RIFAN', actual: 1200000000, budget: 1400000000 },
  { name: 'WP TOFAN', actual: 900000000, budget: 1000000000 },
  { name: 'WP SIFAN', actual: 600000000, budget: 800000000 },
  { name: 'Labersa Golf', actual: 1500000000, budget: 1500000000 },
];

export const DEMO_HOTEL_PERFORMANCE = [
  {
    name: 'Hotel Pekanbaru',
    occupancy: 78.5,
    arr: 650000,
    roomRevenue: 1800000000,
    fbRevenue: 950000000,
    totalRevenue: 3200000000,
    budget: 3500000000,
    achievement: 91.4,
  },
  {
    name: 'Hotel Toba',
    occupancy: 65.2,
    arr: 520000,
    roomRevenue: 1200000000,
    fbRevenue: 650000000,
    totalRevenue: 2100000000,
    budget: 2200000000,
    achievement: 95.5,
  },
  {
    name: 'Hotel Samosir',
    occupancy: 58.3,
    arr: 480000,
    roomRevenue: 850000000,
    fbRevenue: 420000000,
    totalRevenue: 1500000000,
    budget: 1800000000,
    achievement: 83.3,
  },
];

export const DEMO_WATERPARK_PERFORMANCE = [
  {
    name: 'Waterpark HTN',
    visitorToday: 850,
    visitorMTD: 25000,
    visitorYTD: 180000,
    revenueToday: 42500000,
    revenueMTD: 1250000000,
    budget: 1800000000,
    achievement: 69.4,
  },
  {
    name: 'Waterpark RIFAN',
    visitorToday: 720,
    visitorMTD: 21000,
    visitorYTD: 155000,
    revenueToday: 36000000,
    revenueMTD: 1050000000,
    budget: 1400000000,
    achievement: 75.0,
  },
  {
    name: 'Waterpark TOFAN',
    visitorToday: 580,
    visitorMTD: 17000,
    visitorYTD: 120000,
    revenueToday: 29000000,
    revenueMTD: 850000000,
    budget: 1000000000,
    achievement: 85.0,
  },
  {
    name: 'Waterpark SIFAN',
    visitorToday: 420,
    visitorMTD: 12500,
    visitorYTD: 90000,
    revenueToday: 21000000,
    revenueMTD: 625000000,
    budget: 800000000,
    achievement: 78.1,
  },
];

export const DEMO_GOLF_PERFORMANCE = {
  name: 'Labersa Golf',
  totalPlayer: 45,
  playerMTD: 1250,
  playerYTD: 9800,
  revenueToday: 67500000,
  revenueMTD: 1875000000,
  revenueYTD: 14700000000,
  budget: 15000000000,
  achievement: 98.0,
};
