-- ============================================================
-- DONNÉES DE DÉMONSTRATION
-- CCI Haute Matsiatra — Plateforme d'Accompagnement PME
-- ============================================================

-- ------------------------------------------------------------
-- 1. MENTORS
-- ------------------------------------------------------------
INSERT INTO utilisateurs (
  nom, prenom, email, mot_de_passe_hash, telephone, photo_profil,
  role, actif, email_verifie,
  domaine_mentor, experience_mentor, bio_mentor, disponibilite,
  agrement_mentor, note_moyenne, nb_evaluations, langues_mentor
) VALUES
-- Mentor 1 : Export
(
  'Raveloson', 'Jean-Noël', 'j.raveloson@cci-matsiatra.mg',
  '$2b$10$exempleHashBcryptAReGenerer', '+261341000001',
  'https://ui-avatars.com/api/?name=Jean-Noel+Raveloson&background=1e3a5f&color=fff&size=200',
  'MENTOR', TRUE, TRUE,
  'Exportations, Normes UE & APE', 25,
  'Expert consulaire senior en exportation, spécialisé dans les filières agricoles et l''artisanat d''art. Accompagne les PME dans leurs démarches SPS et certificats d''origine.',
  'TEMPS_PLEIN', 'CCI-EXP-2019-042', 4.80, 18,
  '["Français","Malgache","Anglais"]'::jsonb
),
-- Mentor 2 : Finance
(
  'Randria', 'Andry', 'a.randria@cci-matsiatra.mg',
  '$2b$10$exempleHashBcryptAReGenerer', '+261341000002',
  'https://ui-avatars.com/api/?name=Andry+Randria&background=1b6d24&color=fff&size=200',
  'MENTOR', TRUE, TRUE,
  'Audit financier, Trésorerie & Fiscalité', 18,
  'Expert-comptable agréé, spécialisé dans la conformité DGI, les montages de dossiers de financement bancaire et les plans de trésorerie.',
  'TEMPS_PARTIEL', 'CCI-FIN-2020-018', 4.70, 12,
  '["Français","Malgache"]'::jsonb
),
-- Mentor 3 : Marketing
(
  'Rasoanaivo', 'Voahangy', 'v.rasoanaivo@cci-matsiatra.mg',
  '$2b$10$exempleHashBcryptAReGenerer', '+261341000003',
  'https://ui-avatars.com/api/?name=Voahangy+Rasoanaivo&background=8b5a2b&color=fff&size=200',
  'MENTOR', TRUE, TRUE,
  'Marketing digital, Vente B2B & E-commerce', 12,
  'Consultante en développement commercial multi-canal, spécialisée dans la prospection grands comptes et les salons professionnels.',
  'OCCASIONNEL', 'CCI-MKT-2021-005', 4.60, 9,
  '["Français","Malgache","Anglais"]'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------
-- 2. DIRIGEANT (pour lier les entreprises)
-- ------------------------------------------------------------
INSERT INTO utilisateurs (
  nom, prenom, email, mot_de_passe_hash, telephone, photo_profil,
  role, actif, email_verifie
) VALUES
(
  'Rasoanirina', 'Bakoly', 'b.rasoanirina@matsiatracraft.mg',
  '$2b$10$exempleHashBcryptAReGenerer', '+261341000010',
  'https://ui-avatars.com/api/?name=Bakoly+Rasoanirina&background=022448&color=fff&size=200',
  'DIRIGEANT', TRUE, TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------
-- 3. ENTREPRISES DE DÉMONSTRATION
-- ------------------------------------------------------------
-- Récupérer l'ID du dirigeant
DO $$
DECLARE
  v_dirigeant_id INT;
  v_mentor_1_id INT;
  v_mentor_2_id INT;
  v_mentor_3_id INT;
BEGIN
  SELECT id INTO v_dirigeant_id FROM utilisateurs WHERE email = 'b.rasoanirina@matsiatracraft.mg';
  SELECT id INTO v_mentor_1_id FROM utilisateurs WHERE email = 'j.raveloson@cci-matsiatra.mg';
  SELECT id INTO v_mentor_2_id FROM utilisateurs WHERE email = 'a.randria@cci-matsiatra.mg';
  SELECT id INTO v_mentor_3_id FROM utilisateurs WHERE email = 'v.rasoanaivo@cci-matsiatra.mg';

  -- Entreprise 1 : Matsiatra Craft & Tissage
  INSERT INTO entreprises (
    raison_sociale, sigle, nif, stat, rcs, forme_juridique,
    secteur, sous_secteur, taille, effectif, chiffre_affaires, annee_creation,
    description, produit_phare, mots_cles,
    adresse, ville, region,
    telephone, email, site_web,
    logo, photo_couverture,
    dirigeant_id, mentor_id,
    statut, verifie, date_verification,
    note_moyenne, nb_avis,
    cota_montant, cota_statut, cota_echeance, cota_reference,
    numero_carte_membre,
    nb_vues, nb_publications
  ) VALUES (
    'Matsiatra Craft & Tissage', 'MC', '3001849201', '13211-31-2018-0-00452', '2018-B-0452', 'SARL',
    'Artisanat & Textile', 'Tissage de soie', 'PE', 14, 48000000, '2018-03-12',
    'Atelier artisanal spécialisé dans le tissage traditionnel de soie malgache (landy) et de fibres végétales de Haute Matsiatra. Labellisé par la CCI pour la valorisation du savoir-faire betsileo et l''insertion professionnelle des tisseuses locales.',
    'Étole Landy Betsileo',
    '["Landy","Export","Bio","Artisanat d''art","Betsileo"]'::jsonb,
    'Lot VA 12 Ampasambazaha', 'Fianarantsoa', 'Haute Matsiatra',
    '+261 34 12 345 67', 'contact@matsiatracraft.mg', 'www.matsiatracraft.mg',
    'https://ui-avatars.com/api/?name=MC&background=1e3a5f&color=fff&size=200',
    NULL,
    v_dirigeant_id, v_mentor_1_id,
    'ACTIF', TRUE, NOW(),
    4.80, 12,
    250000, 'PAYE', '2026-01-15', 'QUIT-2026-0842',
    'CCI-HM-MEM-2024-041',
    342, 5
  );

  -- Entreprise 2 : Betsileo Tech Solutions
  INSERT INTO entreprises (
    raison_sociale, sigle, nif, stat, forme_juridique,
    secteur, sous_secteur, taille, effectif, chiffre_affaires, annee_creation,
    description, produit_phare, mots_cles,
    adresse, ville, region,
    telephone, email, site_web,
    logo,
    dirigeant_id,
    statut, verifie, date_verification,
    note_moyenne, nb_avis,
    cota_montant, cota_statut, cota_echeance, cota_reference,
    nb_vues, nb_publications
  ) VALUES (
    'Betsileo Tech Solutions', 'BT', '5003841920', '13212-31-2019-0-00128', 'SARL',
    'Numérique & IT', 'Développement logiciel', 'PE', 8, 32000000, '2019-06-20',
    'Solutions logicielles locales pour PME : gestion de stock, facturation, paiement mobile (MVola, Orange Money). Applications offline-first adaptées aux réalités locales.',
    'Gestionnaire de stock offline',
    '["Logiciel","PME","Mobile Money","Offline"]'::jsonb,
    'Lot II B 45 Ambalavao', 'Ambalavao', 'Haute Matsiatra',
    '+261 34 12 345 68', 'contact@betsileotech.mg', 'www.betsileotech.mg',
    'https://ui-avatars.com/api/?name=BT&background=1b6d24&color=fff&size=200',
    v_dirigeant_id,
    'ACTIF', TRUE, NOW(),
    4.50, 8,
    180000, 'PAYE', '2026-01-12', 'QUIT-2026-0835',
    256, 3
  );

  -- Entreprise 3 : Soalala Agro-Industrie
  INSERT INTO entreprises (
    raison_sociale, sigle, nif, stat, forme_juridique,
    secteur, sous_secteur, taille, effectif, chiffre_affaires, annee_creation,
    description, produit_phare, mots_cles,
    adresse, ville, region,
    telephone, email,
    logo,
    dirigeant_id,
    statut, verifie, date_verification,
    note_moyenne, nb_avis,
    cota_montant, cota_statut, cota_echeance,
    nb_vues, nb_publications
  ) VALUES (
    'Soalala Agro-Industrie', 'SA', '4001928471', '13213-31-2017-0-00089', 'SA',
    'Agroalimentaire', 'Transformation & conditionnement', 'ME', 42, 180000000, '2017-02-10',
    'Transformation et conditionnement de produits agricoles : huiles essentielles, thés fins, épices biologiques. Certifiée bio pour l''exportation.',
    'Huile essentielle de gingembre bio',
    '["Bio","Export","Huiles essentielles","Épices"]'::jsonb,
    'Zone Industrielle Soalala', 'Fianarantsoa', 'Haute Matsiatra',
    '+261 34 12 345 69', 'contact@soalala-agro.mg',
    'https://ui-avatars.com/api/?name=SA&background=8b5a2b&color=fff&size=200',
    v_dirigeant_id,
    'ACTIF', TRUE, NOW(),
    4.20, 15,
    320000, 'IMPAYE', '2026-03-31',
    189, 4
  );

  -- Entreprise 4 : Café Matsiatra Bio
  INSERT INTO entreprises (
    raison_sociale, sigle, nif, stat, forme_juridique,
    secteur, sous_secteur, taille, effectif, chiffre_affaires, annee_creation,
    description, produit_phare, mots_cles,
    adresse, ville, region,
    telephone, email,
    logo,
    dirigeant_id,
    statut, verifie,
    note_moyenne, nb_avis,
    cota_montant, cota_statut, cota_echeance,
    nb_vues, nb_publications
  ) VALUES (
    'Café Matsiatra Bio', 'CM', '6001289452', '13214-31-2020-0-00234', 'Coopérative',
    'Agro-exportation', 'Caféiculture', 'PE', 22, 65000000, '2020-09-05',
    'Caféiculture biologique et exportation de café vert vers l''Europe et l''Asie. Coopérative de 120 producteurs des hauts plateaux.',
    'Café vert arabica bio',
    '["Café","Bio","Export","Coopérative","Arabica"]'::jsonb,
    'Route de Manakara PK 45', 'Manakara', 'Vatovavy',
    '+261 34 12 345 70', 'contact@cafematsiatra.mg',
    'https://ui-avatars.com/api/?name=CM&background=3b1c00&color=fff&size=200',
    v_dirigeant_id,
    'ACTIF', TRUE,
    4.60, 10,
    220000, 'EN_RETARD', '2026-01-31',
    278, 3
  );

  -- Entreprise 5 : Fianar Bois & Ébénisterie
  INSERT INTO entreprises (
    raison_sociale, sigle, nif, stat, forme_juridique,
    secteur, sous_secteur, taille, effectif, chiffre_affaires, annee_creation,
    description, produit_phare, mots_cles,
    adresse, ville, region,
    telephone, email,
    logo,
    dirigeant_id,
    statut, verifie,
    note_moyenne, nb_avis,
    cota_montant, cota_statut, cota_echeance,
    nb_vues
  ) VALUES (
    'Fianar Bois & Ébénisterie', 'FB', '2004819401', '13215-31-2016-0-00056', 'SARL',
    'Menuiserie & BTP', 'Ébénisterie', 'PE', 18, 42000000, '2016-04-15',
    'Fabrication de mobilier institutionnel et artisanal en bois local, ébénisterie de précision pour les administrations et particuliers.',
    'Mobilier scolaire',
    '["Bois","Ébénisterie","Mobilier","BTP"]'::jsonb,
    'Lot 45 Talatamaty', 'Fianarantsoa', 'Haute Matsiatra',
    '+261 34 12 345 71', 'contact@fianarbois.mg',
    'https://ui-avatars.com/api/?name=FB&background=5a2e00&color=fff&size=200',
    v_dirigeant_id,
    'ACTIF', FALSE,
    4.10, 6,
    280000, 'EN_RETARD', '2026-01-31',
    145
  );

  -- Entreprise 6 : Mad'Huiles Essentielles
  INSERT INTO entreprises (
    raison_sociale, sigle, nif, stat, forme_juridique,
    secteur, sous_secteur, taille, effectif, chiffre_affaires, annee_creation,
    description, produit_phare, mots_cles,
    adresse, ville, region,
    telephone, email,
    logo,
    dirigeant_id,
    statut, verifie,
    note_moyenne, nb_avis,
    cota_montant, cota_statut, cota_echeance,
    nb_vues
  ) VALUES (
    'Mad''Huiles Essentielles', 'MH', '7001289453', '13216-31-2021-0-00341', 'SARL',
    'Transformation agricole', 'Distillation', 'TPE', 11, 28000000, '2021-07-01',
    'Distillation artisanale d''huiles essentielles : girofle, ravintsara, gingembre, citronnelle. Production 100% bio et éthique.',
    'Huile de ravintsara',
    '["Huiles essentielles","Bio","Artisanal","Aromathérapie"]'::jsonb,
    'Village d''Andrainjato', 'Fianarantsoa', 'Haute Matsiatra',
    '+261 34 12 345 72', 'contact@madhuiles.mg',
    'https://ui-avatars.com/api/?name=MH&background=1b6d24&color=fff&size=200',
    v_dirigeant_id,
    'ACTIF', TRUE,
    4.40, 7,
    250000, 'PAYE', '2026-01-20',
    167
  );

  -- Mise à jour du compteur de PME suivies pour les mentors
  UPDATE utilisateurs SET nb_evaluations = 18 WHERE id = v_mentor_1_id;
  UPDATE utilisateurs SET nb_evaluations = 12 WHERE id = v_mentor_2_id;
  UPDATE utilisateurs SET nb_evaluations = 9 WHERE id = v_mentor_3_id;

END $$;

-- ------------------------------------------------------------
-- 4. DEMANDES DE COLLABORATION PUBLIQUES
-- ------------------------------------------------------------
DO $$
DECLARE
  v_ent_soalala INT;
  v_ent_cafe INT;
  v_ent_matsiatra INT;
BEGIN
  SELECT id INTO v_ent_soalala FROM entreprises WHERE nif = '4001928471';
  SELECT id INTO v_ent_cafe FROM entreprises WHERE nif = '6001289452';
  SELECT id INTO v_ent_matsiatra FROM entreprises WHERE nif = '3001849201';

  INSERT INTO demandes (
    type, sous_type, entreprise_id, titre, description, besoin_detaille,
    volume, localisation_cible, secteur_concerne, date_souhaitee,
    statut, visible_publiquement, date_publication, duree_estimee
  ) VALUES
  (
    'COLLABORATION', 'DEMANDE', v_ent_soalala,
    'Recherche partenaire emballage tressé',
    'Dans le cadre de notre labellisation biologique pour l''exportation d''huiles essentielles, nous recherchons un partenaire local ou une coopérative pour la fourniture mensuelle d''emballages tressés en fibres naturelles.',
    'Fourniture régulière de 3 500 unités d''emballages tressés en raphia ou sisal traité, conformes aux normes d''exportation UE.',
    '3 500 unités / mois',
    'Ambalavao & environs',
    'Artisanat & Textile',
    '2026-03-15', 'EN_ATTENTE', TRUE, NOW(), '12 mois'
  ),
  (
    'COLLABORATION', 'PARTENARIAT', v_ent_cafe,
    'Distribution de café bio en Europe',
    'Notre coopérative cherche un distributeur ou importateur européen pour notre café vert arabica bio produit par 120 producteurs des hauts plateaux.',
    'Contrat de distribution annuel pour 12 tonnes de café vert bio, conditionné en sacs de 60 kg avec traçabilité complète.',
    '12 tonnes / an',
    'Union Européenne',
    'Agro-exportation',
    '2026-04-30', 'EN_ATTENTE', TRUE, NOW(), '24 mois'
  ),
  (
    'COLLABORATION', 'OFFRE', v_ent_matsiatra,
    'Sous-traitance textile institutionnel',
    'Notre atelier propose ses services de sous-traitance pour la confection de textiles institutionnels : uniformes, bannières, tentures officielles.',
    'Capacité disponible de 500 pièces par trimestre, délais de 4 à 6 semaines, qualité artisanale certifiée.',
    '500 pièces / trimestre',
    'Haute Matsiatra',
    'Artisanat & Textile',
    '2026-03-20', 'EN_ATTENTE', TRUE, NOW(), '6 mois'
  );
END $$;

-- ------------------------------------------------------------
-- 5. PUBLICATIONS (MUR PUBLIC)
-- ------------------------------------------------------------
DO $$
DECLARE
  v_ent_matsiatra INT;
  v_ent_bt INT;
  v_ent_soalala INT;
  v_dirigeant_id INT;
BEGIN
  SELECT id INTO v_ent_matsiatra FROM entreprises WHERE nif = '3001849201';
  SELECT id INTO v_ent_bt FROM entreprises WHERE nif = '5003841920';
  SELECT id INTO v_ent_soalala FROM entreprises WHERE nif = '4001928471';
  SELECT id INTO v_dirigeant_id FROM utilisateurs WHERE email = 'b.rasoanirina@matsiatracraft.mg';

  INSERT INTO publications (
    entreprise_id, auteur_id, type, titre, contenu,
    visibilite, epingle, likes, commentaires, nb_likes, nb_commentaires, nb_vues
  ) VALUES
  (
    v_ent_matsiatra, v_dirigeant_id, 'POST_MANUEL',
    'Nouvelle collection Landy Betsileo',
    'Notre nouvelle collection d''étoles en soie sauvage Landy est disponible ! Chaque pièce est unique, tissée à la main par nos 14 artisanes. Livraison possible dans toute la région Haute Matsiatra.',
    'PUBLIC', TRUE, '[]'::jsonb, '[]'::jsonb, 34, 2, 189
  ),
  (
    v_ent_bt, NULL, 'POST_MANUEL',
    'Gestion de stock pour 12 ateliers artisanaux',
    'Retour de terrain très positif suite au déploiement de notre système de gestion d''inventaire pour 12 ateliers artisanaux de la commune urbaine de Fianarantsoa. Le module hors-ligne permet un suivi en temps réel sans connexion permanente.',
    'PUBLIC', FALSE, '[]'::jsonb, '[]'::jsonb, 28, 0, 145
  ),
  (
    v_ent_soalala, NULL, 'POST_MANUEL',
    'Certification bio obtenue !',
    'Notre unité de transformation a officiellement obtenu la certification bio pour l''exportation de nos huiles essentielles vers l''Union Européenne. Merci à la CCI pour son accompagnement.',
    'PUBLIC', FALSE, '[]'::jsonb, '[]'::jsonb, 45, 3, 234
  );
END $$;

-- ------------------------------------------------------------
-- 6. QUESTIONS DE DIAGNOSTIC (si pas déjà présentes)
-- ------------------------------------------------------------
-- (Les questions sont déjà insérées par le script initial)

-- ============================================================
-- FIN DU SCRIPT DE DÉMONSTRATION
-- ============================================================