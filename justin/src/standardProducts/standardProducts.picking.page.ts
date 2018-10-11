import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {AlertController, LoadingController} from 'ionic-angular';
import {inputBarComponent} from '../models/inputBar.component';
import {nextAppComponent} from '../models/nextSteps.component';
import {PrintServices} from '../models/PrintServices';
import {RouteService} from '../models/route.Service';
import {StandardProductsProvider} from '../models/StandardProducts.provider';

import {StandardProductsPage} from './standardProducts.page';

@Component({
  templateUrl: 'standardProducts.picking.html',
})
export class StandardProductsPickingPage {
  picking: any = {};
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
      private printServices: PrintServices,
      public routeService: RouteService,
      private standardProductsProvider: StandardProductsProvider
    ) {
      
      this.reset();
      
      var picking = this.navParams.get('picking');
      if (picking)
        this.initPicking(picking);
  }

  displayWarning(msg) {
    var toast = this.toastCtrl.create({
      message: msg,
      duration: 2000
    });
    toast.onDidDismiss( () => this.inputBar.focus() );
    return toast.present();
  }

  initPicking(picking) {
    this.picking = picking
    this.model.picking_id = picking.id
    this.model.picking_name = picking.name
    console.log('Loaded picking: ',picking)
  }

  addIt(scanned) {
    // get index of product
    let idx: number = this.picking.move_lines.findIndex(x => x.default_code == scanned);

    // check if scanned product is in products to pick array
    if (idx != -1) {
      // get product object
      let product = this.picking.move_lines[idx];

      // check if product was already scanned
      let idxModel: number = this.model.products.findIndex(x => x.default_code == product.default_code);
      
      if (idxModel == -1) {
        product['product_pickied_qty'] = 1
        this.model.products.push(product)
      } else {
        this.model.products[idxModel].product_pickied_qty++;
      }
      // get index of product that was pushed or changed
      idxModel = this.model.products.findIndex(x => x.default_code == product.default_code);

      // if picked qty is equel to value of product to pick then increment scanned products counter
      if (this.model.products[idxModel].product_pickied_qty == this.model.products[idxModel].product_qty) {
        this.productsScanned++
      }

      // check if we can procced to next step
      if (this.productsScanned == this.picking.move_lines.length){
        this.model.procced = true;
        // one more step of validation that we have picked all the qty that we need to pick
        this.model.products.forEach(element => {
          console.log(element)
          if (element.product_pickied_qty != element.product_qty) {
            this.model.procced = false;
          }
        });
      }

    } else {
      // we picked wrong product, so we create fake product with isExpected flag as false
      let newProd: any = {}
      newProd['isExpected'] = false
      newProd['name'] = scanned
      newProd['product_pickied_qty'] = 1
      newProd['product_qty'] = 0
      this.model.products.push(newProd)
      this.model.procced = false;
    }
  }

  doPick() {
    var loader = this.loadingCtrl.create({
      content:'Please wait'
    });
    loader.present();

    // iterate over products that was picked and remove those that have flag isExpected set up to false
    this.model.products.forEach(element => {
      if (!element.isExpected) {
        let idx: number = this.model.products.findIndex(x => x.move_id == element.move_id)
        this.model.products.splice(idx,1)
      }
    });

    this.standardProductsProvider.doPick(this.model).then(
      x => {
        console.log(x)
        loader.dismissAll();
        this.model = x;
        this.model.pickDone = true;
        this.model.procced = true;
        this.doShip();
      },
      err => {
        console.log(err)
        loader.dismissAll();
      }
    )
  }

  doShip() {
    var loader = this.loadingCtrl.create({
      content:'Please wait'
    });
    loader.present();

    this.model.weight = this.model.weight;
    this.standardProductsProvider.doShip(this.model.picking_name, this.model.package).then(
      x => {
        if (x) {
          loader.dismissAll();
          this.model.shipDone = true;
          console.log(x)
          this.printServices.printDymo(x[1]);
          this.displayWarning(`Saved`);
          this.navCtrl.push(StandardProductsPage)
        }
      },
      err => {
        console.log(err)
        loader.dismissAll();
      }
    )
  }

  reset() {
    this.model = { 
      'products': []
    };
    this.model['picking_id'] = 0
    this.model['picking_name'] = ''
    this.model['procced'] = false
    this.model['pickDone'] = false
    this.model['shipDone'] = false

    // this.inputBar.focus();
  }

  removeOne(product) {
    let idx = this.model.products.findIndex(x => x.name == product.name)
    
    if (product.product_pickied_qty == product.product_qty && product.product_qty == 1) {
      let rmProduct: any = this.model.products.splice(idx,1)
      if (rmProduct[0].isExpected) {
        this.productsScanned--;
        this.model.procced = false;
        if (this.productsScanned != this.picking.move_lines.length) {
          this.model.shipNow = false;
        }
      }
    } else if (product.product_pickied_qty == 1) {
      let rmProduct: any = this.model.products.splice(idx,1)
      if (rmProduct[0].isExpected) {
        this.productsScanned--;
        this.model.procced = false;
        if (this.productsScanned != this.picking.move_lines.length) {
          this.model.shipNow = false;
        }
      }
    } else {
      this.model.products[idx].product_pickied_qty--;
    }

    // check if we can procced to next step
    if (this.productsScanned == this.picking.move_lines.length){
      this.model.procced = true;
      this.model.products.forEach(element => {
        console.log(element)
        if (element.product_pickied_qty != element.product_qty) {
          this.model.procced = false;
        }
      });
    }

  }
}
