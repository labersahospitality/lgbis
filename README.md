# LGBIS - Labersa Group Business Intelligence System

Sistem dashboard management untuk memonitor kinerja seluruh unit bisnis Labersa Group.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **Icons**: Lucide React

## Struktur Unit Bisnis

### Hotel Division
- Labersa Hotel Pekanbaru
- Labersa Hotel Toba
- Labersa Hotel Samosir

### Waterpark Division
- Waterpark HTN
- Waterpark RIFAN
- Waterpark TOFAN
- Waterpark SIFAN

### Golf Division
- Labersa Golf

## Role User

| Role | Akses |
|------|-------|
| Super Admin | Kelola seluruh sistem, user, unit, konfigurasi, dashboard |
| Management | Lihat dashboard & analisis saja |
| Admin Input | Input laporan WhatsApp, parse, verify, save |
| Auditor | Read-only - data, laporan, history, dashboard |

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Buat project di [Supabase](https://supabase.com)
2. Jalankan SQL schema dari `supabase/schema.sql` di SQL Editor
3. Copy URL dan keys ke `.env.local`

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Buat Admin User

Di Supabase Dashboard > Authentication > Users, buat user pertama:

1. Sign up email pertama (admin@labersa.com)
2. Di SQL Editor, update role:

```sql
UPDATE users SET role = 'super_admin' WHERE email = 'admin@labersa.com';
```

### 5. Run Development

```bash
npm run dev
```

Buka http://localhost:3000

## Halaman Aplikasi

### Management (`/management`)
- `/management` - Dashboard utama group
- `/management/hotel` - Dashboard Hotel
- `/management/waterpark` - Dashboard Waterpark
- `/management/golf` - Dashboard Golf
- `/management/comparison` - Perbandingan unit
- `/management/reports` - Laporan
- `/management/analytics` - Analytics

### Admin (`/admin`)
- `/admin/input` - Input & parse laporan WhatsApp
- `/admin/history` - History input
- `/admin/reports` - Data reports
- `/admin/users` - User management (super admin)
- `/admin/units` - Unit management (super admin)
- `/admin/settings` - System settings (super admin)
- `/admin/audit` - Audit logs (super admin)

## Alur Data

```
WhatsApp Report
      ↓
Admin Copy/Paste
      ↓
Parser (modular per division)
      ↓
Preview Data
      ↓
Admin Verify
      ↓
Simpan ke Supabase
      ↓
Management Dashboard
```

## Parser

Parser bersifat modular dan dapat dikembangkan per divisi:

- `src/lib/parser/hotel.ts` - Parser Hotel
- `src/lib/parser/waterpark.ts` - Parser Waterpark
- `src/lib/parser/golf.ts` - Parser Golf
- `src/lib/parser/base.ts` - Base class

## Database Schema

Lihat `supabase/schema.sql` untuk struktur database lengkap:

- `divisions` - Divisi bisnis
- `business_units` - Unit bisnis
- `users` - User profiles
- `daily_reports` - Laporan harian
- `report_metrics` - Metric laporan
- `budgets` - Budget
- `report_imports` - Import history
- `audit_logs` - Audit logs

## Deploy

### Vercel

```bash
npm i -g vercel
vercel
```

### Netlify

Configure build settings:
- Build command: `npm run build`
- Output directory: `.next`

## Development Notes

- Saat ini menggunakan DEMO DATA untuk preview UI
- Dummy data ditandai dengan badge "DEMO" di setiap card
- Untuk production, hubungkan ke Supabase dan masukkan data nyata
- Parser harus dikonfigurasi dengan format WhatsApp yang sesungguhnya
