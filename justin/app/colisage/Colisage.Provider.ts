import {Injectable} from '@angular/core';
import {ProductsProvider} from '../models/Products.provider';

declare var Pack:any;
declare var Shipment:any;

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
        return null;
      pack.shipment.setPack(pack); //faut le faire ici ?
    }
    console.log('on est dans le ship', pack.shipment);
    var nextAvailableProduct = this.productsProvider
    .getProducts(barcode)
    .find( (l) => l.stateMachine.state ==  'receptionné');

    pack.setProduct(nextAvailableProduct);
    return Promise.resolve();
  }
  addPack(pack) {
    this.productsProvider.addPack(pack);
  }
  reset() {
    this.pack = new Pack();
    this.pack.créer(); //attention devrait être une promesse
    return this.pack;
  }
};
