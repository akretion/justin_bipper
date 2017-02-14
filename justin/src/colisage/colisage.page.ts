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

        if (this.model.products.length == this.shipment.products.length)
          this.model.shipNow = true;
      },
      (reason) => {
        this.displayWarning(reason);
        console.log('toasted');
      }
    );
  }

  printAndContinue() {
    console.log('dans print and continue');
    this.colisageProvider.validatePack(this.model.weight, this.model.products, {'withLabel': true})
    .then(
      (pack) => {
        if (pack.shipment) {
          this.nextStep = pack.shipment.nextSteps();
          this.shipment = pack.shipment;
        }
        this.displayWarning(`Saved`);
        this.printServices.printDymo(pack.label);
      });
    this.reset(false);
  }
  shipNow() {
    // redirect to ship
    this.colisageProvider.validatePack(this.model.weight, this.model.products, {'withLabel': false})
    .then(
      (pack) => {
        return this.routeService.goTo('assembler', {'scanned': pack.name});
      }
    );
    this.reset(true);
  }

  reset(withShipment) {
    this.colisageProvider.reset();
    this.model = { 'products': []};
    if (withShipment)
      this.shipment = null;
    }
}
