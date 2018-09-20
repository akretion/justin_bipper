import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {AlertController, LoadingController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';
import {nextAppComponent} from '../models/nextSteps.component';
import {inputBarComponent} from '../models/inputBar.component';

@Component({
  templateUrl: 'stock.html',
})
export class StockPage {
  pack: any = {};
  model: any = {};
  nextStep: string = '';
  @ViewChild(inputBarComponent) inputBar:inputBarComponent;
  constructor(
      public navParams: NavParams,
      public navCtrl: NavController,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public loadingCtrl: LoadingController,
      public productsProvider: ProductsProvider
    ) {
      this.reset();

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
    if (!scanned)
      return;
    let pack = this.productsProvider.getPack(scanned);
    console.log('on a trouvé ! ', pack);
    if (!pack){
      this.displayWarning(`${scanned} not found`)
      return this.reset();
    }
    if (!pack.stateMachine.availableState().find(p => p.to == 'stock')) {
      this.displayWarning(`${scanned} can't be stocked`);
      return this.reset();
    }
    this.model.scanned = scanned;
    this.model.pack = pack;

  }
  reset() {
    this.model = { pack:null, scanned: null};
    if (this.inputBar)
      this.inputBar.focus();
  }
  validate(pack) {
    console.log('stockage de', pack);
    //il faut update avant
    var loader = this.loadingCtrl.create({
      content:'Please wait',
      duration: 3000
    });
    loader.present();
    pack.place = this.model.place;
    this.productsProvider.stock(pack).then(
      () => {
      this.displayWarning(`Saved!`);
      this.reset();
    });
    loader.dismissAll();
  }
}
