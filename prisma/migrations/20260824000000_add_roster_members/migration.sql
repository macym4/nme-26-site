CREATE TABLE "RosterMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canonicalName" TEXT NOT NULL,
    "pledgeClass" TEXT NOT NULL,
    "aliases" TEXT NOT NULL DEFAULT '[]',
    "dateSheetName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

ALTER TABLE "User" ADD COLUMN "rosterMemberId" TEXT;

CREATE UNIQUE INDEX "RosterMember_canonicalName_key" ON "RosterMember"("canonicalName");
CREATE UNIQUE INDEX "User_rosterMemberId_key" ON "User"("rosterMemberId");

INSERT INTO "RosterMember" ("id", "canonicalName", "pledgeClass", "dateSheetName", "updatedAt") VALUES
('pc25_adelyn_wyndham', 'Adelyn Wyndham', 'PC 25', 'Adelyn Wyndham', CURRENT_TIMESTAMP),
('pc25_ava_illingworth', 'Ava Illingworth', 'PC 25', 'Ava Illingworth', CURRENT_TIMESTAMP),
('pc25_carley_chen', 'Carley Chen', 'PC 25', 'Carley Chen', CURRENT_TIMESTAMP),
('pc25_chloe_dai', 'Chloe Dai', 'PC 25', 'Chloe Dai', CURRENT_TIMESTAMP),
('pc25_divya_krishna', 'Divya Krishna', 'PC 25', 'Divya Krishna', CURRENT_TIMESTAMP),
('pc25_emily_wu', 'Emily Wu', 'PC 25', 'Emily Wu', CURRENT_TIMESTAMP),
('pc25_gbemi_odebode', 'Gbemi Odebode', 'PC 25', 'Gbemi Odebode', CURRENT_TIMESTAMP),
('pc25_georgia_doyle', 'Georgia Doyle', 'PC 25', 'Georgia Doyle', CURRENT_TIMESTAMP),
('pc25_harper_kennedy', 'Harper Kennedy', 'PC 25', 'Harper Kennedy', CURRENT_TIMESTAMP),
('pc25_hudson_francis', 'Hudson Francis', 'PC 25', 'Hudson Francis', CURRENT_TIMESTAMP),
('pc25_jordan_lacsamana', 'Jordan Lacsamana', 'PC 25', 'Jordan Lacsamana', CURRENT_TIMESTAMP),
('pc25_kaaya_mehta', 'Kaaya Mehta', 'PC 25', 'Kaaya Mehta', CURRENT_TIMESTAMP),
('pc25_kaia_tan', 'Kaia Tan', 'PC 25', 'Kaia Tan', CURRENT_TIMESTAMP),
('pc25_keira_olson', 'Keira Olson', 'PC 25', 'Keira Olson', CURRENT_TIMESTAMP),
('pc25_kiara_figueras', 'Kiara Figueras', 'PC 25', 'Kiara Figueras', CURRENT_TIMESTAMP),
('pc25_lia_donley', 'Lia Donley', 'PC 25', 'Lia Donley', CURRENT_TIMESTAMP),
('pc25_lior_aharon', 'Lior Aharon', 'PC 25', 'Lior Aharon', CURRENT_TIMESTAMP),
('pc25_lucy_vanderhoff', 'Lucy Vanderhoff', 'PC 25', 'Lucy Vanderhoff', CURRENT_TIMESTAMP),
('pc25_malena_nabwani', 'Malena Nabwani', 'PC 25', 'Malena Nabwani', CURRENT_TIMESTAMP),
('pc25_mairin_anderson', 'Mairin Anderson', 'PC 25', 'Mairin Anderson', CURRENT_TIMESTAMP),
('pc25_marin_caiola', 'Marin Caiola', 'PC 25', 'Marin Caiola', CURRENT_TIMESTAMP),
('pc25_maya_licznerski', 'Maya Licznerski', 'PC 25', 'Maya Licznerski', CURRENT_TIMESTAMP),
('pc25_mia_dicarlo', 'Mia DiCarlo', 'PC 25', 'Mia DiCarlo', CURRENT_TIMESTAMP),
('pc25_nicolette_xydas', 'Nicolette Xydas', 'PC 25', 'Nicolette Xydas', CURRENT_TIMESTAMP),
('pc25_nina_lomigora', 'Nina Lomigora', 'PC 25', 'Nina Lomigora', CURRENT_TIMESTAMP),
('pc25_nina_navabi', 'Nina Navabi', 'PC 25', 'Nina Navabi', CURRENT_TIMESTAMP),
('pc25_parker_yates', 'Parker Yates', 'PC 25', 'Parker Yates', CURRENT_TIMESTAMP),
('pc25_reid_brown', 'Reid Brown', 'PC 25', 'Reid Brown', CURRENT_TIMESTAMP),
('pc25_ruth_lanouette', 'Ruth Lanouette', 'PC 25', 'Ruth Lanouette', CURRENT_TIMESTAMP),
('pc25_sarah_hourani', 'Sarah Hourani', 'PC 25', 'Sarah Hourani', CURRENT_TIMESTAMP),
('pc25_sienna_wilson', 'Sienna Wilson', 'PC 25', 'Sienna Wilson', CURRENT_TIMESTAMP),
('pc25_sophie_willer_burchardi', 'Sophie Willer-Burchardi', 'PC 25', 'Sophie Willer-Burchardi', CURRENT_TIMESTAMP),
('pc25_jadyn_grant', 'Jadyn Grant', 'PC 25', 'Jadyn Grant', CURRENT_TIMESTAMP);
