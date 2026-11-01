-- ============================================================
-- DONNÉES DE DÉMONSTRATION (Mise à jour pour Neon / Prod)
-- CCI Haute Matsiatra — Plateforme d'Accompagnement PME
-- ============================================================

-- ------------------------------------------------------------
-- 1. ADMINISTRATEUR (Compte de test : mag@gmail.com / mag1234)
-- ------------------------------------------------------------
INSERT INTO utilisateurs (
  nom, prenom, email, mot_de_passe_hash, telephone, role, actif, email_verifie, badges
) VALUES
(
  'Admin', 'CCI', 'mag@gmail.com',
  '$2b$10$C5QMuhRqCcgNlkuOF0VXAevpp7Of02lnjxHshY5eaPMF8pFAqyMOu',
  '+261340000000', 'ADMIN', TRUE, TRUE, '[]'::jsonb
)
ON CONFLICT (email) DO UPDATE SET mot_de_passe_hash = EXCLUDED.mot_de_passe_hash;

-- ------------------------------------------------------------
-- 2. DIRIGEANT (Compte de test : voulatsinana@gmail.com / volatiana)
-- ------------------------------------------------------------
INSERT INTO utilisateurs (
  nom, prenom, email, mot_de_passe_hash, telephone, role, actif, email_verifie, badges
) VALUES
(
  'Rakoto', 'Volatiana', 'voulatsinana@gmail.com',
  '$2b$10$R3ztcQ8EHBuqKVDkLCB6LOybPWbkAcbkkSY17.ir5P/XhgUV2F4sS',
  '+261341000010', 'DIRIGEANT', TRUE, TRUE, '[]'::jsonb
)
ON CONFLICT (email) DO UPDATE SET mot_de_passe_hash = EXCLUDED.mot_de_passe_hash;

-- ------------------------------------------------------------
-- 3. MENTOR (Compte de test : herilantomag@gmail.com / mag1234)
-- ------------------------------------------------------------
INSERT INTO utilisateurs (
  nom, prenom, email, mot_de_passe_hash, telephone, role, actif, email_verifie, 
  domaine_mentor, experience_mentor, bio_mentor, disponibilite, agrement_mentor, note_moyenne, nb_evaluations, langues_mentor, badges
) VALUES
(
  'Herilanto', 'Rasoanaivo', 'herilantomag@gmail.com',
  '$2b$10$C5QMuhRqCcgNlkuOF0VXAevpp7Of02lnjxHshY5eaPMF8pFAqyMOu',
  '+261341000001', 'MENTOR', TRUE, TRUE,
  'Exportations, Normes UE & APE', 25,
  'Expert consulaire senior en exportation, spécialisé dans les filières agricoles et l''artisanat d''art. Accompagne les PME dans leurs démarches SPS et certificats d''origine.',
  'TEMPS_PLEIN', 'CCI-EXP-2019-042', 4.80, 18, '["Français","Malgache","Anglais"]'::jsonb, '[]'::jsonb
)
ON CONFLICT (email) DO UPDATE SET mot_de_passe_hash = EXCLUDED.mot_de_passe_hash;

-- ------------------------------------------------------------
-- 4. ENTREPRISE (Liée au dirigeant Volatiana)
-- ------------------------------------------------------------
DO $$
DECLARE
  v_dirigeant_id INT;
  v_mentor_id INT;
  v_entreprise_id INT;
BEGIN
  SELECT id INTO v_dirigeant_id FROM utilisateurs WHERE email = 'voulatsinana@gmail.com';
  SELECT id INTO v_mentor_id FROM utilisateurs WHERE email = 'herilantomag@gmail.com';

  INSERT INTO entreprises (
    raison_sociale, sigle, nif, stat, rcs, forme_juridique,
    secteur, sous_secteur, taille, effectif, chiffre_affaires, annee_creation,
    description, produit_phare, mots_cles, adresse, ville, region,
    telephone, email, site_web, logo, dirigeant_id, mentor_id,
    statut, verifie, date_verification, note_moyenne, nb_avis,
    cota_montant, cota_statut, cota_echeance, cota_reference,
    numero_carte_membre, nb_vues, nb_publications
  ) VALUES (
    'Matsiatra Craft & Tissage', 'MC', '3001849201', '13211-31-2018-0-00452', '2018-B-0452', 'SARL',
    'Artisanat & Textile', 'Tissage de soie', 'PE', 14, 48000000, '2018-03-12',
    'Atelier artisanal spécialisé dans le tissage traditionnel de soie malgache (landy) et de fibres végétales de Haute Matsiatra. Labellisé par la CCI pour la valorisation du savoir-faire betsileo.',
    'Étole Landy Betsileo', '["Landy","Export","Bio","Artisanat d''art","Betsileo"]'::jsonb,
    'Lot VA 12 Ampasambazaha', 'Fianarantsoa', 'Haute Matsiatra',
    '+261 34 12 345 67', 'contact@matsiatracraft.mg', 'www.matsiatracraft.mg',
    'https://ui-avatars.com/api/?name=MC&background=1e3a5f&color=fff&size=200',
    v_dirigeant_id, v_mentor_id,
    'ACTIF', TRUE, NOW(), 4.80, 12,
    250000, 'PAYE', '2026-01-15', 'QUIT-2026-0842',
    'CCI-HM-MEM-2024-041', 342, 5
  ) ON CONFLICT (nif) DO NOTHING;

  SELECT id INTO v_entreprise_id FROM entreprises WHERE nif = '3001849201';

  -- ------------------------------------------------------------
  -- 5. SESSION FPD ET MODULE (Pour tester les formations)
  -- ------------------------------------------------------------
  INSERT INTO sessions_fpd (
    nom, metier, description, date_debut, date_fin, places_totales, places_restantes, statut, est_privee, lieu_formation, createur_id
  ) VALUES (
    'Initiation au Management', 'HOTELLERIE_TOURISME', 
    'Formation de base sur le management d''équipe.', 
    '2026-01-10', '2026-02-10', 20, 19, 'PLANIFIEE', FALSE, 'CCI Fianarantsoa', NULL
  ) ON CONFLICT DO NOTHING;

  -- ------------------------------------------------------------
  -- 6. PUBLICATION (Mur / Feed)
  -- ------------------------------------------------------------
  INSERT INTO publications (
    entreprise_id, auteur_id, type, titre, contenu, visibilite, epingle, likes, commentaires, nb_likes, nb_commentaires, nb_vues
  ) VALUES (
    v_entreprise_id, v_dirigeant_id, 'POST_MANUEL',
    'Nouvelle collection Landy Betsileo',
    'Notre nouvelle collection d''étoles en soie sauvage Landy est disponible !',
    'PUBLIC', TRUE, '[]'::jsonb, '[]'::jsonb, 34, 2, 189
  ) ON CONFLICT DO NOTHING;

END $$;