import QRCode from 'qrcode';

export interface QRPaymentData {
  transactionId: string;
  amount: number;
  currency: string;
  feeType: string;
  payerReference?: string;
  dueDate?: string;
  systemId: string;
  paymentUrl: string;
}

export async function generateQRCode(data: QRPaymentData): Promise<string> {
  const encoded = JSON.stringify(data);
  return QRCode.toDataURL(encoded, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 300,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}

export async function generateQRCodeBuffer(data: QRPaymentData): Promise<Buffer> {
  const encoded = JSON.stringify(data);
  return QRCode.toBuffer(encoded, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 300,
  });
}
