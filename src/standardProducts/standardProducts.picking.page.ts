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
  addressLabel: any;
  finishHim: boolean = false;
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
      else {
        // go back to BL list
        this.navCtrl.push(StandardProductsPage)
        this.displayWarning(`Wrong data`);
      }
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
    this.picking.move_lines = this.picking.move_lines.sort(this.standardProductsProvider.compare)
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

    } else {
      // we picked wrong product, so we create fake product with isExpected flag as false
      let newProd: any = {}
      newProd['isExpected'] = false
      newProd['name'] = scanned
      newProd['product_pickied_qty'] = 1
      newProd['product_qty'] = 1
      this.model.products.push(newProd)
      this.model.procced = false;
    }

    let BreakException = {};

    try {
      
      if (this.model.products.length !== this.picking.move_lines.length){
        throw BreakException;
      }

      this.model.products.forEach(product => {
        if (!product.isExpected){
          throw BreakException;
        }

        if (product.product_pickied_qty != product.product_qty){
          throw BreakException;
        }
      });

      this.model.procced = true;

    } catch (e) {
      this.model.procced = false;
      if (e !== BreakException) throw e;
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
        this.standardProductsProvider.remain_picks = this.standardProductsProvider.remain_picks + 1;
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

    this.standardProductsProvider.doShip(this.model.picking_name, this.model.package).then(
      x => {
        if (x) {
          loader.dismissAll();
          this.model.shipDone = true;

          // print label
          this.addressLabel = x[1];
          this.printServices.printDymo(this.addressLabel);
          this.displayWarning(`Saved`);
          
          // remove picking from cache
          this.standardProductsProvider.removePicking(this.picking.id);
          

          this.finishHim = true;
          // // go back to BL list
          // this.navCtrl.push(StandardProductsPage)
        }
      },
      err => {
        console.log(err);
        loader.dismissAll();
        this.displayWarning(err);
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
  }

  removeOne(product) {
    let idx = this.model.products.findIndex(x => x.name == product.name)
    
    if (product.product_pickied_qty == product.product_qty && product.product_qty == 1) {
      this.model.products.splice(idx,1)

    } else {
      this.model.products[idx].product_pickied_qty--;
    }

    // check if we can procced to next step
    let BreakException = {};

    try {
      
      if (this.model.products.length !== this.picking.move_lines.length){
        throw BreakException;
      }

      this.model.products.forEach(product => {
        if (!product.isExpected){
          throw BreakException;
        }

        if (product.product_pickied_qty != product.product_qty){
          throw BreakException;
        }
      });

      this.model.procced = true;

    } catch (e) {
      this.model.procced = false;
      if (e !== BreakException) throw e;
    }

    this.inputBar.focus();
  }

  rePrint() {
    this.printServices.printDymo(this.addressLabel);
    this.displayWarning('Send label to printer');
  }

  goBack(){
     // go back to BL list
     this.navCtrl.push(StandardProductsPage)
  }
}
