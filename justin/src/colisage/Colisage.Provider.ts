import {Injectable} from '@angular/core';
import {ProductsProvider} from '../models/Products.provider';
import {odooService} from '../angular-odoo/odoo';

import {Pack, Shipment, Product } from '../statemachine/src/states';

@Injectable()
export class ColisageProvider {
  pack: any;
  ship: any;
  constructor(
    private productsProvider: ProductsProvider,
    private odoo: odooService
    ) {
      this.reset();
  }

  get() {
    return this.pack;
  }
  addOne(barcode) {
    //TODO vérifier que le produit fait parti de cet shipment?
    var pack = this.pack;
    var productsProvider = this.productsProvider;
    var products = productsProvider.getProducts(barcode);

    function getProduct(barcode) {
      var nextAvailableProduct = products
        .find( (l) => l.stateMachine.state ==  'receptionné');

      if (nextAvailableProduct)
        return Promise.resolve(nextAvailableProduct);

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

      console.log('continue in degraded mode');
      return Promise.resolve(product);
    }

    function setProduct(pack, product) {
      console.log('setProduct', pack, product);
      if (pack.shipment)
        pack.shipment.setPack(pack);
      pack.setProduct(product);
      return Promise.resolve(product);
    }

    return getProduct(barcode)
      .then(prod => ensureShipment(pack, prod))
      .then(prod => setProduct(pack, prod));
  }
  validatePack(pack, weight) {
    var payload = {
      'weight': pack.weight,
      'products': pack.products.map( x => x.name)
    };
    return pack.setWeight(weight).then(() => {
      console.log('on envoi payload', payload);
      return this.odoo.call('bipper.webservice','do_packing', [payload], {})
    }).then(x => {
      console.log("c'est good", x);
      pack.name = x[0];
      pack.coliser();
      return this.productsProvider.addPack(pack)
    }).then( () => {
      return pack;
    }).then(null, (x) => console.log('on leve pas',x));
  }
  reset() {
    this.pack = this.productsProvider.newPack();
    this.pack.créer();
    return this.pack;
  }
};
