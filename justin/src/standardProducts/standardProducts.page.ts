import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {AlertController, LoadingController} from 'ionic-angular';
import {inputBarComponent} from '../models/inputBar.component';
import {nextAppComponent} from '../models/nextSteps.component';
import {RouteService} from '../models/route.Service';
import {StandardProductsProvider} from '../models/StandardProducts.provider';
import {Product, Pack, Shipment} from '../statemachine/src/states';
import {StandardProductsPickingPage} from './standardProducts.picking.page';

@Component({
  templateUrl: 'standardProducts.html',
})
export class StandardProductsPage {
  shipment: any;
  model: any = {};
  search: any = {};
  shipings: Array<Shipment> = [];

  @ViewChild(inputBarComponent) inputBar:inputBarComponent;
  @ViewChild(nextAppComponent) nextApp:nextAppComponent;

  constructor(
      public navCtrl: NavController,
      public navParams: NavParams,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      public loadingCtrl: LoadingController,
      public routeService: RouteService,
      private standardProductsProvider: StandardProductsProvider
    ) {
      this.search = {products: [], packs: [], shipments: [], terms:""};
  }

  ionViewDidLoad(){
    this.standardProductsProvider.getShipment().then(
      x => {
        this.shipings = x
        console.log(x)
      }
    )
  }

  displayWarning(msg) {
    var toast = this.toastCtrl.create({
      message: msg,
      duration: 2000
    });
    toast.onDidDismiss( () => this.inputBar.focus() );
    return toast.present();
  }

  addIt(scanned) {
    console.log('addit', scanned);
    var packs = [];
    var prods = [];
    var ships = [];
    var notFound = false;

    let pack = this.standardProductsProvider.getPack(scanned);
    let ship = this.standardProductsProvider.getShipment(scanned);
    let prod = this.standardProductsProvider.getProducts(scanned);
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

  selectShipment(ship) {
    console.log('selected shipment: ', ship)
    this.navCtrl.push(StandardProductsPickingPage, {scanned:ship[0]})
  }
}
