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
    var shipment = this.standardProductsProvider.getShipment(scanned)
    if (shipment){
      this.selectShipment([scanned, shipment])
    } else {
      this.displayWarning('Can not find that shipment');
      this.inputBar.focus();
    }
    
  }

  selectShipment(ship) {
    console.log('selected shipment: ', ship)
    this.navCtrl.push(StandardProductsPickingPage, {shipment:ship[0]})
  }
}
