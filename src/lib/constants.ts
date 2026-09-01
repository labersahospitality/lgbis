import type { DivisionCode } from './types';

export const DIVISIONS = {
  HOTEL: { id: 'div-hotel', name: 'Hotel Division', code: 'HOTEL' as DivisionCode },
  WATERPARK: { id: 'div-waterpark', name: 'Waterpark Division', code: 'WATERPARK' as DivisionCode },
  GOLF: { id: 'div-golf', name: 'Golf Division', code: 'GOLF' as DivisionCode },
} as const;

export const BUSINESS_UNITS = {
  // Hotels
  HOTEL_PEKANBARU: {
    id: 'bu-hotel-pku',
    division_id: 'div-hotel',
    name: 'Labersa Hotel Pekanbaru',
    code: 'HOTEL_PKU',
  },
  HOTEL_TOBA: {
    id: 'bu-hotel-toba',
    division_id: 'div-hotel',
    name: 'Labersa Hotel Toba',
    code: 'HOTEL_TOBA',
  },
  HOTEL_SAMOSIR: {
    id: 'bu-hotel-samosir',
    division_id: 'div-hotel',
    name: 'Labersa Hotel Samosir',
    code: 'HOTEL_SAMOSIR',
  },
  // Waterparks
  WATERPARK_HTN: {
    id: 'bu-wp-htn',
    division_id: 'div-waterpark',
    name: 'Waterpark HTN',
    code: 'WP_HTN',
  },
  WATERPARK_RIFAN: {
    id: 'bu-wp-rifan',
    division_id: 'div-waterpark',
    name: 'Waterpark RIFAN',
    code: 'WP_RIFAN',
  },
  WATERPARK_TOFAN: {
    id: 'bu-wp-tofan',
    division_id: 'div-waterpark',
    name: 'Waterpark TOFAN',
    code: 'WP_TOFAN',
  },
  WATERPARK_SIFAN: {
    id: 'bu-wp-sifan',
    division_id: 'div-waterpark',
    name: 'Waterpark SIFAN',
    code: 'WP_SIFAN',
  },
  // Golf
  GOLF: {
    id: 'bu-golf',
    division_id: 'div-golf',
    name: 'Labersa Golf',
    code: 'GOLF',
  },
} as const;

export const BUSINESS_UNITS_ARRAY = Object.values(BUSINESS_UNITS);

export const HOTEL_UNITS = [
  BUSINESS_UNITS.HOTEL_PEKANBARU,
  BUSINESS_UNITS.HOTEL_TOBA,
  BUSINESS_UNITS.HOTEL_SAMOSIR,
];

export const WATERPARK_UNITS = [
  BUSINESS_UNITS.WATERPARK_HTN,
  BUSINESS_UNITS.WATERPARK_RIFAN,
  BUSINESS_UNITS.WATERPARK_TOFAN,
  BUSINESS_UNITS.WATERPARK_SIFAN,
];

export const GOLF_UNITS = [
  BUSINESS_UNITS.GOLF,
];

// Hotel metrics
export const HOTEL_METRICS = [
  'occupancy',
  'room_sold',
  'available_room',
  'arr',
  'room_revenue',
  'fb_revenue',
  'other_revenue',
  'total_revenue',
  'budget',
  'variance',
  'achievement',
] as const;

// Waterpark metrics
export const WATERPARK_METRICS = [
  'visitor',
  'revenue',
  'budget',
  'variance',
  'achievement',
] as const;

// Golf metrics
export const GOLF_METRICS = [
  'total_player',
  'revenue',
  'budget',
  'variance',
  'achievement',
] as const;

export const METRIC_LABELS: Record<string, string> = {
  occupancy: 'Occupancy',
  room_sold: 'Room Sold',
  available_room: 'Available Room',
  arr: 'ARR (Average Room Rate)',
  room_revenue: 'Room Revenue',
  fb_revenue: 'F&B Revenue',
  other_revenue: 'Other Revenue',
  total_revenue: 'Total Revenue',
  budget: 'Budget',
  variance: 'Variance',
  achievement: 'Achievement %',
  visitor: 'Visitor',
  revenue: 'Revenue',
  total_player: 'Total Player',
};

export const METRIC_FORMATS: Record<string, 'currency' | 'percent' | 'number'> = {
  occupancy: 'percent',
  room_sold: 'number',
  available_room: 'number',
  arr: 'currency',
  room_revenue: 'currency',
  fb_revenue: 'currency',
  other_revenue: 'currency',
  total_revenue: 'currency',
  budget: 'currency',
  variance: 'currency',
  achievement: 'percent',
  visitor: 'number',
  revenue: 'currency',
  total_player: 'number',
};

export const NAVIGATION = {
  management: [
    { label: 'Dashboard Utama', href: '/management', icon: 'LayoutDashboard' },
    { label: 'Hotel', href: '/management/hotel', icon: 'Hotel' },
    { label: 'Waterpark', href: '/management/waterpark', icon: 'Waves' },
    { label: 'Golf', href: '/management/golf', icon: 'Flag' },
    { label: 'Perbandingan', href: '/management/comparison', icon: 'BarChart3' },
    { label: 'Laporan', href: '/management/reports', icon: 'FileText' },
    { label: 'Analytics', href: '/management/analytics', icon: 'TrendingUp' },
  ],
  admin: [
    { label: 'Input Laporan', href: '/admin/input', icon: 'ClipboardEdit' },
    { label: 'History Input', href: '/admin/history', icon: 'History' },
    { label: 'Data Reports', href: '/admin/reports', icon: 'Database' },
  ],
  superAdmin: [
    { label: 'Users', href: '/admin/users', icon: 'Users' },
    { label: 'Units', href: '/admin/units', icon: 'Building2' },
    { label: 'System Settings', href: '/admin/settings', icon: 'Settings' },
    { label: 'Audit Logs', href: '/admin/audit', icon: 'Shield' },
  ],
};
