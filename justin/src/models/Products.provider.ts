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
          this.lastUpdate.next(Date());
          x.forEach(
            s => {
              var oldShip = this.shipsLookup.get(s.name);
              if (oldShip) {
                var ship = updateShip(s, oldShip);
              } else {
                var ship = buildShip(s);
                this.shipsLookup.set(ship.name, ship)
              }

              s.packs.forEach(
                p => {
                  var oldPack = this.packsLookup.get(p.name);
                  if (oldPack) {
                    updatePack(p, oldPack);
                  } else {
                    var pack = buildPack(p, ship);
                    this.packsLookup.set(pack.name, pack);
                  }
                }
              );

              if (!oldShip) {
                s.lines.forEach(
                  p => {
                    let pack = this.packsLookup.get(p.pack);
                    let prod = buildProduct(p, pack, ship);
                    if (!this.productsLookup.has(p.name))
                      this.productsLookup.set(p.name, []);
                    this.productsLookup.get(p.name).push(prod);
                  }
                );
              } else {
                s.lines.reduce((acc, cur) => {
                  if (!acc.has(cur.name))
                    acc.set(cur.name, []);
                  acc.get(cur.name).push(cur);
                  return acc;
                }, new Map())
                // converts to { 'dev-xx-x1': [a,b], 'dev-xx-x2': [c,d,e]}
                .forEach( (kindOfProduct) => {
                  kindOfProduct.forEach( (p, idx) => {
                    let pack = this.packsLookup.get(p.pack);
                    let prod = this.productsLookup.get(p.name)[idx];
                    updateProduct(p, prod, pack);
                  });
                })
              }
            });
          }, (err) => {
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

    function buildProduct(p, pack, shipment) {
      var prod = new Product();
      prod.name = p.name;
      prod.shipment = shipment;
      prod.category = p.category;
      shipment.products.push(prod);
      return updateProduct(p, prod, pack);
    }
    var convState= { 'receptionné': 'received', 'colisé': 'packed'};
    function updateProduct(p, prod, pack) {
      prod.stateMachine.state = convState[p.state] || p.state;
      if (!prod.pack && pack) {
        pack.products.push(prod);
        prod.pack = pack;
      }
      if (pack)
        pack.category = prod.category;
      return prod;
    }

    function buildPack(p, shipment) {
      var pack = new Pack();
      pack.name = p.name;
      pack.weight = p.weight;
      pack.shipment = shipment;
      shipment.packs.push(pack);
      return updatePack(p, pack);
    }
    function updatePack(p, pack) {
      pack.stateMachine.state = p.state;
      if (!p.state){
        console.log('init state par défaut')
        pack.stateMachine.state = 'init';
      }
      if (p.place) {
//        console.log('force stock au lieu de  ', pack.stateMachine.state)
        pack.stateMachine.state = 'stock';
        pack.place = p.place;
      } else {
//        console.log('force transit au lieu de ', pack.stateMachine.state)
        pack.stateMachine.state = 'transit';
      }
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
  doReception(list) {
    /* receptionne la liste */
    console.log('list', list);
    var payload = {}
    list.forEach(l => {
      payload[l.barcode] =l.qty
    });
    //pas d'explicitRefresh car on sait pas qd la cron aura fini
    return this.odoo.call( 'bipper.webservice', 'do_lot_reception', [payload], {}).then(
      null, x => Promise.reject(x.message)
    );
  }
  stock(pack) {
    var payload = { name: pack.name, place: pack.place};
    return this.odoo.call('bipper.webservice', 'set_package_place', [payload], {}).then(
      () => this.explicitRefresh()
    )
  }
  unstock(packs) {
    var payload = packs.map(p =>{ return {name: p.name }});

    return this.odoo.call('bipper.webservice', 'unset_package_place', [payload], {}).then(
      x=> this.explicitRefresh()
    );
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
    var payload = packs.map( p => { return { 'name': p.name }});
    return this.odoo.call('bipper.webservice', 'do_package_loading', payload, {}).then(
      x => {console.log('packs chargés', x); return x;}
    );
  }
}
