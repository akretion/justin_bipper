import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {inputBarComponent} from '../models/inputBar.component';
import {ProductsProvider} from './../models/Products.provider';

@Component({
  templateUrl: 'debug.html',
})
export class DebugPage {
  pack: any = {};
  shipment: any;
  model: any = {};
  shipQty: number;
  packQty: number;
  prodQty: number;
  lastUpdate : any;
  constructor(
      public navCtrl: NavController,
      public productsProvider: ProductsProvider,
    ) {
    console.log('dans le constructeur');
    this.model='bim'
    this.lastUpdate = this.productsProvider.lastUpdate;
    this.refresh()
  }
  refresh() {
    console.log('refresh');
    this.shipQty = this.productsProvider.shipsLookup.size;
    this.packQty = this.productsProvider.packsLookup.size;
    this.prodQty = this.productsProvider.productsLookup.size;
  }
}
