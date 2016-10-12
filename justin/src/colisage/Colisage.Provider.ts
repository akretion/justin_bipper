import {Injectable} from '@angular/core';
import {ProductsProvider} from '../models/Products.provider';

import {Pack, Shipment, Product } from '../statemachine/src/states';

@Injectable()
export class ColisageProvider {
  pack: any;
  ship: any;
  constructor(
    private productsProvider: ProductsProvider
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
      newProd.receptionner().then(
        () => pack.setProduct(newProd)
      );
    }
    return Promise.resolve();
  }
  addPack(pack) {
    this.productsProvider.addPack(pack);
  }
  reset() {
    this.pack = new Pack();
    this.pack.name = "PACK" + parseInt( (Math.random()*10000)  + "" );
    this.pack.créer(); //attention devrait être une promesse
    return this.pack;
  }
};
