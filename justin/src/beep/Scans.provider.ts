import {Injectable} from '@angular/core';
import {Scan} from './Scan.model';
import {ProductsProvider} from './../models/Products.provider';

@Injectable()
export class ScansProvider {
  list: Array<Scan> = [];
  constructor(public productsProvider: ProductsProvider) {
  }
  public remove(barcode):Scan {
    var scan;
    var idx = this.list.findIndex((s: Scan) => s.barcode == barcode);
    if (idx != -1) {
      scan = this.list[idx];
      this.list.splice(idx,1).pop();
    } else {
      let products = this.productsProvider.getProducts(barcode).filter(function nonReceptionné(p) {
        return p.nextSteps() == "receptionner";
      });
      /* because we no longer expect a list from the server, we create a product for everyone */
      if (products.length == 0) {
        products.push(this.productsProvider.newProduct(barcode));
      }
      scan = new Scan(barcode, 0, products);
    }
    return scan
  }
  get() {
    return this.list;
  }
  addOne(barcode) {
    var scan = this.remove(barcode);
    scan.qty++;
    this.list.unshift(scan);
  }
  decreaseOne(scan:Scan) {
    scan.qty--;
    if (scan.qty == 0){
      let idx = this.list.indexOf(scan);
      this.list.splice(idx,1);
    }
  }
  reset() {
    this.list = [];
    return this.list;
  }
  validate() {
    return this.productsProvider.doReception(this.list).then(
      () => {
      this.list.forEach( scan => {
        if (!scan.products)
          return;
        for (let i = Math.min(scan.qty, scan.expected) - 1; i >= 0; i = i-1) {
            scan.products[i].receptionner();
        }
      });
    });
  }
};
