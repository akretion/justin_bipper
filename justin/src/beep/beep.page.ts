import {Component} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {Scan} from './Scan.model';
import {ScansProvider} from './Scans.provider';

@Component({
  templateUrl: 'beep.html',
})
export class BeepPage {
  scans: Array<Scan> = [];
  model: any = {};
  constructor(
      public navCtrl: NavController,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public scansProvider: ScansProvider) {
    this.model = {};
    this.scans = this.scansProvider.get();
  }
  addIt(model) {
    if (!model.scanned)
      return;
    this.scansProvider.addOne(model.scanned);
    model.scanned = null;
  }
  validate() {
    console.log('send this to the server');

    this.scansProvider.validate().then(
      () => {
        this.toastCtrl.create({
          message: 'Saved',
          duration: 2000
        }).present();
      },
      (y) => {
        this.toastCtrl.create({
          message: 'Error ! ' + y,
          duration: 10000
        }).present();
      }
    );
    this.reset();
  }
  reset() {
    this.scans = this.scansProvider.reset();
  }
  removeOne(scan) {
    this.scansProvider.decreaseOne(scan);
  }
  showConfirm() {
    var confirm = this.alertCtrl.create({
      title: "Confirmation",
      message: "Are you sure you to delete the list of scans ?",
      buttons: [{
        text: 'Cancel'
      }, {
        text:'Delete',
        handler: () => {
          console.log('delete');
          this.reset();
        }
      }]
    });
    confirm.present();
  }
}
