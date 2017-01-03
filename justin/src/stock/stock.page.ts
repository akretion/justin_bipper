import {Component} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';
import {nextAppComponent} from '../models/actionFor.component';
import {inputBarComponent} from '../models/inputBar.component';

@Component({
  templateUrl: 'stock.html',
})
export class StockPage {
  pack: any = {};
  model: any = {};
  nextStep: string = '';
  constructor(
      public navCtrl: NavController,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public productsProvider: ProductsProvider
    ) {
      this.reset();
  }
  displayWarning(msg) {
    this.toastCtrl.create({
      message: msg,
      duration: 2000
    }).present();
  }
  addIt(scanned) {
    if (!scanned)
      return;
    let pack = this.productsProvider.getPack(scanned);
    console.log('on a trouvé ! ', pack);
    if (!pack){
      this.displayWarning(`${scanned} not found`)
      return this.reset();
    }
    if (pack.locationSM.availableState().indexOf('stock') == -1) {
      this.displayWarning(`${scanned} can't be stocked`);
      return this.reset();
    }
    this.model.scanned = scanned;
    this.model.pack = pack;

  }
  reset() {
    this.model = { pack:null, scanned: null};
  }
  validate(pack) {
    console.log('stockage de', pack);
    //il faut update avant
    pack.place = this.model.place;
    this.productsProvider.stock(pack).then(function() {
      this.displayWarning(`Saved!`)
      this.reset();
    });
  }
}
