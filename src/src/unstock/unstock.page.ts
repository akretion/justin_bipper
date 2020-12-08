import {Component, ViewChild} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {AlertController, LoadingController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';
import {inputBarComponent} from '../models/inputBar.component';
import {nextAppComponent} from '../models/nextSteps.component';

@Component({
  templateUrl: 'unstock.html',
})
export class UnstockPage {
  pack: any = {};
  model: any = { packs: null};
  nextStep: string = '';
  listeDeCourses= [];
  @ViewChild(inputBarComponent) inputBar:inputBarComponent;
  constructor(
      public navCtrl: NavController,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      private loadingCtrl: LoadingController,
      private productsProvider: ProductsProvider
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
    let p = this.listeDeCourses.find( a => a.name == scanned);
    console.log('on a trouvé ! ', p);
    if (!p)
      return this.displayWarning(`${scanned} not in the list`);
    if (this.model.packs.has(p.name))
      return this.displayWarning(`${scanned} already scanned`);

    this.model.packs.set(p.name, p);
    console.log(this.model);
  }
  reset() {
    this.model = { packs: new Map()};
    this.listeDeCourses = this.productsProvider.getReserved().filter(
      p =>  {
        return p.shipment.nextSteps().indexOf('unstock') !== -1;
        }
    );
    if (this.inputBar)
      this.inputBar.focus();
  }
  validate() {
    var loader = this.loadingCtrl.create({
      content:'Please wait',
      duration: 3000
    });
    loader.present();
    var packs = Array.from(this.model.packs.values());
    this.productsProvider.unstock(packs).then(
      () => Promise.all(
            packs.map( p => (p as any).destocker())
      )
    ).then( () => {
      this.displayWarning(`Done !`);
      loader.dismissAll();
    }).then( () => this.reset() );
  }
}
