# Blueprint Sistem Group & Bracket Esport

Roadmap fase pengembangan ada di [ROADMAP.md](./ROADMAP.md).

## Tujuan

Membangun sistem turnamen esport dengan alur:

1. Admin membuat turnamen.
2. Admin menambahkan tim dan roster.
3. Admin membagi tim ke group.
4. Sistem membuat match group stage.
5. Admin update hasil match.
6. Standings group diperbarui otomatis dan realtime.
7. Admin generate babak eliminasi dari ranking group.
8. Public page menampilkan tournament info, group, match, standings, dan bracket seperti Liquipedia dengan tema gaming.

## Stack Rekomendasi

### Frontend & Backend

Gunakan **Next.js App Router + TypeScript**.

Alasan:

- Satu project bisa menangani public page, admin panel, API route, dan server actions.
- Cocok untuk halaman informatif seperti Liquipedia sekaligus dashboard admin.
- SEO bagus untuk halaman tournament/team/match.
- Mudah dideploy ke Vercel atau hosting Node modern.

### Database & Realtime

Gunakan **Supabase Postgres**.

Alasan:

- Postgres kuat untuk data relasional seperti tournament, team, match, standing, bracket.
- Supabase punya auth, storage logo/banner, realtime subscription, dan row level security.
- Admin update bisa langsung muncul di public page lewat realtime.

### ORM

Gunakan **Prisma**.

Alasan:

- Schema database jelas dan versioned.
- Query type-safe.
- Enak untuk migration dan seed data.

### UI

Gunakan:

- **Tailwind CSS** untuk styling.
- **shadcn/ui** untuk komponen dashboard/admin.
- **lucide-react** untuk icon.
- **react-hook-form + zod** untuk form admin dan validasi.

### Bracket Visualization

Untuk MVP:

- Buat bracket renderer sendiri dengan React component dan CSS grid/flex.

Untuk fase lanjut:

- Bisa evaluasi library bracket jika butuh double elimination kompleks.
- Core bracket logic tetap sebaiknya milik sistem sendiri agar format bisa disesuaikan.

### Auth

Gunakan **Supabase Auth**.

Role awal:

- `super_admin`
- `admin`
- `viewer`

### Deployment

Rekomendasi:

- App: **Vercel**
- Database/storage/realtime/auth: **Supabase**

Alternatif self-host:

- App: VPS Node.js
- Database: PostgreSQL
- Realtime: Socket.IO atau polling

## Prinsip Sistem

Sistem tidak boleh hardcode hanya untuk satu game.

Turnamen harus punya konfigurasi:

- Format group stage.
- Format playoff.
- Jumlah tim lolos per group.
- Scoring rule.
- Tiebreaker rule.
- Match format: BO1, BO3, BO5.
- Statistik tambahan: kills, deaths, map score, round score, placement points.

## Modul Utama

### 1. Tournament Management

Fitur:

- Create/edit/delete tournament.
- Upload banner/logo.
- Set game title.
- Set status: `draft`, `published`, `live`, `completed`, `archived`.
- Set visibility public/private.
- Set rules text.

Data utama:

- Nama turnamen.
- Slug URL.
- Game.
- Region.
- Start date.
- End date.
- Prize pool optional.
- Organizer optional.

### 2. Team & Participant Management

Fitur:

- Add team.
- Upload logo.
- Set team tag.
- Add roster/player.
- Set seed.
- Assign ke tournament.
- Assign ke group.

Catatan:

- `team` bisa reusable antar turnamen.
- `participant` adalah team yang ikut di turnamen tertentu.

### 3. Group Stage

Format MVP:

- Round Robin.

Fitur:

- Create group manual.
- Auto distribute teams by seed.
- Generate group matches.
- Set teams per group.
- Set top N qualify.
- Lock group setelah selesai.

Standing otomatis menghitung:

- Played.
- Win.
- Draw optional.
- Lost.
- Points.
- Match win rate.
- Kills.
- Deaths.
- KD ratio.
- Kill differential.
- Map wins.
- Map losses.
- Map differential.

### 4. Match Management

Fitur:

- Schedule match.
- Assign stream link.
- Assign caster optional.
- Input score.
- Input map/game result.
- Input kills/deaths/stat tambahan.
- Set status: `scheduled`, `live`, `completed`, `disputed`, `cancelled`.
- Lock result.

Match scope:

- Group stage match.
- Playoff match.
- Tiebreaker match.

### 5. Scoring Engine

Scoring harus configurable per tournament.

Default rule:

- Win: 3 points.
- Draw: 1 point.
- Lose: 0 points.

Optional rule:

- Map win bonus.
- Kill point.
- Placement point.
- Penalty point.

Contoh config:

```json
{
  "winPoints": 3,
  "drawPoints": 1,
  "lossPoints": 0,
  "useKillPoints": false,
  "killPointValue": 0,
  "useMapBonus": false,
  "mapWinPointValue": 0
}
```

### 6. Tiebreaker Engine

Default urutan tiebreaker:

1. Points.
2. Wins.
3. Head-to-head.
4. Map differential.
5. Kill differential.
6. Total kills.
7. Manual admin order.

Tiebreaker harus disimpan sebagai config agar bisa diubah per tournament.

Contoh config:

```json
[
  "points",
  "wins",
  "head_to_head",
  "map_diff",
  "kill_diff",
  "total_kills",
  "manual_seed"
]
```

### 7. Playoff / Elimination Bracket

Format MVP:

- Single elimination.

Format fase lanjut:

- Double elimination.
- Third place match.
- Lower bracket.
- Grand final reset optional.

Fitur:

- Generate playoff dari group standings.
- Mapping otomatis qualifier.
- Admin bisa override seed.
- Update hasil match.
- Winner lanjut otomatis ke round berikutnya.
- Bracket realtime update di public page.

Default mapping 2 group:

- A1 vs B2.
- B1 vs A2.

Default mapping 4 group:

- A1 vs D2.
- B1 vs C2.
- C1 vs B2.
- D1 vs A2.

### 8. Public Tournament Page

Tabs:

- Overview.
- Groups.
- Matches.
- Playoffs.
- Teams.
- Rules.

Komponen:

- Tournament header.
- Live status badge.
- Countdown/start time.
- Group standings table.
- Match cards.
- Bracket viewer.
- Team logo grid.
- Recent results.

Style:

- Dark gaming interface.
- Neon accent secukupnya.
- High contrast table.
- Logo team menonjol.
- Bracket lines jelas.
- Status live terlihat.
- Tetap readable di mobile.

### 9. Admin Panel

Menu:

- Dashboard.
- Tournaments.
- Teams.
- Matches.
- Groups.
- Brackets.
- Settings.

Admin workflow utama:

1. Create tournament.
2. Add teams.
3. Configure format.
4. Create groups.
5. Generate group matches.
6. Publish tournament.
7. Update match results.
8. Review standings.
9. Generate playoffs.
10. Complete tournament.

Admin harus punya tombol aksi jelas:

- `Generate Groups`
- `Generate Matches`
- `Recalculate Standings`
- `Generate Playoffs`
- `Publish`
- `Lock Results`

## Database Draft

### users

- id
- email
- display_name
- role
- created_at

### tournaments

- id
- name
- slug
- game
- status
- banner_url
- logo_url
- region
- start_date
- end_date
- rules
- scoring_config
- tiebreaker_config
- created_by
- created_at
- updated_at

### teams

- id
- name
- tag
- logo_url
- country
- created_at
- updated_at

### players

- id
- team_id
- nickname
- real_name
- role
- country
- created_at

### tournament_participants

- id
- tournament_id
- team_id
- seed
- status
- created_at

### groups

- id
- tournament_id
- name
- sort_order
- top_qualify_count
- status
- created_at

### group_participants

- id
- group_id
- participant_id
- manual_rank_override

### matches

- id
- tournament_id
- stage_type
- group_id
- bracket_id
- round_number
- match_number
- participant_a_id
- participant_b_id
- score_a
- score_b
- winner_participant_id
- status
- scheduled_at
- stream_url
- locked
- created_at
- updated_at

### match_games

- id
- match_id
- game_number
- map_name
- score_a
- score_b
- kills_a
- kills_b
- deaths_a
- deaths_b
- winner_participant_id

### standings_snapshots

- id
- tournament_id
- group_id
- participant_id
- rank
- played
- wins
- draws
- losses
- points
- map_wins
- map_losses
- map_diff
- kills
- deaths
- kill_diff
- kd_ratio
- tiebreaker_notes
- updated_at

### brackets

- id
- tournament_id
- type
- status
- generated_from_stage
- created_at

### bracket_slots

- id
- bracket_id
- match_id
- slot_label
- source_type
- source_group_id
- source_rank
- participant_id

### audit_logs

- id
- user_id
- entity_type
- entity_id
- action
- before_json
- after_json
- created_at

## Realtime Strategy

Public page subscribe ke perubahan:

- matches
- match_games
- standings_snapshots
- brackets
- bracket_slots

Saat admin update match:

1. Save match result.
2. Recalculate affected group standings.
3. Update standings snapshot.
4. If playoff match, advance winner.
5. Supabase realtime mengirim perubahan ke public page.

## MVP Scope

Versi pertama harus fokus ke:

1. Next.js project setup.
2. Supabase + Prisma schema.
3. Admin auth.
4. CRUD tournament.
5. CRUD team.
6. Group creation.
7. Round robin match generation.
8. Match result update.
9. Auto standings.
10. Single elimination bracket generation.
11. Public tournament page.
12. Gaming theme.

## Phase 2

- Double elimination.
- Team roster public page.
- Advanced tiebreaker UI.
- Match dispute.
- Import/export CSV.
- Bracket embed.
- Spoiler-free mode.
- Multi-admin audit log viewer.
- Stream/VOD links.
- Game-specific presets.

## Game Preset Ideas

### Valorant / CS-style

- Match result.
- Map score.
- Round differential.
- Head-to-head.
- KD.

### Mobile Legends / Dota-style

- Match result.
- Game score.
- Kill differential.
- Duration optional.

### PUBG / Free Fire-style

- Placement points.
- Kill points.
- Total points.
- Chicken/Booyah count.

## Recommended First Build Order

1. Scaffold Next.js + TypeScript + Tailwind.
2. Setup Supabase project and env.
3. Add Prisma schema.
4. Build tournament and team models.
5. Build admin layout.
6. Build group generator.
7. Build standings calculator.
8. Build public tournament page.
9. Build playoff generator.
10. Polish gaming UI.
