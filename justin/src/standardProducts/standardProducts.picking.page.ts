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

      var scanned = this.navParams.get('scanned');
      if (scanned)
        this.addIt(scanned);
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
    this.shipment = this.standardProductsProvider.getShipment(scanned);
    console.log(this.shipment)

    // this.standardProductsPickingProvider.addOne(scanned, this.model.products).then(
    //   (product: Product) => {
    //     this.model.products.push(product);
    //     this.shipment = product.shipment;

    //     if (this.model.products.length == this.shipment.products.length)
    //       this.model.shipNow = true;
    //   },
    //   (reason) => {
    //     this.displayWarning(reason);
    //   }
    // );
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

//   shipNow() {
//     //pack, don't prnt label and go to shipping page directly
//     var loader = this.loadingCtrl.create({
//       content:'Please wait',
//       duration: 3000
//     });
//     loader.present();

//     // redirect to ship
//     this.standardProductsPickingProvider.validatePack(this.model.weight, this.model.products, {'withLabel': false})
//     .then(
//       (pack) => {
//         loader.dismissAll()
//         return this.routeService.goTo('assembler', {'scanned': pack.name});
//       }
//     );
//     this.reset(true);
//   }

  reset(withShipment) {
    // this.standardProductsPickingProvider.reset();
    this.model = { 'products': []};
    if (withShipment)
      this.shipment = null;
    if (this.inputBar)
      this.inputBar.focus(); //it may be not loaded yet
      //and we don't care because inputBar focus on ngInit
  
  }

//   removeOne(product) {
//     let idx = this.model.products.findIndex(x => x.name == product.name)
//     this.model.products.splice(idx,1);
//   }
}
