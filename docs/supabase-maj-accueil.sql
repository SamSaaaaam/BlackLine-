-- =====================================================================
-- BLACKLINE · Partie 17 : classement visible sur l'écran d'accueil.
-- À lancer UNE SEULE FOIS si tu as déjà installé docs/supabase.sql auparavant :
-- Supabase > SQL Editor > New query > colle ce fichier en entier > « Run ».
-- Sans danger à relancer. Ne touche à aucune donnée existante (aucune table modifiée).
-- (Une nouvelle installation complète n'en a pas besoin : docs/supabase.sql contient déjà cette fonction.)
-- =====================================================================
-- Partie 17 : lecture PUBLIQUE du top 10 pour l'écran d'accueil (sans compte, sans session anonyme).
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

-- demande à l'API de relire la liste des fonctions (sinon elle peut mettre une minute à voir la nouvelle)
notify pgrst, 'reload schema';

-- Vérification (facultative) : doit renvoyer au plus 10 lignes, sans identifiant.
-- select * from public.lb_board_public('all');
