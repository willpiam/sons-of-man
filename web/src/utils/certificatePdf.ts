import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export async function downloadOathCertificate(params: {
  signerName: string;
  oathText: string;
  siteUrl: string;
  txUrl: string;
  chainLabel: string;
  txDisplay: string;
}) {
  const { signerName, oathText, siteUrl, txUrl, chainLabel, txDisplay } = params;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const outerMargin = 10;
  const innerMargin = 14;
  const contentLeft = 22;
  const contentRight = pageWidth - 22;
  const contentWidth = contentRight - contentLeft;
  const centerX = pageWidth / 2;
  const accentRgb: [number, number, number] = [180, 150, 80];

  const drawFrame = () => {
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.6);
    doc.rect(outerMargin, outerMargin, pageWidth - outerMargin * 2, pageHeight - outerMargin * 2);
    doc.setLineWidth(0.3);
    doc.rect(innerMargin, innerMargin, pageWidth - innerMargin * 2, pageHeight - innerMargin * 2);
  };
  drawFrame();

  const displayName = String(signerName || '').trim() || 'Anonymous Signer';
  const issuedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let cursorY = 30;

  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(25, 25, 25);
  doc.text('SONS OF MAN', centerX, cursorY, { align: 'center' });
  cursorY += 6;

  doc.setDrawColor(...accentRgb);
  doc.setLineWidth(0.8);
  doc.line(centerX - 30, cursorY, centerX + 30, cursorY);
  cursorY += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(70, 70, 70);
  doc.text('OATH CERTIFICATE', centerX, cursorY, { align: 'center' });
  cursorY += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text('Presented to', centerX, cursorY, { align: 'center' });
  cursorY += 8;

  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text(displayName, centerX, cursorY, { align: 'center', maxWidth: contentWidth });
  cursorY += 8;

  const detailsTop = cursorY;
  const detailsHeight = 30;
  doc.setDrawColor(215, 215, 215);
  doc.setFillColor(245, 245, 245);
  if (typeof doc.roundedRect === 'function') {
    doc.roundedRect(contentLeft, detailsTop, contentWidth, detailsHeight, 2, 2, 'FD');
  } else {
    doc.rect(contentLeft, detailsTop, contentWidth, detailsHeight, 'FD');
  }

  let detailsY = detailsTop + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(65, 65, 65);
  doc.text(`Chain: ${chainLabel}`, contentLeft + 4, detailsY);
  doc.text(`Date: ${issuedDate}`, contentLeft + 70, detailsY);
  detailsY += 7;
  doc.text('Transaction:', contentLeft + 4, detailsY);
  detailsY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(25, 90, 180);
  if (txUrl && typeof doc.textWithLink === 'function') {
    doc.textWithLink(txDisplay, contentLeft + 4, detailsY, { url: txUrl, maxWidth: contentWidth - 8 });
  } else {
    doc.text(txDisplay, contentLeft + 4, detailsY, { maxWidth: contentWidth - 8 });
  }
  doc.setTextColor(40, 40, 40);
  cursorY = detailsTop + detailsHeight + 10;

  const qrUrl = await QRCode.toDataURL(txUrl || siteUrl, { margin: 1, width: 200 });
  const qrSize = 36;
  doc.addImage(qrUrl, 'PNG', centerX - qrSize / 2, cursorY, qrSize, qrSize);
  cursorY += qrSize + 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(95, 95, 95);
  doc.text('Scan to view the on-chain transaction', centerX, cursorY, { align: 'center' });
  cursorY += 10;

  doc.setDrawColor(...accentRgb);
  doc.setLineWidth(0.6);
  doc.line(contentLeft, cursorY, contentRight, cursorY);
  cursorY += 8;

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(13);
  doc.setTextColor(80, 65, 40);
  doc.text('The Oath', centerX, cursorY, { align: 'center' });
  cursorY += 8;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  const oathLines = doc.splitTextToSize(oathText, contentWidth);
  const lineHeight = 5;
  const bottomMargin = 22;
  for (const line of oathLines) {
    if (cursorY + lineHeight > pageHeight - bottomMargin) {
      doc.addPage();
      drawFrame();
      cursorY = 24;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(70, 70, 70);
    }
    doc.text(line, contentLeft, cursorY);
    cursorY += lineHeight;
  }

  const footerY = pageHeight - 20;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(contentLeft, footerY - 4, contentRight, footerY - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Site:', contentLeft, footerY);
  doc.setTextColor(25, 90, 180);
  doc.text(siteUrl, contentLeft + 8, footerY, { maxWidth: contentWidth - 8 });

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  const safeName = signerName.replace(/[^a-z0-9_-]/gi, '_').slice(0, 40) || 'signer';
  doc.save(`sons-of-man-certificate-${safeName}.pdf`);
}
