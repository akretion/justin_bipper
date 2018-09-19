import {Injectable} from "@angular/core";
import {Http} from '@angular/http';
import {Product, Pack, Shipment} from '../statemachine/src/states';
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
export class StandardProductsProvider {
  productsLookup: Map<any, any>;
  packsLookup: Map<any, any>;
  shipsLookup: Map<any, any>;
  lastUpdate: any;
  pauser: any;
  stockPicking: any;

  constructor(public http: Http, public odoo: odooService) {
    console.log('Init standard product provider');

    this.packsLookup = new Map();
    this.shipsLookup = new Map();
    this.productsLookup = new Map();

    this.lastUpdate = new Subject();
    this.pauser = new Subject();
    this.stockPicking = odoo.call('bipper.webservice', 'get_stockpicking_spl', [], {})
    var concurrent = 0;

    var odooFetch = (sub) => {
      concurrent++;
      if (concurrent > 8) {
        this.pauser.next(true);
        throw "To many concurrent requests";
      }

      console.log('call bipper.webservice', sub);
      return this.stockPicking.then(
        x => {
          concurrent--;
          this.lastUpdate.next(Date());
          x.pickings.forEach(
            s => {
              var oldShip = this.shipsLookup.get(s.name);
              if (oldShip) {
                var ship = updateShip(s, oldShip);
              } else {
                var ship = buildShip(s);
                this.shipsLookup.set(ship.name, ship)
              }


              if (!oldShip) {
                s.move_lines.forEach(
                  p => {
                    let prod = buildProduct(p, ship);
                    if (!this.productsLookup.has(p.name))
                      this.productsLookup.set(p.name, []);
                    this.productsLookup.get(p.name).push(prod);
                  }
                );
              } else {
                s.move_lines.reduce((acc, cur) => {
                  if (!acc.has(cur.name))
                    acc.set(cur.name, []);
                  acc.get(cur.name).push(cur);
                  return acc;
                }, new Map())
                // converts to { 'dev-xx-x1': [a,b], 'dev-xx-x2': [c,d,e]}
                .forEach( (kindOfProduct) => {
                  kindOfProduct.forEach( (p, idx) => {
                    let prod = this.productsLookup.get(p.name)[idx];
                    updateProduct(p, prod);
                  });
                })
              }
            });
        }, 
        (err) => {
            concurrent--;
            console.log('une erreur ? ');
//            this.pauser.next(true);
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
      return updateShip(ship, s);
    }

    function updateShip(ship, s) {
      ship.carrier = s.carrier;
      ship.partial_allowed = s.is_partial;
      return ship;
    }

    function buildProduct(p, shipment) {
      var prod = new Product();
      prod.name = p.name;
      prod.shipment = shipment;
      prod.category = p.category;
      shipment.products.push(prod);
      return updateProduct(p, prod);
    }

    var convState= { 'receptionné': 'received', 'colisé': 'packed'};

    function updateProduct(p, prod) {
      prod.stateMachine.state = convState[p.state] || p.state;
      return prod;
    }

  }

  explicitRefresh() {
    this.pauser.next(false);
  }

  getProducts(prodBarcode) {
    console.log('dans get product', prodBarcode);
    return this.productsLookup.get(prodBarcode) || [];
  }

  getShipment(shipBarcode?) {
    if (shipBarcode) {
      return this.shipsLookup.get(shipBarcode);
    } else {
      return this.stockPicking.then(
        (x) => {
          return Promise.resolve(
            Array.from(this.shipsLookup.entries())
          )
        }
      )
    }
  }

  getPack(packBarcode) {
    return this.packsLookup.get(packBarcode);
  }

  addPack(pack) {
    return this.packsLookup.set(pack.name, pack);
  }

  getReserved() {
    return Array.from(this.packsLookup.values()).filter(
      (p) => p.stateMachine.state == 'stock'
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

  ship(shipment, shipped_packs) {
    console.log('on envoi ', shipment, shipped_packs);
    //shipped_packs == [] -> tout le shipment d'un coup
    var payload = [
      shipment.name,
      shipped_packs.map(x => x.name)
    ];
    var deleteShipment = (shipment) => {
      // car le serveur ne nous le dira jamais
      // et on pourra pas réimprimer d'etiquettes
      this.shipsLookup.delete(shipment.name);
      shipment.packs.forEach( pack => this.packsLookup.delete(pack.name));
      shipment.products.forEach( prod => this.productsLookup.delete(prod.name));
    }
    return this.odoo.call('bipper.webservice', 'ship', payload, {}).then(
      x=> {
        deleteShipment(shipment);
        console.log('bim ce partit, on imprime lettiquette', x);
        this.explicitRefresh()
        return x;
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
    return this.odoo.call('bipper.webservice', 'get_picking_attachments', payload, {}).then(
      x=>{ console.log('get ship reussix', x); return x; }
    );
  }

  get_pack_info(pack) {
    var payload = [{
      name: pack.name
    }];
    return this.odoo.call('bipper.webservice', 'get_pack_info', payload, {}).then(
      x=>{ console.log('get pack info reussix', x); return x; }
    );
  }

  load_truck(packs) {
    var payload = [packs.map( p => { return { 'name': p.name }})];
    return this.odoo.call('bipper.webservice', 'do_package_loading', payload, {}).then(
      x => {console.log('packs chargés', x); return x;}
    );
  }
}
