import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {AlertController, LoadingController} from 'ionic-angular';
import {inputBarComponent} from '../models/inputBar.component';
import {nextAppComponent} from '../models/nextSteps.component';
import {RouteService} from '../models/route.Service';
import {ProductsProvider} from '../models/Products.provider';
import {StandardProductsProvider} from '../models/StandardProducts.provider';
import {PrintServices} from '../models/PrintServices';

import {StandardProductsPickingPage} from './standardProducts.picking.page';

@Component({
  templateUrl: 'standardProducts.html',
})
export class StandardProductsPage {
  model: any = {};
  pickings: any = {};
  doReprint: Boolean = false;
  search: any = {};
  remain_picks: any = {};


  @ViewChild(inputBarComponent) inputBar:inputBarComponent;
  // @ViewChild(nextAppComponent) nextApp:nextAppComponent;

  constructor(
      public navCtrl: NavController,
      public navParams: NavParams,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      public loadingCtrl: LoadingController,
      public routeService: RouteService,
      private standardProductsProvider: StandardProductsProvider,
      private productsProvider: ProductsProvider,
      private printServices: PrintServices,
    ) {
      productsProvider.explicitPause();
  }

  ionViewDidLoad(){
    this.standardProductsProvider.fetch().then(
      x => {
        this.pickings = x
        console.log(this.pickings)
      },
      err => {
        this.displayWarning(err);
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
    let loader = this.loadingCtrl.create({
      content:'Please wait searching for: '+scanned
    });
    loader.present();
    this.standardProductsProvider.reprintData(scanned).then(
      x => {
        // change view
        this.doReprint = true;

        console.log(x)
        this.search = x;
        loader.dismissAll();
      },

      err => {
        // change view
        this.doReprint = false;

        loader.dismissAll();
        console.log(scanned)
      }
    )
    
  }

  rePrint() {
    this.printServices.printDymo(this.search.pdf);
    this.displayWarning('Send label to printer');
  }

  goBack(){
    this.search = {}
    this.doReprint = false;
  }
  
  selectPicking(item) {
    console.log('selected picking: ', item)
    this.navCtrl.push(StandardProductsPickingPage, {picking:item})
  }
}
