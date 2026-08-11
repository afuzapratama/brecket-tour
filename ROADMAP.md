# Roadmap Fase Pengembangan

Roadmap ini membagi pembangunan sistem group dan bracket esport menjadi beberapa fase yang jelas. Tujuannya agar setiap fase punya hasil yang bisa diuji, bukan langsung membangun semuanya sekaligus.

## Fase 0 - Fondasi Project

Status: selesai untuk baseline awal.

### Tujuan

Menyiapkan project agar siap dikembangkan dengan stack utama.

### Output

- Next.js App Router berjalan.
- TypeScript aktif.
- Tailwind CSS aktif.
- Struktur folder awal rapi.
- Env config siap.
- Git repository siap.

### Fitur

- Setup Next.js.
- Setup Tailwind.
- Setup shadcn/ui.
- Setup lucide-react.
- Setup Prisma.
- Setup Supabase env.
- Layout dasar admin dan public.

### Selesai Jika

- App bisa dijalankan lokal. Selesai.
- Halaman public awal muncul. Selesai.
- Halaman admin awal muncul. Selesai.
- Prisma baseline sudah siap. Koneksi database asli masuk Fase 1 setelah Supabase project/env tersedia.

## Fase 1 - Database & Auth

Status: database migration Supabase, login admin, logout, dan proteksi route admin selesai.

### Tujuan

Membangun struktur data utama dan sistem login admin.

### Output

- Schema database awal.
- Migration Prisma.
- Auth admin.
- Role dasar.

### Fitur

- Tabel users.
- Tabel tournaments.
- Tabel teams.
- Tabel players.
- Tabel tournament_participants.
- Login admin via Supabase Auth.
- Proteksi route admin.
- Role `super_admin` dan `admin`.

### Selesai Jika

- Admin bisa login. Selesai via Supabase Auth email/password.
- Route admin tidak bisa dibuka tanpa login. Selesai via Next proxy.
- Database migration berhasil. Selesai.
- Data user/admin bisa dikenali dari session. Selesai.
- Schema users, roles, tournament, teams, groups, matches, standings, bracket sudah siap.
- Seed demo tournament sudah masuk Supabase.

## Fase 2 - Tournament & Team Management

Status: model database, seed data, database read UI, tournament edit, dan team participant add/remove selesai.

### Tujuan

Admin bisa membuat turnamen dan mengelola tim peserta.

### Output

- CRUD tournament.
- CRUD team.
- Assign team ke tournament.
- Upload logo/banner dasar.

### Fitur

- Create/edit/delete tournament.
- Status tournament: `draft`, `published`, `live`, `completed`.
- Create/edit/delete team.
- Upload team logo.
- Upload tournament banner.
- Add team participant ke tournament.
- Set seed peserta.

### Selesai Jika

- Admin bisa membuat turnamen baru. Pending multi-tournament create page.
- Admin bisa mengedit turnamen utama. Selesai.
- Admin bisa menambahkan tim ke turnamen. Selesai.
- Admin bisa melepas tim dari turnamen. Selesai.
- Public page bisa menampilkan detail turnamen dan daftar tim. Selesai via database.

## Fase 3 - Group Stage

Status: model group, create/delete group, participant assignment, seed group, dan standings dari database selesai.

### Tujuan

Admin bisa membuat group dan mengatur peserta di dalam group.

### Output

- Group management.
- Assign peserta ke group.
- Generator group awal.

### Fitur

- Create/edit/delete group.
- Set nama group, contoh Group A, Group B.
- Set top qualify count per group.
- Assign peserta manual ke group.
- Auto distribute peserta berdasarkan seed.
- Tampilan group di admin.
- Tampilan group di public page.

### Selesai Jika

- Admin bisa membuat beberapa group. Selesai.
- Admin bisa delete group. Selesai.
- Peserta bisa masuk ke group. Selesai via admin assignment.
- Peserta bisa dilepas dari group. Selesai.
- Public page bisa menampilkan daftar group dan timnya. Selesai via database.

## Fase 4 - Match Generation & Result Update

Status: round robin generator, generate group matches action, match result model, seed match database, dan update result form selesai.

### Tujuan

Sistem bisa membuat match group stage dan admin bisa update hasil match.

### Output

- Round robin match generator.
- Match result form.
- Match list admin.
- Match list public.

### Fitur

- Generate match round robin per group.
- Match status: `scheduled`, `live`, `completed`, `cancelled`.
- Input score match.
- Input winner.
- Input map/game score dasar.
- Lock result.
- Schedule match.
- Stream URL optional.

### Selesai Jika

- Admin bisa generate match dari group. Selesai via admin action.
- Admin bisa update hasil match. Selesai via admin form.
- Public page bisa melihat jadwal dan hasil match. Selesai via database.

## Fase 5 - Standings & Scoring Engine

Status: calculator standings, scoring config, tiebreaker dasar, dan standings snapshot database selesai.

### Tujuan

Standing group dihitung otomatis setiap hasil match berubah.

### Output

- Standings calculator.
- Scoring config.
- Tiebreaker dasar.
- Realtime-ready data snapshot.

### Fitur

- Hitung played, win, draw, lost.
- Hitung points.
- Hitung map win/loss/diff.
- Hitung kills/deaths/KD jika data tersedia.
- Default scoring: win 3, draw 1, lose 0.
- Tiebreaker: points, wins, map diff, kill diff, total kills.
- Simpan standings snapshot.
- Tombol recalculate standings.

### Selesai Jika

- Setelah admin update hasil match, standings berubah otomatis. Selesai via recalculate standings action.
- Ranking group sesuai rule. Selesai.
- Public page menampilkan standings rapi. Selesai via database.

## Fase 6 - Playoff Single Elimination

Status: single elimination generator, generate playoff action, bracket seed database, bracket result update, winner advance, dan bracket preview selesai.

### Tujuan

Admin bisa generate bracket eliminasi dari hasil group stage.

### Output

- Single elimination bracket.
- Qualifier mapping.
- Winner advance otomatis.

### Fitur

- Generate playoff dari top N group.
- Mapping otomatis, contoh A1 vs B2.
- Admin bisa override seed sebelum generate.
- Update hasil playoff match.
- Winner lanjut ke round berikutnya.
- Bracket viewer di public page.
- Bracket editor dasar di admin.

### Selesai Jika

- Group selesai bisa menghasilkan playoff bracket. Selesai via admin action.
- Admin bisa update hasil bracket. Selesai.
- Winner maju otomatis sampai final. Selesai untuk single elimination.

## Fase 7 - Realtime Live Update

Status: Supabase realtime publication, public live subscription, dan auto refresh selesai.

### Tujuan

Perubahan admin langsung terlihat di public page tanpa refresh manual.

### Output

- Supabase realtime subscription.
- Live match update.
- Live standings update.
- Live bracket update.

### Fitur

- Subscribe ke match changes.
- Subscribe ke standings snapshot.
- Subscribe ke bracket changes.
- Public page refresh state otomatis.
- Status live badge.
- Optimistic admin update optional.

### Selesai Jika

- Admin update skor. Selesai.
- Public page berubah otomatis dalam beberapa detik. Selesai via Supabase realtime + router refresh.
- Tidak perlu reload browser untuk melihat perubahan. Selesai.

## Fase 8 - Gaming UI Polish

Status: baseline gaming theme polish, public tournament hub, status styling, standings highlight, bracket card polish, dan admin control room polish selesai.

### Tujuan

Membuat tampilan public dan admin terasa seperti platform esport profesional.

### Output

- Tema gaming final untuk MVP.
- Responsive desktop/mobile.
- UI readable dan padat.

### Fitur

- Dark theme.
- Neon accent secukupnya.
- Team logo prominent.
- Group table high contrast.
- Bracket lines jelas.
- Match card dengan status.
- Empty state.
- Loading state.
- Error state.
- Mobile layout.

### Selesai Jika

- Public page terlihat siap dipakai event. Selesai untuk baseline MVP.
- Admin panel nyaman dipakai untuk update cepat. Selesai untuk baseline MVP.
- Tidak ada text overlap di mobile dan desktop. Baseline responsive selesai, perlu visual QA tambahan di Fase 9.

## Fase 9 - Quality, Audit, dan Release MVP

### Tujuan

Menstabilkan sistem sebelum dipakai event asli.

### Output

- Test dasar.
- Seed data demo.
- Audit log awal.
- Deployment MVP.

### Fitur

- Test standings calculator.
- Test bracket advance.
- Test auth protection.
- Audit log untuk update match.
- Seed demo tournament.
- Deployment ke Vercel.
- Supabase production config.

### Selesai Jika

- MVP bisa dipakai dari create tournament sampai champion.
- Admin action penting tercatat.
- App online dan bisa dibuka publik.

## Fase 10 - Advanced Tournament Features

### Tujuan

Menambahkan fitur lanjutan setelah MVP stabil.

### Output

- Format turnamen lebih lengkap.
- Preset per game.
- Tools organizer lebih kuat.

### Fitur

- Double elimination.
- Third place match.
- Advanced tiebreaker UI.
- Game presets: Valorant, MLBB, PUBG/Free Fire.
- CSV import/export.
- Spoiler-free mode.
- Match dispute.
- VOD links.
- Multi-admin permission.
- Public team profile.
- Bracket embed.

### Selesai Jika

- Sistem tidak hanya cocok untuk satu format.
- Organizer bisa menyesuaikan rule tanpa edit code.

## Urutan Prioritas MVP

Prioritas wajib:

1. Fase 0 - Fondasi Project.
2. Fase 1 - Database & Auth.
3. Fase 2 - Tournament & Team Management.
4. Fase 3 - Group Stage.
5. Fase 4 - Match Generation & Result Update.
6. Fase 5 - Standings & Scoring Engine.
7. Fase 6 - Playoff Single Elimination.
8. Fase 7 - Realtime Live Update.
9. Fase 8 - Gaming UI Polish.
10. Fase 9 - Quality, Audit, dan Release MVP.

Fase 10 dikerjakan setelah MVP sudah bisa dipakai untuk turnamen nyata.
