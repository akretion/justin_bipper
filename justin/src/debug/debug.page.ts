import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {inputBarComponent} from '../models/inputBar.component';
import {ProductsProvider} from './../models/Products.provider';
import {PrintServices} from './../models/PrintServices';
import {AppServices} from './../models/AppServices';

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
  settings: any;
  appSettings: any;

  constructor(
      public navCtrl: NavController,
      public productsProvider: ProductsProvider,
      public printServices: PrintServices,
      public appServices: AppServices
    ) {
    console.log('dans le constructeur');
    this.model='bim'
    this.lastUpdate = this.productsProvider.lastUpdate;
    this.refresh()
    this.settings = printServices.getSettings();
    this.appSettings = appServices.getSettings();
    window['pP'] = this.productsProvider;
    console.log('voici settings', this.settings);
    console.log('voici appSettings', this.appSettings);
  }

  refresh() {
    console.log('refresh');
    this.shipQty = this.productsProvider.shipsLookup.size;
    this.packQty = this.productsProvider.packsLookup.size;
    this.prodQty = this.productsProvider.productsLookup.size;
  }

  saveSettings(dat) {
    this.printServices.setSettings(dat);
  }

  saveAppSettings(dat) {
    console.log('app settings save: ',dat);
    this.appServices.setSettings(dat);
  }
}
