-- ============================================================
-- Diagnostic : pourquoi "anciens participants" ne remonte que
-- les contacts importés et pas l'historique des billets ?
-- ============================================================
-- Remplace 'TITRE_DE_TON_EVENEMENT' par le titre exact de ton
-- événement récurrent (visible sur le tableau de bord).

-- 1) Trouve le modèle (la ligne "racine" de la série)
select id as id_modele, titre, recurrence, parent_event_id
from events
where titre ilike '%TITRE_DE_TON_EVENEMENT%'
  and parent_event_id is null;

-- 2) Colle l'id_modele obtenu ci-dessus à la place de MODELE_ID
--    ci-dessous, puis exécute cette deuxième requête :
--    Liste toutes les séances (passées et futures) de cette série,
--    avec leur nombre de billets.
select
  e.id as id_seance,
  e.date_debut,
  e.parent_event_id,
  count(t.id) filter (where t.statut <> 'annule') as nb_billets
from events e
left join tickets t on t.event_id = e.id
where e.parent_event_id = 'MODELE_ID'
group by e.id, e.date_debut, e.parent_event_id
order by e.date_debut;

-- 3) Toujours avec le même MODELE_ID : vérifie ce que la fonction de
--    l'app interroge réellement (même logique que le code).
select id from events
where id = 'MODELE_ID' or parent_event_id = 'MODELE_ID';
