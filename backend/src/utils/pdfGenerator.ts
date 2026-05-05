import PDFDocument from 'pdfkit';

interface ReceiptItem {
  feeName: string;
  amount: number;
}

interface ReceiptPdfData {
  orNumber: string;
  receiptId: string;
  payerName: string;
  payerAddress?: string;
  billNumber: string;
  paymentDate: Date;
  paymentMethod: string;
  cashierName?: string;
  terminalId?: string;
  items: ReceiptItem[];
  subtotal: number;
  penaltyAmount: number;
  discountAmount: number;
  totalAmount: number;
}

/**
 * Generate an Official Receipt PDF buffer.
 */
export async function generateReceiptPDF(data: ReceiptPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PAGE_WIDTH = doc.page.width - 80; // account for margins
    const PRIMARY = '#0D47A1';

    // ── Header ──────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 70).fill(PRIMARY);
    doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
      .text('OFFICIAL RECEIPT', 40, 15, { align: 'center', width: PAGE_WIDTH + 40 });
    doc.fontSize(10).font('Helvetica')
      .text('Municipality of Majayjay, Laguna', 40, 38, { align: 'center', width: PAGE_WIDTH + 40 });
    doc.text('LGU Billing & Payment System', 40, 52, { align: 'center', width: PAGE_WIDTH + 40 });

    doc.fillColor('#333333');
    let y = 90;

    // ── OR Info row ──────────────────────────────────────────────────
    doc.fontSize(9).font('Helvetica-Bold').fillColor(PRIMARY)
      .text('OR NUMBER:', 40, y)
      .fillColor('#000').font('Helvetica').text(data.orNumber, 120, y);
    doc.font('Helvetica-Bold').fillColor(PRIMARY)
      .text('DATE:', 300, y)
      .fillColor('#000').font('Helvetica').text(data.paymentDate.toLocaleDateString('en-PH', { dateStyle: 'medium' }), 340, y);
    y += 16;

    doc.font('Helvetica-Bold').fillColor(PRIMARY).text('BILL NO:', 40, y)
      .fillColor('#000').font('Helvetica').text(data.billNumber, 120, y);
    doc.font('Helvetica-Bold').fillColor(PRIMARY).text('METHOD:', 300, y)
      .fillColor('#000').font('Helvetica').text(data.paymentMethod, 340, y);
    y += 16;

    if (data.cashierName) {
      doc.font('Helvetica-Bold').fillColor(PRIMARY).text('CASHIER:', 40, y)
        .fillColor('#000').font('Helvetica').text(data.cashierName, 120, y);
      if (data.terminalId) {
        doc.font('Helvetica-Bold').fillColor(PRIMARY).text('TERMINAL:', 300, y)
          .fillColor('#000').font('Helvetica').text(data.terminalId, 360, y);
      }
      y += 16;
    }

    // ── Payer Info ──────────────────────────────────────────────────
    y += 6;
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).stroke('#CCCCCC');
    y += 8;

    doc.font('Helvetica-Bold').fillColor(PRIMARY).text('PAID BY:', 40, y)
      .fillColor('#000').font('Helvetica').text(data.payerName, 120, y);
    y += 14;

    if (data.payerAddress) {
      doc.font('Helvetica-Bold').fillColor(PRIMARY).text('ADDRESS:', 40, y)
        .fillColor('#000').font('Helvetica').text(data.payerAddress, 120, y);
      y += 14;
    }

    // ── Items Table ──────────────────────────────────────────────────
    y += 6;
    doc.rect(40, y, PAGE_WIDTH, 18).fill(PRIMARY);
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      .text('DESCRIPTION', 48, y + 4, { width: 250 })
      .text('AMOUNT (PHP)', 290, y + 4, { width: 100, align: 'right' });
    doc.fillColor('#333333').font('Helvetica');
    y += 22;

    for (const item of data.items) {
      const rowBg = data.items.indexOf(item) % 2 === 0 ? '#F5F7FA' : '#FFFFFF';
      doc.rect(40, y - 2, PAGE_WIDTH, 16).fill(rowBg);
      doc.fillColor('#333').fontSize(9).font('Helvetica')
        .text(item.feeName, 48, y, { width: 250 })
        .text(`₱${item.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 290, y, { width: 100, align: 'right' });
      y += 16;
    }

    // ── Totals ──────────────────────────────────────────────────────
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).stroke('#CCCCCC');
    y += 8;

    const totalsLeft = 250;
    if (data.penaltyAmount > 0) {
      doc.fontSize(9).font('Helvetica').fillColor('#F44336')
        .text('Penalty:', totalsLeft, y, { width: 80, align: 'right' })
        .text(`₱${data.penaltyAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 340, y, { width: 50, align: 'right' });
      y += 14;
    }
    if (data.discountAmount > 0) {
      doc.fontSize(9).font('Helvetica').fillColor('#4CAF50')
        .text('Discount:', totalsLeft, y, { width: 80, align: 'right' })
        .text(`-₱${data.discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 340, y, { width: 50, align: 'right' });
      y += 14;
    }

    doc.rect(totalsLeft - 10, y, PAGE_WIDTH - totalsLeft + 50, 22).fill(PRIMARY);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
      .text('TOTAL PAID:', totalsLeft, y + 5, { width: 80, align: 'right' })
      .text(`₱${data.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 340, y + 5, { width: 50, align: 'right' });
    doc.fillColor('#333');
    y += 32;

    // ── Footer ──────────────────────────────────────────────────────
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).stroke('#CCCCCC');
    y += 10;
    doc.fontSize(8).fillColor('#757575').font('Helvetica')
      .text('This is a computer-generated receipt and is valid without signature.', 40, y, { align: 'center', width: PAGE_WIDTH })
      .text(`Receipt ID: ${data.receiptId}`, 40, y + 12, { align: 'center', width: PAGE_WIDTH })
      .text('Majayjay, Laguna 4019 | lgubilling@majayjay.gov.ph', 40, y + 24, { align: 'center', width: PAGE_WIDTH });

    doc.end();
  });
}
