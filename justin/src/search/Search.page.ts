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
    this.search = {products: [], packs: [], shipments: [], terms:""};
  }
  addIt(scanned) {
    console.log('addit', scanned);
    var packs = [];
    var prods = [];
    var ships = [];
    var notFound = false;

    let pack = this.productsProvider.getPack(scanned);
    let ship = this.productsProvider.getShipment(scanned);
    let prod = this.productsProvider.getProducts(scanned);
    if (pack) {
      //on a trouvé un pack
      ships = [pack.shipment];
      packs = [pack];
      prods = pack.products;
      this.model.searched = "pack";
      console.log('next step', pack.nextSteps())
    } else if (ship) {
      // on a trouvé un shipment
      ships = [ship];
      packs = ship.packs;
      prods = ship.products;
      this.model.searched = "shipment";
    } else if (prod.length) {
      // on a trouve un produit
      console.log(prod);
      ships = [prod[0].shipment];
      packs = (prod[0].pack) ? [prod[0].pack]: [];
      prods = [prod[0]];
      this.model.searched = "product";
    } else {
      notFound = true;
    }

    this.search = {
      products: prods,
      packs: packs,
      shipments: ships,
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
}
