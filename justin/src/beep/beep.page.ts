import {Component, ViewChild} from '@angular/core';
import {NavController, ToastController, LoadingController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {Scan} from './Scan.model';
import {ScansProvider} from './Scans.provider';
import {inputBarComponent} from '../models/inputBar.component';

@Component({
  templateUrl: 'beep.html',
})
export class BeepPage {
  scans: Array<Scan> = [];
  model: any = {};
  @ViewChild(inputBarComponent) inputBar:inputBarComponent;
  constructor(
      public navCtrl: NavController,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public loadingCtrl: LoadingController,
      public scansProvider: ScansProvider) {
    this.model = {};
    this.scans = this.scansProvider.get();
  }
  addIt(scanned) {
    console.log('dans addit', scanned);
    if (!scanned)
      return;
    this.scansProvider.addOne(scanned);
  }
  displayWarning(msg) {
    this.toastCtrl.create({
      message: msg,
      duration: 2000
    }).present();
  }
  validate() {
    console.log('send this to the server');

    var loader = this.loadingCtrl.create({
      content:'Please wait',
      duration: 3000
    });
    loader.present();


    this.scansProvider.validate().then(
      () => {
        loader.dismissAll()
        this.displayWarning('Saved');
        this.reset();
      },
      (y) => {
        loader.dismissAll()
        this.displayWarning('Error ! ' + y);
      }
    );
  }
  reset() {
    this.scans = this.scansProvider.reset();
    this.inputBar.focus();
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
