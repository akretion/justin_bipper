import {Component} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {Scan} from '../beep/Scan.model';
import {ColisageProvider} from './Colisage.Provider';
import {inputBarComponent} from '../models/inputBar.component';
import {nextAppComponent} from '../models/actionFor.component';
import {PrintServices} from '../models/PrintServices';
import {RouteService} from '../models/route.Service';

@Component({
  templateUrl: 'colisage.html',
})
export class ColisagePage {
  pack: any = {};
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

    this.colisageProvider.addOne(scanned).then(
      () => this.shipment = this.model.pack.shipment,
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
    var p = this.pack; //obligatoire à cause de this pourquoi ?
    console.log('validate', p);
    if (!p.products.length)
      return this.displayWarning('No products scanned');

    this.colisageProvider.validatePack(p, this.model.weight)
    .then(
      () => {
        if (p.shipment) {
          self.nextStep = p.shipment.nextSteps();
          self.shipment = p.shipment;
        }
        this.displayWarning(`Saved`);
        console.log('on print là', p);
        this.printServices.printDymo(p.label);
      }
    );
    this.reset(false);
  }
  reset(withShipment) {
    this.pack = this.colisageProvider.reset();
    this.model = {};
    this.model.pack = this.pack;
    if (withShipment)
      this.shipment = null;

  }
}
