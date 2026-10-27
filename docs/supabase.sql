-- =====================================================================
-- BLACKLINE : classement en ligne (pseudo + score).
-- À coller en entier dans Supabase > SQL Editor > New query, puis « Run ».
-- Sans danger à relancer : tout est recréé proprement (les scores existants sont conservés).
-- Règles identiques à js/leaderboard-core.js (le jeu les vérifie aussi, le serveur a le dernier mot).
-- =====================================================================

-- 1) Tables --------------------------------------------------------------
create table if not exists public.lb_players (
  id          uuid primary key,                       -- identifiant anonyme (auth.uid())
  pub         uuid not null unique default gen_random_uuid(),  -- référence publique (signalement)
  name        text not null,
  name_key    text not null unique,                   -- unicité insensible à la casse/accents/chiffres 1337
  total       double precision not null default 0,    -- meilleur total gagné accepté
  level       int  not null default 1,                -- niveau d'empire (affichage)
  week_key    date,                                   -- lundi (Europe/Paris) de la semaine en cours
  week_base   double precision not null default 0,    -- total au début de la semaine
  first_at    timestamptz not null default now(),
  last_submit timestamptz,
  renamed_at  timestamptz,
  reports     int not null default 0,
  hidden      boolean not null default false,
  version     text,
  updated_at  timestamptz not null default now()
);
create table if not exists public.lb_reports (
  reporter   uuid not null references public.lb_players(id) on delete cascade,
  target     uuid not null references public.lb_players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reporter, target)
);
create table if not exists public.lb_words (w text primary key, kind text not null check (kind in ('sub','exact')));
create index if not exists lb_players_total_idx on public.lb_players (total desc) where not hidden;

-- Aucun accès direct aux tables : tout passe par les fonctions ci-dessous.
alter table public.lb_players enable row level security;
alter table public.lb_reports enable row level security;
alter table public.lb_words   enable row level security;
revoke all on public.lb_players, public.lb_reports, public.lb_words from anon, authenticated;

-- 2) Mots refusés (liste de départ : complète-la quand tu veux) -------------
-- « sub » : présent n'importe où ; « exact » : le pseudo entier ou l'un de ses mots.
delete from public.lb_words;
insert into public.lb_words (w, kind) values
  ('putain','sub'),
  ('salop','sub'),
  ('salaud','sub'),
  ('connard','sub'),
  ('connasse','sub'),
  ('encule','sub'),
  ('niquer','sub'),
  ('batard','sub'),
  ('merde','sub'),
  ('nazi','sub'),
  ('hitler','sub'),
  ('negre','sub'),
  ('nigger','sub'),
  ('nigga','sub'),
  ('faggot','sub'),
  ('pedophile','sub'),
  ('porno','sub'),
  ('porn','sub'),
  ('daech','sub'),
  ('jihad','sub'),
  ('suicide','sub'),
  ('fuck','sub'),
  ('shit','sub'),
  ('bitch','sub'),
  ('cunt','sub'),
  ('whore','sub'),
  ('retard','sub'),
  ('instagram','sub'),
  ('snapchat','sub'),
  ('discord','sub'),
  ('whatsapp','sub'),
  ('tiktok','sub'),
  ('telegram','sub'),
  ('facebook','sub'),
  ('gmail','sub'),
  ('hotmail','sub'),
  ('outlook','sub'),
  ('yahoo','sub'),
  ('icloud','sub'),
  ('pute','exact'),
  ('putes','exact'),
  ('pedo','exact'),
  ('insta','exact'),
  ('snap','exact'),
  ('ntm','exact'),
  ('fdp','exact'),
  ('pd','exact'),
  ('tg','exact'),
  ('sex','exact'),
  ('sexe','exact'),
  ('cul','exact'),
  ('cum','exact'),
  ('anal','exact'),
  ('kkk','exact'),
  ('isis','exact'),
  ('admin','exact'),
  ('moderateur','exact'),
  ('modo','exact'),
  ('support','exact'),
  ('blackline','exact');

-- 3) Outils de vérification ------------------------------------------------
create or replace function public.lb_fold(n text, one boolean) returns text
language sql immutable as $$
  select regexp_replace(
    translate(
      translate(lower(n), 'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy'),
      '0134578', case when one then 'oleastb' else 'oieastb' end),
    '[^a-z0-9]', '', 'g')
$$;

create or replace function public.lb_norm(n text) returns text
language sql immutable as $$ select btrim(regexp_replace(normalize(coalesce(n, ''), NFKC), '\s+', ' ', 'g')) $$;

-- retourne null si le pseudo est correct, sinon : len | chars | letters | digits | banned
create or replace function public.lb_name_error(raw text) returns text
language plpgsql stable set search_path = public as $$
declare n text := public.lb_norm(raw); ka text; kb text; tok text;
begin
  if char_length(n) < 3 or char_length(n) > 16 then return 'len'; end if;
  if n !~ '^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _-]+$' then return 'chars'; end if;
  if char_length(regexp_replace(n, '[^A-Za-zÀ-ÖØ-öø-ÿ]', '', 'g')) < 2 then return 'letters'; end if;
  if char_length(regexp_replace(n, '[^0-9]', '', 'g')) >= 7 then return 'digits'; end if;
  ka := public.lb_fold(n, false); kb := public.lb_fold(n, true);
  if exists (select 1 from public.lb_words w where w.kind = 'sub' and (position(w.w in ka) > 0 or position(w.w in kb) > 0)) then return 'banned'; end if;
  if exists (select 1 from public.lb_words w where w.kind = 'exact' and (w.w = ka or w.w = kb)) then return 'banned'; end if;
  for tok in select regexp_split_to_table(n, '[ _-]+') loop
    if exists (select 1 from public.lb_words w where w.kind = 'exact' and (w.w = public.lb_fold(tok, false) or w.w = public.lb_fold(tok, true))) then return 'banned'; end if;
  end loop;
  return null;
end $$;

create or replace function public.lb_week() returns date
language sql stable as $$ select date_trunc('week', now() at time zone 'Europe/Paris')::date $$;

-- 4) Fonctions appelées par le jeu ------------------------------------------
-- créer le profil (pseudo) ; connexion anonyme requise
create or replace function public.lb_register(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n text := public.lb_norm(p_name); e text; r uuid;
begin
  if uid is null then raise exception 'no_auth'; end if;
  select pub into r from public.lb_players where id = uid; if r is not null then return r; end if;
  e := public.lb_name_error(n); if e is not null then raise exception 'name_%', e; end if;
  begin
    insert into public.lb_players (id, name, name_key) values (uid, n, public.lb_fold(n, false)) returning pub into r;
  exception when unique_violation then raise exception 'name_taken';
  end;
  return r;
end $$;

-- changer de pseudo (1 fois par 24 h)
create or replace function public.lb_set_name(p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n text := public.lb_norm(p_name); e text; p public.lb_players;
begin
  if uid is null then raise exception 'no_auth'; end if;
  select * into p from public.lb_players where id = uid; if not found then raise exception 'no_player'; end if;
  if p.renamed_at is not null and now() - p.renamed_at < interval '24 hours' then raise exception 'rename_rate'; end if;
  e := public.lb_name_error(n); if e is not null then raise exception 'name_%', e; end if;
  begin
    update public.lb_players set name = n, name_key = public.lb_fold(n, false), renamed_at = now(), updated_at = now() where id = uid;
  exception when unique_violation then raise exception 'name_taken';
  end;
end $$;

-- envoyer le score : le serveur ne fait JAMAIS confiance au client
-- plafonds : 1ère fois <= 1e15 ; ensuite +2e11 par seconde écoulée (7 jours max) + 1e6 ; jamais > 1e18 ; 1 envoi / 55 s
create or replace function public.lb_submit(p_total double precision, p_level int, p_version text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); p public.lb_players; el double precision; wk date := public.lb_week(); lvl int;
begin
  if uid is null then raise exception 'no_auth'; end if;
  select * into p from public.lb_players where id = uid for update; if not found then raise exception 'no_player'; end if;
  if p_total is null or p_total = 'NaN'::float8 or p_total < 0 or p_total > 1e18 then raise exception 'bad_value'; end if;
  lvl := least(100, greatest(1, coalesce(p_level, 1)));
  if p.last_submit is not null and now() - p.last_submit < interval '55 seconds' then raise exception 'rate_limited'; end if;
  if p_total > p.total then
    if p.last_submit is null then
      if p_total > 1e15 then raise exception 'implausible'; end if;
    else
      el := least(604800, greatest(0, extract(epoch from now() - p.last_submit)));
      if p_total - p.total > 2e11 * el + 1e6 then raise exception 'implausible'; end if;
    end if;
  end if;
  update public.lb_players set
    week_base   = case when week_key is distinct from wk then (case when last_submit is null then p_total else total end) else week_base end,
    week_key    = wk,
    total       = greatest(total, p_total),
    level       = case when p_total > total then lvl else level end,
    last_submit = now(), version = left(coalesce(p_version, ''), 12), updated_at = now()
  where id = uid;
end $$;

-- lire le classement : 'all' (tout temps) ou 'week' (gain de la semaine) ; top 50 + ma ligne
create or replace function public.lb_board(p_cat text)
returns table (rank bigint, pub uuid, name text, score double precision, level int, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := auth.uid(); wk date := public.lb_week();
begin
  if uid is null then raise exception 'no_auth'; end if;
  if p_cat not in ('all', 'week') then raise exception 'bad_value'; end if;
  return query
  with s as (
    select p.id, p.pub, p.name, p.level, p.hidden,
           case when p_cat = 'week' then (case when p.week_key = wk then greatest(0, p.total - p.week_base) else 0 end) else p.total end as sc
    from public.lb_players p
  ), r as (
    select s.*, (rank() over (order by s.sc desc))::bigint as rk from s where not s.hidden and (p_cat = 'all' or s.sc > 0)
  )
  select r.rk, r.pub, r.name, r.sc, r.level, (r.id = uid) from r where r.rk <= 50 or r.id = uid
  union all
  select (select count(*) + 1 from s s2 where not s2.hidden and s2.sc > s.sc and (p_cat = 'all' or s2.sc > 0)), s.pub, s.name, s.sc, s.level, true
  from s where s.id = uid and s.hidden
  order by 1, 3;
end $$;

-- signaler un pseudo (10 / heure) ; masqué automatiquement à 5 signalements distincts
create or replace function public.lb_report(p_pub uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t uuid; c int;
begin
  if uid is null then raise exception 'no_auth'; end if;
  if not exists (select 1 from public.lb_players where id = uid) then raise exception 'no_player'; end if;
  select id into t from public.lb_players where pub = p_pub; if t is null or t = uid then return; end if;
  if (select count(*) from public.lb_reports where reporter = uid and created_at > now() - interval '1 hour') >= 10 then raise exception 'rate_limited'; end if;
  insert into public.lb_reports (reporter, target) values (uid, t) on conflict do nothing;
  select count(*) into c from public.lb_reports where target = t;
  update public.lb_players set reports = c, hidden = (c >= 5) where id = t;
end $$;

-- effacer toutes mes données (profil, signalements et identifiant anonyme)
create or replace function public.lb_delete_me() returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'no_auth'; end if;
  delete from public.lb_players where id = uid;
  delete from auth.users where id = uid and is_anonymous;
end $$;

-- 5) Droits : seulement les joueurs connectés (anonymes inclus), jamais « anon » -----
revoke all on function public.lb_register(text), public.lb_set_name(text), public.lb_submit(double precision, int, text),
  public.lb_board(text), public.lb_report(uuid), public.lb_delete_me() from public, anon;
grant execute on function public.lb_register(text), public.lb_set_name(text), public.lb_submit(double precision, int, text),
  public.lb_board(text), public.lb_report(uuid), public.lb_delete_me() to authenticated;
revoke all on function public.lb_fold(text, boolean), public.lb_norm(text), public.lb_name_error(text), public.lb_week() from public, anon, authenticated;

-- 6) -- Partie 17 : lecture PUBLIQUE du top 10 pour l'écran d'accueil (sans compte, sans session anonyme).
-- Renvoie seulement rang, pseudo, score et niveau : jamais l'identifiant public (pub) ni l'identifiant interne (id).
-- Mêmes filtres que lb_board : pseudos masqués exclus ; 'week' = gain depuis lundi (heure de Paris), scores nuls exclus.
create or replace function public.lb_board_public(p_scope text)
returns table (rank bigint, name text, score double precision, level int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare wk date := public.lb_week();
begin
  if p_scope is null or p_scope not in ('all', 'week') then raise exception 'bad_value'; end if;
  return query
  with s as (
    select p.name, p.level,
           case when p_scope = 'week' then (case when p.week_key = wk then greatest(0, p.total - p.week_base) else 0 end) else p.total end as sc
    from public.lb_players p where not p.hidden
  ), r as (
    select s.*, (rank() over (order by s.sc desc))::bigint as rk from s where p_scope = 'all' or s.sc > 0
  )
  select r.rk, r.name, r.sc, r.level from r where r.rk <= 10 order by r.rk, r.name limit 10;
end $$;
revoke all on function public.lb_board_public(text) from public;
grant execute on function public.lb_board_public(text) to anon, authenticated;
notify pgrst, 'reload schema';

-- =====================================================================
-- MODÉRATION À LA MAIN (SQL Editor) — exemples :
--   Masquer un pseudo :        update public.lb_players set hidden = true  where name = 'LePseudo';
--   Le réafficher :            update public.lb_players set hidden = false, reports = 0 where name = 'LePseudo';
--   Supprimer un joueur :      delete from public.lb_players where name = 'LePseudo';
--   Voir les plus signalés :   select name, reports, hidden from public.lb_players order by reports desc limit 20;
--   Ajouter un mot interdit :  insert into public.lb_words values ('motinterdit','sub') on conflict do nothing;
-- =====================================================================
