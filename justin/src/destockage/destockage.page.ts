import {Component} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';
import {inputBarComponent} from '../models/inputBar.component';
import {nextAppComponent} from '../models/actionFor.component';

@Component({
  templateUrl: 'destockage.html',
})
export class DestockagePage {
  pack: any = {};
  model: any = { packs: []};
  nextStep: string = '';
  listeDeCourses= [];
  constructor(
      public navCtrl: NavController,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      private productsProvider: ProductsProvider
    ) {
      console.log('dans le consturteur de destockage');
      let r = this.productsProvider.getReserved().filter(
        p =>  {
          return p.shipment.nextSteps().indexOf('destocker') !== -1;
          }
      );
      console.log('resultats :', r);
      this.listeDeCourses = r;
      //trouver que les commandes bloquées
      console.log('liste', this.listeDeCourses);

  }
  addIt(scanned) {
    let p = this.listeDeCourses.find( a => a.name == scanned);
    console.log('on a trouvé ! ', p);
    if (!p)
      return;//TODO toast that !
    if (this.model.packs[p.name])
      return console.log('already scanned'); //TODO toast that !

    this.model.packs[p.name] = true;
    p.destocker();
    console.log(this.model);
  }
  reset() {
    this.model = { packs: {}};
  }
}
