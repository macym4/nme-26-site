INSERT INTO "RosterMember" ("id", "canonicalName", "pledgeClass", "dateSheetName", "updatedAt") VALUES
('pc26_addison_yurchak', 'Addison Yurchak', 'PC 26', 'Addison Yurchak', CURRENT_TIMESTAMP),
('pc26_adriana_lauterborn', 'Adriana Lauterborn', 'PC 26', 'Adriana Lauterborn', CURRENT_TIMESTAMP),
('pc26_andrea_cummings', 'Andrea Cummings', 'PC 26', 'Andrea Cummings', CURRENT_TIMESTAMP),
('pc26_annika_sandholm', 'Annika Sandholm', 'PC 26', 'Annika Sandholm', CURRENT_TIMESTAMP),
('pc26_audrey_birzell', 'Audrey Birzell', 'PC 26', 'Audrey Birzell', CURRENT_TIMESTAMP),
('pc26_brennan_fritts', 'Brennan Fritts', 'PC 26', 'Brennan Fritts', CURRENT_TIMESTAMP),
('pc26_caroline_romano', 'Caroline Romano', 'PC 26', 'Caroline Romano', CURRENT_TIMESTAMP),
('pc26_castiliya_asir', 'Castiliya Asir', 'PC 26', 'Castiliya Asir', CURRENT_TIMESTAMP),
('pc26_cecilia_walton', 'Cecilia Walton', 'PC 26', 'Cecilia Walton', CURRENT_TIMESTAMP),
('pc26_chloe_ryder', 'Chloe Ryder', 'PC 26', 'Chloe Ryder', CURRENT_TIMESTAMP),
('pc26_claire_zhang', 'Claire Zhang', 'PC 26', 'Claire Zhang', CURRENT_TIMESTAMP),
('pc26_danica_louie', 'Danica Louie', 'PC 26', 'Danica Louie', CURRENT_TIMESTAMP),
('pc26_darcy_miller', 'Darcy Miller', 'PC 26', 'Darcy Miller', CURRENT_TIMESTAMP),
('pc26_eliza_young', 'Eliza Young', 'PC 26', 'Eliza Young', CURRENT_TIMESTAMP),
('pc26_emaan_sheikh', 'Emaan Sheikh', 'PC 26', 'Emaan Sheikh', CURRENT_TIMESTAMP),
('pc26_evie_herman', 'Evie Herman', 'PC 26', 'Evie Herman', CURRENT_TIMESTAMP),
('pc26_jillian_chavez', 'Jillian Chavez', 'PC 26', 'Jillian Chavez', CURRENT_TIMESTAMP),
('pc26_kaitlyn_park', 'Kaitlyn Park', 'PC 26', 'Kaitlyn Park', CURRENT_TIMESTAMP),
('pc26_katherine_molner', 'Katherine Molner', 'PC 26', 'Katherine Molner', CURRENT_TIMESTAMP),
('pc26_kayla_graff', 'Kayla Graff', 'PC 26', 'Kayla Graff', CURRENT_TIMESTAMP),
('pc26_kiara_yoon', 'Kiara Yoon', 'PC 26', 'Kiara Yoon', CURRENT_TIMESTAMP),
('pc26_leah_berey', 'Leah Berey', 'PC 26', 'Leah Berey', CURRENT_TIMESTAMP),
('pc26_lillian_dase', 'Lillian Dase', 'PC 26', 'Lillian Dase', CURRENT_TIMESTAMP),
('pc26_lucienne_keyoung', 'Lucienne Keyoung', 'PC 26', 'Lucienne Keyoung', CURRENT_TIMESTAMP),
('pc26_maddy_decena', 'Maddy Decena', 'PC 26', 'Maddy Decena', CURRENT_TIMESTAMP),
('pc26_maggie_neary', 'Maggie Neary', 'PC 26', 'Maggie Neary', CURRENT_TIMESTAMP),
('pc26_mariia_freiuk', 'Mariia Freiuk', 'PC 26', 'Mariia Freiuk', CURRENT_TIMESTAMP),
('pc26_marina_awad', 'Marina Awad', 'PC 26', 'Marina Awad', CURRENT_TIMESTAMP),
('pc26_masha_lekovic', 'Masha Lekovic', 'PC 26', 'Masha Lekovic', CURRENT_TIMESTAMP),
('pc26_megan_zhu', 'Megan Zhu', 'PC 26', 'Megan Zhu', CURRENT_TIMESTAMP),
('pc26_mia_farber', 'Mia Farber', 'PC 26', 'Mia Farber', CURRENT_TIMESTAMP),
('pc26_miller_grimes', 'Miller Grimes', 'PC 26', 'Miller Grimes', CURRENT_TIMESTAMP),
('pc26_nadia_guevara', 'Nadia Guevara', 'PC 26', 'Nadia Guevara', CURRENT_TIMESTAMP),
('pc26_nikki_rao', 'Nikki Rao', 'PC 26', 'Nikki Rao', CURRENT_TIMESTAMP),
('pc26_phoebe_dickler', 'Phoebe Dickler', 'PC 26', 'Phoebe Dickler', CURRENT_TIMESTAMP),
('pc26_rhea_singh', 'Rhea Singh', 'PC 26', 'Rhea Singh', CURRENT_TIMESTAMP),
('pc26_sabine_smith', 'Sabine Smith', 'PC 26', 'Sabine Smith', CURRENT_TIMESTAMP),
('pc26_shanti_visurakapalli', 'Shanti Visurakapalli', 'PC 26', 'Shanti Visurakapalli', CURRENT_TIMESTAMP),
('pc26_tori_hiatt', 'Tori Hiatt', 'PC 26', 'Tori Hiatt', CURRENT_TIMESTAMP)
ON CONFLICT("canonicalName") DO UPDATE SET "pledgeClass" = excluded."pledgeClass", "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "User"
SET "pledgeClass" = 'PC 26', "updatedAt" = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1 FROM "RosterMember"
    WHERE "RosterMember"."pledgeClass" = 'PC 26'
      AND ("User"."rosterMemberId" = "RosterMember"."id"
           OR lower(trim("User"."name")) = lower("RosterMember"."canonicalName"))
);
