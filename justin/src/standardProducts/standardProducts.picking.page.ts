import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {AlertController, LoadingController} from 'ionic-angular';
import {StandardProductsProvider} from '../models/StandardProducts.provider';
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
  @ViewChild(inputBarComponent) inputBar:inputBarComponent;
  @ViewChild(nextAppComponent) nextApp:nextAppComponent;

  constructor(
      public navCtrl: NavController,
      public navParams: NavParams,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      public loadingCtrl: LoadingController,
      private standardProductsProvider: StandardProductsProvider,
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
    let productIdx: number = this.shipment.products.findIndex(x => x.name == scanned)
    console.log(productIdx)
    if (productIdx != -1) {
      this.model.products.push(this.shipment.products[productIdx])
      this.productsScanned++
      console.log(this.shipment.products[productIdx])
    } else {
      this.model.products.push({
        name: scanned,
        isExpected: false,
        shipment: null,
        pack: null,
        category: ''
      })
    }

    if (this.productsScanned == this.productsToShipCounter) {
      this.model.shipNow = true;
    }
  }

//   printAndContinue() {
//     var loader = this.loadingCtrl.create({
//       content:'Please wait',
//       duration: 3000
//     });
//     loader.present();

//     return this.standardProductsPickingProvider.validatePack(this.model.weight, this.model.products, {'withLabel': true})
//     .then(
//       (pack) => {
//         if (pack.shipment) {
//           this.shipment = pack.shipment;
//         }
//         var ns = pack.shipment.nextSteps();
//         if (ns.indexOf('assembler') != -1) {
//           console.log('on force le refersh');
//           this.nextApp.refresh();
//         }

//         loader.dismissAll();
//         this.printServices.printDymo(pack.label);
//         return this.displayWarning(`Saved`);
//       }).then( () => this.inputBar.focus())
//       .then( () => this.reset(false));
//   }

  shipNow() {
    console.log('Funtion not yet implement')
    //pack, don't prnt label and go to shipping page directly
    // var loader = this.loadingCtrl.create({
    //   content:'Please wait',
    //   duration: 3000
    // });
    // loader.present();

    // // redirect to ship
    // this.standardProductsPickingProvider.validatePack(this.model.weight, this.model.products, {'withLabel': false})
    // .then(
    //   (pack) => {
    //     loader.dismissAll()
    //     return this.routeService.goTo('assembler', {'scanned': pack.name});
    //   }
    // );
    // this.reset(true);
  }

  reset(withShipment) {
    // this.standardProductsPickingProvider.reset();
    this.model = { 'products': []};
    if (withShipment)
      this.shipment = null;
    if (this.inputBar)
      this.inputBar.focus(); //it may be not loaded yet
      //and we don't care because inputBar focus on ngInit
  
  }

  removeOne(product) {
    let idx = this.model.products.findIndex(x => x.name == product.name)
    this.model.products.splice(idx,1);
  }
}
