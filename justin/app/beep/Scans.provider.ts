import {Injectable} from '@angular/core';
import {Scan} from './Scan.model';

@Injectable()
export class ScansProvider {
  list: Array<Scan> = [];
  constructor() {
  }
  private remove(barcode):Scan {
    var idx = this.list.findIndex((s: Scan) => s.barcode == barcode);
    if (idx != -1)
      return this.list.splice(idx,1).pop();
    return new Scan(barcode, 0);
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
};
