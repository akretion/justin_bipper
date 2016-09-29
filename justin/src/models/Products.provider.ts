import {Injectable} from "@angular/core";
import {Http} from '@angular/http';
//import {Product} from '../statemachine/src/states.js';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';

declare var Product:any;
declare var Shipment:any;
declare var Pack:any;

@Injectable()
export class ProductsProvider {
  productsLookup: Map<any, any>;
  packsLookup: Map<any, any>;
  shipsLookup: Map<any, any>;
  constructor(public http: Http) {
    console.log('Dans products provider');
    this.packsLookup = new Map();
    this.shipsLookup = new Map();
    this.productsLookup = new Map();
    http.get('expected_products.json').map(res => {
      let body = res.json();

      body.forEach((s) => {

        s.transferts.map( t => { //faudrait qu'on sérialise tout l'arbre
          let ship = new Shipment();
          ship.créer();
          ship.name = t.name;
          if (t.state)
            ship.stateMachine.state = t.state;
          this.shipsLookup.set(t.name, ship);


          t.packs.map((packname) => {
            let pack = new Pack();
            pack.stateMachine.state = packname.state;
            pack.name = packname.name;
            pack.weight = packname.weight;
            pack.shipment = ship;
            pack.locationSM.state = packname.location;
            pack.place = packname.place;
            ship.packs.push(pack);
            this.packsLookup.set(packname.name, pack);
          });

          t.lines.map( (l) => {
            let p = new Product();
            p.name = l.name;
            if (!this.productsLookup.has(l.name)) {
              this.productsLookup.set(l.name, {'ship': null, packs: new Map(), products: []});
            }
            let lk = this.productsLookup.get(l.name);
            lk.ship = ship;
            lk.products.push(p);

            ship.products.push(p);
            if (l.state)
              p.stateMachine.state = l.state;

            if (l.pack) {
              let pack = this.packsLookup.get(l.pack);
              p.pack = pack;
              pack.products.push(p);
              lk.packs.set(pack.name, pack);
            }
          });
        });
      });
      console.log('products', this.productsLookup);
    }).subscribe();
    console.log('juste après');
  }
  lookupProduct(barcode) {
    return this.productsLookup.get(barcode);
  }
  lookupShipment(barcode) {
    return this.shipsLookup.get(barcode);
  }
  getProducts(barcode) {
    console.log('get product', barcode, this.productsLookup.get(barcode))
    var ship = this.getShipment(barcode);
    if (!ship)
      return [];
    return ship.products.filter( (l) => l.name == barcode);
  }
  getShipment(barcode) {
    let lk = this.productsLookup.get(barcode);
    if (!lk)
      return null; //TODO rejeter une promesse
    return lk.ship
  }
  getPack(barcode) {
    return this.packsLookup.get(barcode);
  }
  addPack(pack) {
    return this.packsLookup.set(pack.name, pack);
  }
  getReserved() {
    return Array.from(this.packsLookup.values()).filter(
      (p) => p.locationSM.state == 'stock'
    );
  }
}
