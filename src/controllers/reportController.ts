import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { PaymentTransaction } from '../models/PaymentTransaction.js';

/**
 * Génère un PDF contenant toutes les transactions payantes validées (PAID).
 * Chaque ligne : Votant | Téléphone | Nominé | Catégorie | Voix | Montant (FC) | Date/Heure
 */
export const generateTransactionsPdf = async (req: Request, res: Response) => {
  try {
    // Récupération des transactions PAID avec les données populées
    const transactions = await PaymentTransaction.find({ status: 'PAID' })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName phone')
      .populate({
        path: 'voteId',
        select: 'points nomineeId categoryId confirmedAt',
        populate: [
          { path: 'nomineeId', select: 'fullName' },
          { path: 'categoryId', select: 'name' },
        ],
      });

    // ─── Création du document PDF ──────────────────────────────────────────
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    // Headers HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="kingabwa-awards-transactions-${new Date().toISOString().slice(0, 10)}.pdf"`
    );

    doc.pipe(res);

    // ─── En-tête du document ───────────────────────────────────────────────
    doc
      .fontSize(20)
      .fillColor('#B8860B')
      .text('KINGABWA AWARDS 2026', { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(13)
      .fillColor('#333333')
      .text('Rapport des Transactions Mobile Money — Votes Payants Validés', { align: 'center' })
      .moveDown(0.2);

    doc
      .fontSize(9)
      .fillColor('#666666')
      .text(
        `Généré le ${new Intl.DateTimeFormat('fr-CD', {
          dateStyle: 'full',
          timeStyle: 'short',
        }).format(new Date())} — ${transactions.length} transaction(s)`,
        { align: 'center' }
      )
      .moveDown(1.5);

    // ─── En-têtes du tableau ───────────────────────────────────────────────
    const cols = {
      num:       { x: 40,  w: 28 },
      votant:    { x: 68,  w: 120 },
      telephone: { x: 188, w: 90 },
      nomine:    { x: 278, w: 120 },
      categorie: { x: 398, w: 110 },
      voix:      { x: 508, w: 45 },
      montant:   { x: 553, w: 70 },
      date:      { x: 623, w: 115 },
    };

    const rowH = 22;
    const headerY = doc.y;

    // Fond en-tête
    doc
      .rect(40, headerY, 698, rowH)
      .fillColor('#1a1a2e')
      .fill();

    doc.fontSize(8).fillColor('#FFD700');
    doc.text('#',            cols.num.x,       headerY + 7, { width: cols.num.w,       align: 'center' });
    doc.text('VOTANT',       cols.votant.x,    headerY + 7, { width: cols.votant.w,    align: 'left'   });
    doc.text('TÉLÉPHONE',    cols.telephone.x, headerY + 7, { width: cols.telephone.w, align: 'left'   });
    doc.text('NOMINÉ',       cols.nomine.x,    headerY + 7, { width: cols.nomine.w,    align: 'left'   });
    doc.text('CATÉGORIE',    cols.categorie.x, headerY + 7, { width: cols.categorie.w, align: 'left'   });
    doc.text('VOIX',         cols.voix.x,      headerY + 7, { width: cols.voix.w,      align: 'center' });
    doc.text('MONTANT (FC)', cols.montant.x,   headerY + 7, { width: cols.montant.w,   align: 'right'  });
    doc.text('DATE/HEURE',   cols.date.x,      headerY + 7, { width: cols.date.w,      align: 'left'   });

    doc.moveDown(0);

    // ─── Lignes du tableau ─────────────────────────────────────────────────
    let currentY = headerY + rowH + 2;
    let totalAmount = 0;
    let totalVoix = 0;

    transactions.forEach((tx, idx) => {
      // Nouvelle page si besoin
      if (currentY + rowH > doc.page.height - 80) {
        doc.addPage();
        currentY = 40;
      }

      const isEven = idx % 2 === 0;
      doc
        .rect(40, currentY, 698, rowH)
        .fillColor(isEven ? '#f9f9f9' : '#ffffff')
        .fill();

      const user = tx.userId as any;
      const vote = tx.voteId as any;

      const votantName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Inconnu'
        : 'Inconnu';
      const phone    = user?.phone || '—';
      const nomine   = vote?.nomineeId?.fullName || '—';
      const categorie = vote?.categoryId?.name || tx.metadata?.categoryId || '—';
      const voix     = vote?.points ?? tx.metadata?.increments ?? 0;
      const montant  = tx.amount || 0;
      const dateStr  = new Intl.DateTimeFormat('fr-CD', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(tx.createdAt));

      totalAmount += montant;
      totalVoix   += voix;

      doc.fontSize(8).fillColor('#222222');
      doc.text(String(idx + 1),          cols.num.x,       currentY + 7, { width: cols.num.w,       align: 'center' });
      doc.text(votantName,               cols.votant.x,    currentY + 7, { width: cols.votant.w,    align: 'left', ellipsis: true });
      doc.text(phone,                    cols.telephone.x, currentY + 7, { width: cols.telephone.w, align: 'left' });
      doc.text(nomine,                   cols.nomine.x,    currentY + 7, { width: cols.nomine.w,    align: 'left', ellipsis: true });
      doc.text(categorie,                cols.categorie.x, currentY + 7, { width: cols.categorie.w, align: 'left', ellipsis: true });
      doc.text(String(voix),             cols.voix.x,      currentY + 7, { width: cols.voix.w,      align: 'center' });
      doc.text(montant.toLocaleString(), cols.montant.x,   currentY + 7, { width: cols.montant.w,   align: 'right' });
      doc.text(dateStr,                  cols.date.x,      currentY + 7, { width: cols.date.w,      align: 'left' });

      // Séparateur léger
      doc
        .moveTo(40, currentY + rowH)
        .lineTo(738, currentY + rowH)
        .strokeColor('#e0e0e0')
        .lineWidth(0.5)
        .stroke();

      currentY += rowH;
    });

    // ─── Ligne de total ────────────────────────────────────────────────────
    currentY += 4;
    if (currentY + 30 > doc.page.height - 60) {
      doc.addPage();
      currentY = 40;
    }

    doc
      .rect(40, currentY, 698, 26)
      .fillColor('#1a1a2e')
      .fill();

    doc.fontSize(9).fillColor('#FFD700');
    doc.text(`TOTAL : ${transactions.length} transactions`, cols.votant.x, currentY + 8, {
      width: 300,
      align: 'left',
    });
    doc.text(`${totalVoix} voix`, cols.voix.x, currentY + 8, {
      width: cols.voix.w,
      align: 'center',
    });
    doc.text(`${totalAmount.toLocaleString()} FC`, cols.montant.x, currentY + 8, {
      width: cols.montant.w,
      align: 'right',
    });

    // ─── Pied de page ─────────────────────────────────────────────────────
    doc
      .moveDown(3)
      .fontSize(8)
      .fillColor('#999999')
      .text(
        '© Kingabwa Awards 2026 — Document confidentiel généré automatiquement. Tous droits réservés.',
        { align: 'center' }
      );

    doc.end();
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};
