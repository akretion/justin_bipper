import {Injectable} from "@angular/core";
import {Http} from '@angular/http';
import {Product, Pack, Shipment} from '../statemachine/src/states.js';
import {odooService} from '../angular-odoo/odoo';

import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/observable/never';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/interval';


@Injectable()
export class ProductsProvider {
  productsLookup: Map<any, any>;
  packsLookup: Map<any, any>;
  shipsLookup: Map<any, any>;
  lastUpdate: any;
  pauser: any;
  constructor(public http: Http, public odoo: odooService) {
    console.log('Dans products provider');

    this.packsLookup = new Map();
    this.shipsLookup = new Map();
    this.productsLookup = new Map();

    this.lastUpdate = new Subject();
    this.pauser = new Subject();

    var concurrent = 0;

    var odooFetch = (sub) => {
      concurrent++;
      if (concurrent > 8) {
        this.pauser.next(true);
        throw "To many concurrent requests";
      }

      console.log('call bipper.webservice', sub);
      return odoo.call('bipper.webservice', 'get_all_receptions', [], {}).then(
        x => {
          concurrent--;
          this.packsLookup = new Map();
          this.shipsLookup = new Map();
          this.productsLookup = new Map();

          console.log('all receptions are belong to us');
          this.lastUpdate.next(Date());
          x.forEach(
            s => {
              var ship = buildShip(s);
              this.shipsLookup.set(ship.name, ship)


              s.packs.forEach(
                p => {
                  var pack = buildPack(p, ship);
                  this.packsLookup.set(pack.name, pack);
                  ship.packs.push(pack);
                  console.log('on emballe', pack.name)
                  //PACK0000003
                }
              );
              s.lines.forEach(
                p => {
                  var prod = buildProduct(p);

                  if (!this.productsLookup.has(p.name)) {
                    this.productsLookup.set(p.name, {'ship': null, packs: new Map(), products: []});
                  }
                  let lk = this.productsLookup.get(p.name);
                  lk.ship = ship;
                  lk.products.push(prod);
                  ship.products.push(prod);
                  let pack = this.packsLookup.get(p.pack);
                  if (pack) {
                    lk.packs.set(pack.name, pack);
                    pack.products.push(prod);
                  }
                }
              );

            });
          }, (err) => {
            concurrent--;
            this.pauser.next(true);
          }
      );
    };

    this.pauser
      .switchMap((paused) => paused ? Observable.never(): Observable.interval(40000).startWith(0))
      .subscribe(odooFetch)

    this.pauser.next(false);

    function buildShip(s) {
      var ship = new Shipment();
      ship.créer();
      ship.name = s.name;
      return ship;
    }

    function buildProduct(p) {
      var prod = new Product();
      prod.name = p.name;
      prod.stateMachine.state = p.state;
      return prod;
    }
    function buildPack(p, shipment) {
      var pack = new Pack();
      pack.name = p.name;
      pack.weight = p.weight;
      pack.shipment = shipment;
      pack.stateMachine.state = p.state;
      if (!p.state){
        console.log('init state par défaut')
        pack.stateMachine.state = 'colisé';
      }
      if (!p.location) {
        console.log('c pas bien ca');
        //a virer quand le state sera fourni par odoo
        pack.locationSM.state = 'transit';
      }
      return pack;
    }
  }
  explicitRefresh() {
    this.pauser.next(false);
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
  newProduct(barcode) {
    let product = new Product();
    product.name = barcode;
    return product;
  }
  doReception(list) {
    /* receptionne la liste */
    console.log('list', list);
    var payload = {}
    list.forEach(l => {
      payload[l.barcode] =l.qty
    });
    return this.odoo.call( 'bipper.webservice', 'do_lot_reception', [payload], {}).then(
      null, x => Promise.reject(x.message)
    );
  }
}
