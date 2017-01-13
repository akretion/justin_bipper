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

          this.lastUpdate.next(Date());
          x.forEach(
            s => {
              var ship = buildShip(s);
              this.shipsLookup.set(ship.name, ship)

              s.packs.forEach(
                p => {
                  var pack = buildPack(p, ship);
                  this.packsLookup.set(pack.name, pack);
                }
              );
              s.lines.forEach(
                p => {
                  if (!this.productsLookup.has(p.name))
                    this.productsLookup.set(p.name, []);
                  let pack = this.packsLookup.get(p.pack);
                  let prod = buildProduct(p, pack, ship);
                  this.productsLookup.get(p.name).push(prod);
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
      ship.carrier = s.carrier;
      return ship;
    }

    function buildProduct(p, pack, shipment) {
      var prod = new Product();
      prod.name = p.name;
      prod.stateMachine.state = p.state;
      prod.shipment = shipment;
      shipment.products.push(prod);
      if (pack) {
        pack.products.push(prod);
        prod.pack = pack;
      }
      return prod;
    }
    function buildPack(p, shipment) {
      var pack = new Pack();
      pack.name = p.name;
      pack.weight = p.weight;
      pack.stateMachine.state = p.state;
      if (!p.state){
        console.log('init state par défaut')
        pack.stateMachine.state = 'init';
      }
      if (p.place) {
        pack.locationSM.state = 'stock';
        pack.place = p.place;
      } else {
        pack.locationSM.state = 'transit';
      }
      pack.shipment = shipment;
      shipment.packs.push(pack);
      return pack;
    }
  }
  explicitRefresh() {
    this.pauser.next(false);
  }
  getProducts(prodBarcode) {
    console.log('dans get product', prodBarcode);
    return this.productsLookup.get(prodBarcode) || [];
  }
  getShipment(shipBarcode) {
    return this.shipsLookup.get(shipBarcode);
  }
  getPack(packBarcode) {
    return this.packsLookup.get(packBarcode);
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
    product.isExpected = false;
    product.stateMachine.state = 'available';
    return product;
  }
  newPack() {
    let pack = new Pack();
    return pack;
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
  stock(pack) {
    var payload = { name: pack.name, place: pack.place};
    return this.odoo.call('bipper.webservice', 'set_package_place', [payload], {}).then(
      x=> console.log('ayé on stacké', pack)
    )
  }
  unstock(packs) {
    var payload = packs.map(p =>{ return {name: p.name }});

    return this.odoo.call('bipper.webservice', 'unset_package_place', [payload], {}).then(
      x=> console.log('ayé on a unstocké', payload)
    );
  }
  ship(shipment) {
    console.log('on envoi ', shipment);
    var payload = [
      shipment.name,
      shipment.packs.map( x => x.name)
    ];
    return this.odoo.call('bipper.webservice', 'ship', payload, {}).then(
      x=> {
        console.log('bim ce partit, on imprime lettiquette', x);
        return x.labels;
      }
    );
  }
  get_carrier(shipment) {
    var payload = {
      'name': shipment.name
    };
    return this.odoo.call('bipper.webservice', 'get_carrier', [payload], {}).then(
      x=>{ console.log('carreiers', x); return x; }
    );
  }
  set_carrier(shipment, carrier) {
    var payload = [{
        name: shipment.name
      }, {
        name: carrier.name
    }];
    return this.odoo.call('bipper.webservice', 'set_carrier', payload, {}).then(
      x=>{ console.log('set carrier reussix', x); return x; }
    );
  }
  get_pack_label(pack) {
    var payload = [{
        name: pack.name,
    }];
    return this.odoo.call('bipper.webservice', 'get_pack_label', payload, {}).then(
      x=>{ console.log('get pack label reussix', x); return x; }
    );
  }
  get_ship_label(shipment) {
    var payload = [{
        name: shipment.name
    }];
    return this.odoo.call('bipper.webservice', 'get_carrier_labels', payload, {}).then(
      x=>{ console.log('get ship reussix', x); return x.labels; }
    );
  }
}
