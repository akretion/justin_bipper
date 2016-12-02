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
  model: any = { packs: null};
  nextStep: string = '';
  listeDeCourses= [];
  constructor(
      public navCtrl: NavController,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      private productsProvider: ProductsProvider
    ) {
      console.log('dans le consturteur de destockage');

      //trouver que les commandes bloquées
      console.log('liste', this.listeDeCourses);
      this.reset();
  }
  addIt(scanned) {
    let p = this.listeDeCourses.find( a => a.name == scanned);
    console.log('on a trouvé ! ', p);
    if (!p)
      return;//TODO toast that !
    if (this.model.packs.has(p.name))
      return console.log('already scanned'); //TODO toast that !

    this.model.packs.set(p.name, p);
    console.log(this.model);
  }
  reset() {
    this.model = { packs: new Map()};
    this.listeDeCourses = this.productsProvider.getReserved().filter(
      p =>  {
        return p.shipment.nextSteps().indexOf('destocker') !== -1;
        }
    );
  }
  validate() {
    var packs = Array.from(this.model.packs.values());
    this.productsProvider.unstock(packs).then(
      () => packs.forEach( p => {
        (p as any).destocker()
      })
    ).then( () => this.reset() );
  }
}
