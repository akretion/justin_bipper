import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {AlertController, LoadingController} from 'ionic-angular';
import {inputBarComponent} from '../models/inputBar.component';
import {nextAppComponent} from '../models/nextSteps.component';
import {PrintServices} from '../models/PrintServices';
import {RouteService} from '../models/route.Service';
import {StandardProductsProvider} from '../models/StandardProducts.provider';

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
    let idx: number = this.picking.move_lines.findIndex(x => x.name == scanned);

    if (idx != -1) {
      this.model.products.push(this.picking.move_lines[idx])
      this.productsScanned++

      if (this.productsScanned == this.picking.move_lines.length){
        this.model.procced = true;
      }
    } else {
      let newProd: any = {}
      newProd['isExpected'] = false
      newProd['name'] = scanned
      this.model.products.push(newProd)
    }
  }

  doPick() {
    this.model.products.forEach(element => {
      console.log(element)
      if (!element.isExpected) {
        let idx: number = this.model.products.findIndex(x => x.move_id == element.move_id)
        this.model.products.splice(idx,1)
      }
    });

    this.standardProductsProvider.doPick(this.model).then(
      x => {
        console.log(x)
        this.model = x
        this.model.pickDone = true;
        this.model.procced = true;
      },
      err => {
        console.log(err)
      }
    )
  }

  doPack() {
    this.model.weight = this.model.weight;
    this.standardProductsProvider.doPack(this.model).then(
      x => {
        console.log(x)
        this.model = x
        this.model.packDone = true;
        this.model.procced = true;
      },
      err => {
        console.log(err)
      }
    )
  }

  doShip() {
    this.model.weight = this.model.weight;
    this.standardProductsProvider.doShip(this.model.picking_name, this.model.package[1]).then(
      x => {
        console.log(x)
        this.model.shipDone = true;
      },
      err => {
        console.log(err)
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
    this.model['packDone'] = false
    this.model['shipDone'] = false

    // this.inputBar.focus();
  }

  removeOne(product) {
    let idx = this.model.products.findIndex(x => x.name == product.name)
    let rmProduct: any = this.model.products.splice(idx,1)
    if (rmProduct[0].isExpected) {
      this.productsScanned--;
      if (this.productsScanned != this.picking.move_lines.length) {
        this.model.shipNow = false;
      }
    }
  }
}
