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
    if (!pack.shipment) {
      pack.shipment = this.productsProvider.getShipment(barcode);
      if (!pack.shipment)
        console.log('No shipment. Continue in degraded mode')
      else
        pack.shipment.setPack(pack); //faut le faire ici ?
    }

    var nextAvailableProduct = this.productsProvider
    .getProducts(barcode)
    .find( (l) => l.stateMachine.state ==  'receptionné');
    if (nextAvailableProduct)
      pack.setProduct(nextAvailableProduct);
    else {
      console.log('No products. Continue in degraded mode');
      let newProd = this.productsProvider.newProduct(barcode);
      newProd.isExpected = false;
      newProd.receptionner().then(
        () => pack.setProduct(newProd)
      );
    }
    return Promise.resolve();
  }
  validatePack(pack) {
    var payload = {
      'weight': pack.weight,
      'products': pack.products.map( x => x.name)
    };
    console.log('on envoi payload', payload);
    return this.odoo.call('bipper.webservice','do_packing', [payload], {})
    .then(x=>{
      console.log("c'est good", x);
      pack.créer();
      this.productsProvider.addPack(pack)
    }, (x) => console.log('on leve pas',x));
  }
  reset() {
    this.pack = this.productsProvider.newPack();
    return this.pack;
  }
};
