import {Component, ViewChild} from '@angular/core';
import {NavController, ToastController, LoadingController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';
import {inputBarComponent} from '../models/inputBar.component';

@Component({
  templateUrl: 'load.html',
})
export class LoadPage {
  model: any = {};
  @ViewChild(inputBarComponent) inputBar:inputBarComponent;
  constructor(
      public navCtrl: NavController,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public loadingCtrl: LoadingController,
      public productsProvider: ProductsProvider) {
    this.model.packs = [];
  }
  addIt(scanned) {
    if (!scanned)
      return;
    let pack = { 'name': scanned};
    /*this.productsProvider.getPack(scanned);
    Pour le moment on envoi de manière bête et méchante.
    Si on veux savoir exactement ce qu'on envoi et si on a le droit d'y faire
    le code est presque prêt, la machine à état nécessite un peu de boulot mais
    l'essenciel est fait.
    console.log('on a trouvé ! ', pack);
    if (!pack){
      this.displayWarning(`${scanned} not found`)
      return this.reset();
    }
    if (!pack.stateMachine.availableState().find(p => p.to == 'load')) {
      this.displayWarning(`${scanned} can't be loaded`);
      return this.reset();
    }*/
    this.model.packs.push(pack);

  }
  displayWarning(msg) {
    this.toastCtrl.create({
      message: msg,
      duration: 2000
    }).present();
  }
  validate() {
    console.log('send this to the server');

    var loader = this.loadingCtrl.create({
      content:'Please wait',
      duration: 3000
    });
    loader.present();

    this.productsProvider.load_truck(this.model.packs).then(
      () => {
        loader.dismissAll()
        this.displayWarning('Saved');
        this.reset();
      },
      (y) => {
        loader.dismissAll()
        this.displayWarning('Error ! ' + y);
      }
    );
  }
  reset() {
    this.model.packs = [];
    this.inputBar.focus();
  }
  removeOne(pack) {
    this.model.packs.splice(this.model.packs.indexOf(pack), 1);
    this.inputBar.focus();
  }
  showConfirm() {
    var confirm = this.alertCtrl.create({
      title: "Confirmation",
      message: "Are you sure you to delete the list of scans ?",
      buttons: [{
        text: 'Cancel'
      }, {
        text:'Delete',
        handler: () => {
          console.log('delete');
          this.reset();
        }
      }]
    });
    confirm.present();
  }
}
