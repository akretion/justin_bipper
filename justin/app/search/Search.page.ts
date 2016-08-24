import {Component} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';


@Component({
  templateUrl: 'build/search/search.html',
  providers: [],
})
export class SearchPage {
  scans:any = [];
  model = {};
  search: {products: any, packs: any, shipment: any};
  constructor(
      public navCtrl: NavController,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      private productsProvider: ProductsProvider
) {
    this.model = {};
    this.scans = [];
    this.search = {products: [], packs: new Set(), shipment: new Set()};
  }
  addIt(model) {
    console.log('addit', model);
    var packs = new Set();
    var prods = [];
    var ship = new Set();
    console.log('im so lucky', model.scanned);

    let p = this.productsProvider.getPack(model.scanned);
    let s = this.productsProvider.lookupShipment(model.scanned);
    let lk = this.productsProvider.lookupProduct(model.scanned);
    console.log(`p {p}, s: {s}, lk: {lk}`, p, s, lk);
    if (p) {
      //on a cherché un pack
      packs.add(p);
      prods = p.products;
      ship.add(p.shipment);
      model.searched = "pack";
    } else if (s) {
      // on a cherché un shipment
      s.packs.forEach( aPack => packs.add(aPack) );
      ship.add(s);
      prods = s.products;
      model.searched = "shipment";
    } else if (lk) {
      // on a cherché un produit
      console.log(lk);
      ship.add(lk.ship);
      packs = new Set(lk.packs.values());
      prods = lk.products;
      model.searched = "product";
    }

    this.search = {products: prods, packs: Array.from(packs), shipment: Array.from(ship)};
    console.log('searched', this.search)
  }
  openPack(pack) {
    this.model["scanned"] = pack.name; //because of fucking typescript
    return this.addIt(this.model);
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
