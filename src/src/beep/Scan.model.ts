export class Scan {
  barcode: string;
  qty: number = 0;
  expected: number = 0;
  products: any = [];
  constructor(barcode, qty, products) {
    this.barcode = barcode;
    this.qty = qty;
    this.expected = (products) ? products.length : 0;
    this.products = products;
  }
};
