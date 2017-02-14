import {Component} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {Scan} from '../beep/Scan.model';
import {ColisageProvider} from './Colisage.Provider';
import {inputBarComponent} from '../models/inputBar.component';
import {nextAppComponent} from '../models/actionFor.component';
import {PrintServices} from '../models/PrintServices';
import {RouteService} from '../models/route.Service';
import {Pack, Shipment, Product } from '../statemachine/src/states';

@Component({
  templateUrl: 'colisage.html',
})
export class ColisagePage {
  shipment: any;
  model: any = {};
  nextStep: string = '';
  constructor(
      public navCtrl: NavController,
      public navParams: NavParams,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      private colisageProvider: ColisageProvider,
      private printServices: PrintServices,
      public routeService: RouteService,
    ) {
      this.reset(true);
      console.log('this', this);

      var scanned = this.navParams.get('scanned');
      if (scanned)
        this.addIt(scanned);
  }
  displayWarning(msg) {
    this.toastCtrl.create({
      message: msg,
      duration: 2000
    }).present();
  }
  addIt(scanned) {
    console.log('dans addit', scanned);

    this.colisageProvider.addOne(scanned, this.model.products).then(
      (product: Product) => {
        console.log('retour addone', product);
        this.model.products.push(product);
        this.shipment = product.shipment;
      },
      (reason) => {
        this.displayWarning(reason);
        console.log('toasted');
      }
    );
  }
  validate() {
    var self = this;
    self.nextStep = "";
    //TODO deplacer ça dans Colisage.Provider

    if (!this.model.products.length)
      return this.displayWarning('No products scanned');

    this.colisageProvider.validatePack(this.model.weight, this.model.products)
    .then(
      (pack) => {
        if (pack.shipment) {
          self.nextStep = pack.shipment.nextSteps();
          self.shipment = pack.shipment;
        }
        this.displayWarning(`Saved`);
        console.log('on print là', pack);
        this.printServices.printDymo(pack.label);
      }
    );
    this.reset(false);
  }
  reset(withShipment) {
    this.colisageProvider.reset();
    this.model = { 'products': []};
    if (withShipment)
      this.shipment = null;
  }

}
