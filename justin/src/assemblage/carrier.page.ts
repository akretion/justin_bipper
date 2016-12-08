import {Component} from '@angular/core';
import {NavParams, ViewController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';

@Component({
  templateUrl: 'carrier.html',
})
export class CarrierPage {
  carriers = [];
  constructor(
    public params: NavParams,
    public view: ViewController,
    public productsProvider: ProductsProvider
)
  {
      console.log('je suis carrier page constructor', params);
      this.carriers = this.productsProvider.get_carriers(params['data']['shipment']);
  }
  close() {
    console.log('on ferme');
    this.view.dismiss();
  }
}
