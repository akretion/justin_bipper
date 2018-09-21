import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {AlertController, LoadingController} from 'ionic-angular';
import {StandardProductsProvider} from '../models/StandardProducts.provider';
import {StandardProductsPickingProvider} from './StandardProductsPicking.Provider';
import {inputBarComponent} from '../models/inputBar.component';
import {nextAppComponent} from '../models/nextSteps.component';
import {PrintServices} from '../models/PrintServices';
import {RouteService} from '../models/route.Service';
import {Pack, Shipment, Product } from '../statemachine/src/states';

@Component({
  templateUrl: 'standardProducts.picking.html',
})
export class StandardProductsPickingPage {
  shipment: Shipment;
  model: any = {};
  productsToShipCounter: number = 0;
  productsScanned: number = 0;
  productsToPack: any = {};
  @ViewChild(inputBarComponent) inputBar:inputBarComponent;
  @ViewChild(nextAppComponent) nextApp:nextAppComponent;

  constructor(
      public navCtrl: NavController,
      public navParams: NavParams,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      public loadingCtrl: LoadingController,
      private standardProductsProvider: StandardProductsProvider,
      private standardProductsPickingProvider: StandardProductsPickingProvider,
      private printServices: PrintServices,
      public routeService: RouteService,
    ) {
      this.reset(true);

      var shipmentName = this.navParams.get('shipment');
      if (shipmentName)
        this.initShipment(shipmentName);
  }

  displayWarning(msg) {
    var toast = this.toastCtrl.create({
      message: msg,
      duration: 2000
    });
    toast.onDidDismiss( () => this.inputBar.focus() );
    return toast.present();
  }

  initShipment(shipmentName) {
    this.shipment = this.standardProductsProvider.getShipment(shipmentName);
    this.productsToShipCounter = this.shipment.products.length;
    console.log(this.shipment)
  }

  addIt(scanned) {
    this.standardProductsPickingProvider.addOne(scanned, this.model.products).then(
      (product: Product) => {
        this.model.products.push(product);
        if (product.isExpected) {
          this.productsScanned++

          if (this.productsToPack[this.shipment.picking_id]) {
            this.productsToPack[this.shipment.picking_id].qty = this.productsToPack[this.shipment.picking_id].qty++
          } else {
            this.productsToPack[this.shipment.picking_id] = {
              'qty': 1
            }
          }
        }

        if (this.productsScanned == this.productsToShipCounter)
          this.model.shipNow = true;
      },
      (reason) => {
        this.displayWarning(reason);
      }
    );
  }

  reset(withShipment) {
    // this.standardProductsPickingProvider.reset();
    this.model = { 'products': []};
    this.productsScanned = 0;
    this.productsToPack = {};
    if (withShipment)
      this.shipment = null;
    if (this.inputBar)
      this.inputBar.focus(); //it may be not loaded yet
      //and we don't care because inputBar focus on ngInit
  
  }

  removeOne(product) {
    let idx = this.model.products.findIndex(x => x.name == product.name)
    let rmProduct: Product = this.model.products.splice(idx,1)
    if (rmProduct[0].isExpected) {
      this.productsScanned--;
      if (this.productsScanned != this.productsToShipCounter) {
        this.model.shipNow = false;
      }
    }
  }
}
