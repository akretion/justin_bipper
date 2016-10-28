import {Component} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';
import {nextAppComponent} from '../models/actionFor.component';
import {inputBarComponent} from '../models/inputBar.component';

@Component({
  templateUrl: 'search.html',
})
export class SearchPage {
  scans:any = [];
  model:any = {};
  thing = null;
  search: any= {};
  constructor(
      public navCtrl: NavController,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      private productsProvider: ProductsProvider
) {
    console.log('constructeur de search');
    this.model = {};
    this.scans = [];
    this.search = {products: [], packs: new Set(), shipment: new Set(), terms:""};
  }
  addIt(scanned) {
    console.log('addit', scanned);
    var packs = new Set();
    var prods = [];
    var ship = new Set();
    var notFound = false;

    let p = this.productsProvider.getPack(scanned);
    let s = this.productsProvider.lookupShipment(scanned);
    let lk = this.productsProvider.lookupProduct(scanned);
    if (p) {
      //on a cherché un pack
      packs.add(p);
      prods = p.products;
      ship.add(p.shipment);
      this.model.searched = "pack";
      console.log('next step', p.nextSteps())
    } else if (s) {
      // on a cherché un shipment
      s.packs.forEach( aPack => packs.add(aPack) );
      ship.add(s);
      prods = s.products;
      this.model.searched = "shipment";
    } else if (lk) {
      // on a cherché un produit
      console.log(lk);
      ship.add(lk.ship);
      packs = new Set(lk.packs.values());
      prods = lk.products;
      this.model.searched = "product";
    } else {
      notFound = true;
    }

    this.search = {
      products: prods,
      packs: Array.from(packs),
      shipment: Array.from(ship),
      terms: scanned,
      notFound: notFound
    };
    console.log('searched', this.search);
  }
  openPack(pack) {
    this.model["scanned"] = pack.name; //because of fucking typescript
    return this.addIt(pack.name);
  }
  validate() {
    console.log('send this to the server');
    this.toastCtrl.create({
      message: 'Saved',
      duration: 2000
    }).present();
    this.reset();
  }
  reset() {
    this.scans = {}
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
