import {Component} from '@angular/core';
import {NavParams, ViewController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';

@Component({
  templateUrl: 'carrier.html',
})
export class CarrierPage {
  carriers = [];
  shipment = null;
  currentCarrier = null;
  constructor(
    public params: NavParams,
    public view: ViewController,
    public productsProvider: ProductsProvider
)
  {
      this.shipment = params['data']['shipment'];
      this.currentCarrier = this.shipment.carrier;
      this.productsProvider.get_carrier(this.shipment).then(
        carriers => this.carriers = carriers
      );
  }
  onChange(carrier) {
    //TODO gerer en cas d'exception
    return this.productsProvider.set_carrier(this.shipment, carrier).then(
      (x) => {
        this.shipment.carrier = carrier.name
      }
    ).then(
      () => this.close()
    );
  }
  close() {
    this.view.dismiss();
  }
}
