import {Component} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {Scan} from '../beep/Scan.model';
import {ColisageProvider} from './Colisage.Provider';

@Component({
  templateUrl: 'build/colisage/colisage.html',
  providers: [ColisageProvider]
})
export class ColisagePage {
  pack: any = {};
  model: any = {};
  nextStep: string = '';
  constructor(
      public navCtrl: NavController,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      private colisageProvider: ColisageProvider
    ) {
    this.model = {};
    this.pack = this.colisageProvider.get();
  }
  addIt(model) {
    if (!model.scanned)
      return;
  this.colisageProvider.addOne(model.scanned).then(null,
      (reason) => {
          let toast = this.toastCtrl.create({
          message: reason,
          duration: 3000
        });
        toast.present();
        console.log('toasted');
      }
    );
    model.scanned = null;
  }
  validate() {
    var self = this;
    self.nextStep = "";
    //TODO deplacer ça dans Colisage.Provider
    var p = this.pack; //obligatoire à cause de this pourquoi ?
    console.log('validate', p);
    p.setWeight(this.model.weight).then(
      () => p.coliser()
    ).then(
      () => this.colisageProvider.addPack(p)
    ).then(
      () => {
        self.nextStep = p.shipment.nextSteps();
      }
    ).then(
      () => {
        this.toastCtrl.create({
          message: 'Saved',
          duration: 2000
        }).present();
      }
    );
  }
  reset() {
    this.pack = this.colisageProvider.reset();
    this.model = {};
  }
}
