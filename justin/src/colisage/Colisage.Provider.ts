import {Injectable} from '@angular/core';
import {ProductsProvider} from '../models/Products.provider';

import {Pack, Shipment} from '../statemachine/src/states';

@Injectable()
export class ColisageProvider {
  pack: any;
  ship: any;
  constructor(
    private productsProvider: ProductsProvider
    ) {
      console.log('très sale');
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
        return Promise.reject(`No shipment found for ${barcode}`);
      pack.shipment.setPack(pack); //faut le faire ici ?
    }
    console.log('on est dans le ship', pack.shipment);
    var nextAvailableProduct = this.productsProvider
    .getProducts(barcode)
    .find( (l) => l.stateMachine.state ==  'receptionné');
    if (!nextAvailableProduct)
      return Promise.reject(`No product available for ${barcode}`);
    pack.setProduct(nextAvailableProduct);
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
