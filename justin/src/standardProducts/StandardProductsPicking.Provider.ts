import {Injectable} from '@angular/core';
import {StandardProductsProvider} from '../models/StandardProducts.provider_old';
import {odooService} from '../angular-odoo/odoo';

import {Pack, Shipment, Product } from '../statemachine/src/states';

@Injectable()
export class StandardProductsPickingProvider {
  pack: any;
  ship: any;
  constructor(
    private productsProvider: StandardProductsProvider,
    private odoo: odooService
    ) {
      this.reset();
  }
  addOne(barcode, alreadyScanned) {
    var pack = this.pack;
    var productsProvider = this.productsProvider;
    var products = productsProvider.getProducts(barcode);
    //products may contain duplicate keys
    console.log(products)
    function getProduct(barcode) {
      var nextAvailableProduct = products
        .find( (l) => l.stateMachine.state == 'init' && alreadyScanned.indexOf(l) == -1);

      if (nextAvailableProduct)
        return Promise.resolve(nextAvailableProduct);

      if (products.length) //all products packed
        return Promise.reject('Not Available: already packed or not received');

      console.log('degraded mode: we create a product on the fly');
      let newProd = productsProvider.newProduct(barcode);
      newProd.isExpected = false;
      return newProd.receptionner().then( () => newProd);
    }

    function ensureShipment(pack, product) {
      if (!pack.products.length) // first one
        pack.shipment = product.shipment;

      if (pack.shipment && product.shipment
        && pack.shipment != product.shipment)
        return Promise.reject('Shipment not equal');

      return Promise.resolve(product);
    }
    return getProduct(barcode)
      .then(prod => ensureShipment(pack, prod))
      .then(prod => {
        this.pack.products.push(prod);
        return prod;
      })
      .then(prod => prod);
  }

  validatePack(weight, products, withLabel) {
    var withLabel = withLabel['withLabel'];
    var pack = this.pack;


    var dupa:any = pack.stateMachine.can('coliser', {weight:weight, products: products})
    console.log(dupa)
    return dupa.then( () => {
      var payload = {
        'weight': weight,
        'products': products.map( x => x.name)
      };
      console.log('on envoi payload', payload);
      return this.odoo.call('bipper.webservice','do_packing', [payload, withLabel], {})
    }).then(x => {
      pack.name = x[0];
      pack.label = x[1];
      //on colise les produits
      this.productsProvider.explicitRefresh();
      return pack;
    }).then(() => pack.coliser(weight, products)
    ).then( () => pack.shipment.setPack(pack)
    ).then( () => this.productsProvider.addPack(pack)
    ).then( () => pack, (x) => console.log('on leve pas',x));
  }

  validatePack_old(weight, products, withLabel) {
    console.log('weight, products', weight, products);
    var withLabel = withLabel['withLabel'];
    var pack = this.pack;

    var payload = {
      'weight': weight,
      'products': products.map( x => x.name)
    };
    console.log('on envoi payload', payload);
    return this.odoo.call('bipper.webservice','do_packing', [payload, withLabel], {})
    .then(x => {
      pack.name = x[0];
      pack.label = x[1];
      //on colise les produits
      this.productsProvider.explicitRefresh();
      return pack;
    }).then(() => pack.coliser(weight, products)
    ).then( () => pack.shipment.setPack(pack)
    ).then( () => this.productsProvider.addPack(pack)
    ).then( () => pack, (x) => console.log('on leve pas',x));
  }

  reset() {
    //on défait
    this.pack = this.productsProvider.newPack();
    return this.pack;
  }
};
