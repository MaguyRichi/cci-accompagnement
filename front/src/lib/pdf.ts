import jsPDF from "jspdf";

/* ============================================
   HELPERS
   ============================================ */
const formatDate = (date?: string | Date): string => {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatNumber = (value?: number | string): string => {
  if (value === undefined || value === null || value === "") return "—";
  return Number(value).toLocaleString("fr-FR");
};

const safeString = (value: any, fallback = "—"): string => {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s.length > 0 ? s : fallback;
};

const extractDirigeantInfo = (raw: any) => {
  const utilisateur = raw?.utilisateur ?? raw?.user ?? null;
  return {
    prenom: safeString(utilisateur?.prenom ?? raw?.prenom, ""),
    nom: safeString(utilisateur?.nom ?? raw?.nom, ""),
    email: safeString(utilisateur?.email ?? raw?.email, ""),
    telephone: safeString(utilisateur?.telephone ?? raw?.telephone, ""),
  };
};

const extractFormationInfo = (raw: any) => {
  const session = raw?.session ?? raw?.sessionFPD ?? null;
  return {
    nom: safeString(session?.nom ?? raw?.sessionNom ?? raw?.nomFormation, "Formation FPD"),
    metier: safeString(session?.metier ?? raw?.metier, ""),
    description: safeString(session?.description ?? raw?.description, ""),
    lieu: safeString(session?.lieuFormation ?? raw?.lieuFormation, ""),
    dateDebut: session?.dateDebut ?? raw?.dateDebut ?? null,
    dateFin: session?.dateFin ?? raw?.dateFin ?? null,
  };
};

/* ============================================
   HEADER COMMUN
   ============================================ */
const drawHeader = (doc: jsPDF, titre: string, sousTitre?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(2, 36, 72);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CCI HAUTE MATSIATRA", 15, 15);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Chambre de Commerce et d'Industrie — Matsiatra Ambony", 15, 22);
  doc.text("Fianarantsoa, Madagascar", 15, 28);

  doc.setTextColor(2, 36, 72);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(titre, 15, 50);

  if (sousTitre) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(sousTitre, 15, 58);
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, sousTitre ? 63 : 56, pageWidth - 15, sousTitre ? 63 : 56);
};

/* ============================================
   FOOTER COMMUN
   ============================================ */
const drawFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");

  doc.text(
    `Document généré le ${new Date().toLocaleString("fr-FR")}`,
    15,
    pageHeight - 15,
  );

  doc.text(
    "Portail Officiel CCI Haute Matsiatra — Décret 2023-145",
    pageWidth - 15,
    pageHeight - 15,
    { align: "right" },
  );
};

/* ============================================
   FICHE ENTREPRISE PDF
   ============================================ */
export const generateFicheEntreprisePDF = (entreprise: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 75;

  drawHeader(
    doc,
    "FICHE ENTREPRISE",
    `Référence : CCI-HM-ENT-${String(entreprise.id).padStart(4, "0")}`,
  );

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 36, 72);
  doc.text(entreprise.raisonSociale || "—", 15, y);
  y += 8;

  if (entreprise.sigle) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Sigle : ${entreprise.sigle}`, 15, y);
    y += 6;
  }

  if (entreprise.verifie) {
    doc.setFillColor(160, 243, 153);
    doc.roundedRect(pageWidth - 60, y - 8, 45, 7, 2, 2, "F");
    doc.setTextColor(0, 82, 4);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("✓ VÉRIFIÉ CCI", pageWidth - 57, y - 3);
  }

  y += 10;

  doc.setFillColor(240, 243, 255);
  doc.rect(15, y, pageWidth - 30, 8, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 36, 72);
  doc.text("IDENTITÉ DE L'ENTREPRISE", 18, y + 5.5);
  y += 14;

  const identiteData = [
    ["Raison sociale", entreprise.raisonSociale || "—"],
    ["NIF", entreprise.nif || "—"],
    ["STAT", entreprise.stat || "—"],
    ["RCS", entreprise.rcs || "—"],
    ["Forme juridique", entreprise.formeJuridique || "—"],
    ["Secteur d'activité", entreprise.secteur || "—"],
    ["Taille", entreprise.taille || "—"],
    ["Effectif", entreprise.effectif ? `${entreprise.effectif} employés` : "—"],
    [
      "Chiffre d'affaires",
      entreprise.chiffreAffaires
        ? `${formatNumber(entreprise.chiffreAffaires)} MGA`
        : "—",
    ],
    ["Date de création", formatDate(entreprise.anneeCreation)],
  ];

  doc.setFontSize(9);
  identiteData.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 18 : pageWidth / 2;
    const yPos = y + row * 7;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(`${label} :`, x, yPos);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(String(value), x + 42, yPos);
  });

  y += Math.ceil(identiteData.length / 2) * 7 + 8;

  doc.setFillColor(240, 243, 255);
  doc.rect(15, y, pageWidth - 30, 8, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 36, 72);
  doc.text("LOCALISATION", 18, y + 5.5);
  y += 14;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 20, 20);
  doc.text(`Adresse : ${entreprise.adresse || "—"}`, 18, y);
  y += 6;
  doc.text(`Ville : ${entreprise.ville || "—"}`, 18, y);
  y += 6;
  doc.text(`Région : ${entreprise.region || "—"}`, 18, y);
  y += 6;
  doc.text(`Téléphone : ${entreprise.telephone || "—"}`, 18, y);
  y += 6;
  doc.text(`Email : ${entreprise.email || "—"}`, 18, y);
  y += 6;
  if (entreprise.siteWeb) {
    doc.text(`Site web : ${entreprise.siteWeb}`, 18, y);
    y += 6;
  }

  y += 5;

  if (entreprise.description) {
    doc.setFillColor(240, 243, 255);
    doc.rect(15, y, pageWidth - 30, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(2, 36, 72);
    doc.text("DESCRIPTION", 18, y + 5.5);
    y += 14;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);

    const lines = doc.splitTextToSize(entreprise.description, pageWidth - 36);
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 18, y);
      y += 5;
    });
    y += 5;
  }

  if (entreprise.mentor) {
    doc.setFillColor(240, 243, 255);
    doc.rect(15, y, pageWidth - 30, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(2, 36, 72);
    doc.text("MENTOR CONSULAIRE", 18, y + 5.5);
    y += 14;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(`${entreprise.mentor.prenom || ""} ${entreprise.mentor.nom || ""}`, 18, y);
    y += 6;
    doc.text(`Domaine : ${entreprise.mentor.domaineMentor || "—"}`, 18, y);
    y += 6;
    doc.text(`Note : ${Number(entreprise.mentor.noteMoyenne || 0).toFixed(1)}/5`, 18, y);
    y += 6;
  }

  drawFooter(doc);

  const filename = `Fiche_${entreprise.raisonSociale?.replace(/\s+/g, "_")}_CCI.pdf`;
  doc.save(filename);
};

/* ============================================
   RAPPORT DIAGNOSTIC PDF
   ============================================ */
export const generateRapportDiagnosticPDF = (diagnostic: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 75;

  drawHeader(doc, "RAPPORT DE DIAGNOSTIC 360°", `Référence : ${diagnostic.reference || "—"}`);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 36, 72);
  doc.text(diagnostic.entreprise?.raisonSociale || "Entreprise", 15, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Diagnostic réalisé le ${formatDate(diagnostic.createdAt)}`, 15, y);
  y += 12;

  doc.setFillColor(2, 36, 72);
  doc.rect(15, y, pageWidth - 30, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("SCORE GLOBAL DE MATURITÉ", 20, y + 8);

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(`${diagnostic.scoreGlobal}`, 20, y + 24);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("/ 100", 45, y + 24);

  doc.setFontSize(11);
  const niveauLabel: Record<string, string> = {
    DEBUTANT: "Débutant",
    INTERMEDIAIRE: "Intermédiaire",
    AVANCE: "Avancé",
    EXCELLENCE: "Excellence",
  };
  doc.text(`Niveau : ${niveauLabel[diagnostic.niveau] || "—"}`, pageWidth - 80, y + 15);

  y += 40;

  doc.setFillColor(240, 243, 255);
  doc.rect(15, y, pageWidth - 30, 8, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 36, 72);
  doc.text("SCORES PAR AXE STRATÉGIQUE", 18, y + 5.5);
  y += 14;

  const scores = diagnostic.scoresParCategorie || {};
  const categories = Object.entries(scores);

  doc.setFontSize(9);
  categories.forEach(([cat, score]: [string, any]) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    const scoreNum = Number(score);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(cat, 18, y);

    doc.setFont("helvetica", "normal");
    doc.text(`${scoreNum.toFixed(1)} / 100`, pageWidth - 50, y, {
      align: "right",
    });

    const barWidth = pageWidth - 100;
    const barX = 70;
    doc.setFillColor(220, 220, 220);
    doc.rect(barX, y - 3, barWidth, 4, "F");

    if (scoreNum >= 85) doc.setFillColor(27, 109, 36);
    else if (scoreNum >= 70) doc.setFillColor(30, 58, 95);
    else if (scoreNum >= 50) doc.setFillColor(240, 137, 33);
    else doc.setFillColor(186, 26, 26);

    doc.rect(barX, y - 3, (barX * 0 + barWidth * scoreNum) / 100, 4, "F");

    y += 8;
  });

  y += 6;

  if (diagnostic.pointsForts && diagnostic.pointsForts.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(160, 243, 153);
    doc.rect(15, y, pageWidth - 30, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 82, 4);
    doc.text("POINTS FORTS", 18, y + 5.5);
    y += 14;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    diagnostic.pointsForts.forEach((p: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`✓ ${p}`, 20, y);
      y += 6;
    });
    y += 6;
  }

  if (diagnostic.pointsAmeliorer && diagnostic.pointsAmeliorer.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(255, 220, 195);
    doc.rect(15, y, pageWidth - 30, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(90, 46, 0);
    doc.text("AXES D'AMÉLIORATION", 18, y + 5.5);
    y += 14;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    diagnostic.pointsAmeliorer.forEach((p: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`→ ${p}`, 20, y);
      y += 6;
    });
    y += 6;
  }

  if (diagnostic.recommandations && diagnostic.recommandations.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(30, 58, 95);
    doc.rect(15, y, pageWidth - 30, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("RECOMMANDATIONS PRIORITAIRES", 18, y + 5.5);
    y += 14;

    diagnostic.recommandations.forEach((reco: any, i: number) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(30, 58, 95);
      doc.circle(20, y - 1, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(String(i + 1), 20, y, { align: "center" });

      doc.setTextColor(2, 36, 72);
      doc.setFontSize(10);
      const titre = doc.splitTextToSize(reco.titre || "", pageWidth - 50);
      doc.text(titre, 27, y);
      y += titre.length * 5 + 2;

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const desc = doc.splitTextToSize(reco.description || "", pageWidth - 50);
      doc.text(desc, 27, y);
      y += desc.length * 4 + 6;
    });
  }

  drawFooter(doc);

  const filename = `Rapport_Diagnostic_${diagnostic.reference || "CCI"}.pdf`;
  doc.save(filename);
};

/* ============================================
   CERTIFICAT FPD PDF
   ============================================ */
export const generateCertificatFPD = (inscription: any) => {
  const dirigeant = extractDirigeantInfo(inscription);
  const formation = extractFormationInfo(inscription);

  const METIERS_LABEL: Record<string, string> = {
    HOTELLERIE_TOURISME: "Hôtellerie & Tourisme",
    SECRETARIAT: "Secrétariat",
    GESTION_COMPTABILITE: "Gestion & Comptabilité",
    ASSISTANT_BANCAIRE: "Assistant Bancaire",
  };

  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // === CADRE DÉCORATIF ===
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setDrawColor(212, 175, 55); // Or
  doc.setLineWidth(1);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

  // === HEADER ===
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text("CHAMBRE DE COMMERCE ET D'INDUSTRIE", pageWidth / 2, 30, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("DE HAUTE MATSIATRA — MATSIATRA AMBONY", pageWidth / 2, 36, {
    align: "center",
  });

  // === TITRE ===
  doc.setFontSize(36);
  doc.setFont("times", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text("CERTIFICAT", pageWidth / 2, 70, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("times", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("de fin de formation", pageWidth / 2, 82, { align: "center" });

  // === MENTION ===
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(
    "Le Président de la Chambre de Commerce et d'Industrie de Haute Matsiatra",
    pageWidth / 2,
    105,
    { align: "center" },
  );
  doc.text("certifie que", pageWidth / 2, 112, { align: "center" });

  // === NOM DU DIRIGEANT (en Italique comme demandé) ===
  const prenomNom = `${dirigeant.prenom} ${dirigeant.nom}`.trim() || "—";
  const prenomNomUpper = prenomNom === "—" ? "—" : prenomNom.toUpperCase();

  doc.setFontSize(28);
  doc.setFont("times", "bolditalic"); // ✅ ITALIQUE + GRAS
  doc.setTextColor(0, 0, 0);
  doc.text(prenomNomUpper, pageWidth / 2, 135, { align: "center" });

  // Ligne sous le nom
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  const nameWidth = doc.getTextWidth(prenomNomUpper) * 0.6;
  doc.line(pageWidth / 2 - nameWidth, 138, pageWidth / 2 + nameWidth, 138);

  // === TEXTE ===
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    "a suivi avec succès la Formation Professionnelle Duale (FPD)",
    pageWidth / 2,
    150,
    { align: "center" },
  );

  // === NOM DE LA FORMATION ===
  const formationNom = formation.nom || "Formation FPD";
  const metierLabel =
    METIERS_LABEL[formation.metier] || formation.metier || "FPD";

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text(`« ${formationNom} »`, pageWidth / 2, 160, { align: "center" });

  if (metierLabel && metierLabel !== "FPD") {
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    doc.text(`Filière : ${metierLabel}`, pageWidth / 2, 168, {
      align: "center",
    });
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(
    `selon le programme « Apprendre en travaillant » — Hambourg / Madagascar.`,
    pageWidth / 2,
    178,
    { align: "center" },
  );

  // === SCORE ===
  const note = inscription?.noteMentor ?? inscription?.noteFinale ?? inscription?.note ?? null;
  if (note !== null && note !== undefined && !isNaN(Number(note))) {
    doc.setFontSize(11);
    doc.text(
      `Note finale : ${Number(note).toFixed(2)} / 20`,
      pageWidth / 2,
      188,
      { align: "center" },
    );
  }

  // === DATES ===
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  const dateDebut = formation.dateDebut
    ? new Date(formation.dateDebut).toLocaleDateString("fr-FR")
    : "—";
  const dateFin = formation.dateFin
    ? new Date(formation.dateFin).toLocaleDateString("fr-FR")
    : "—";

  doc.text(`Formation effectuée à Fianarantsoa`, pageWidth / 2, 200, {
    align: "center",
  });
  doc.text(`du ${dateDebut} au ${dateFin}`, pageWidth / 2, 206, {
    align: "center",
  });

  // === SIGNATURE ===
  const today = new Date();
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 95);
  doc.text(
    `Fait à Fianarantsoa, le ${today.toLocaleDateString("fr-FR")}`,
    pageWidth - 70,
    220,
  );

  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 110, 245, pageWidth - 30, 245);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Le Président de la CCIHM", pageWidth - 70, 250, { align: "center" });

  // === RÉFÉRENCE ===
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Référence : ${safeString(inscription?.certificatNumero, "—")}`,
    20,
    pageHeight - 18,
  );

  // === SAVE ===
  const safeName = `${dirigeant.prenom || "dirigeant"}-${dirigeant.nom || ""}`
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  const filename = `Certificat_FPD_${safeName || "dirigeant"}.pdf`;
  doc.save(filename);
};