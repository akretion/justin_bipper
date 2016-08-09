export class Scan {
  barcode: string;
  qty: number = 0;
  constructor(barcode, qty) {
    this.barcode = barcode;
    this.qty = qty;
  }
};
