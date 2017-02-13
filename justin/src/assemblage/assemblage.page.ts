import {Component} from '@angular/core';
import {NavController, NavParams, ToastController, ModalController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';
import {nextAppComponent} from '../models/actionFor.component';
import {inputBarComponent} from '../models/inputBar.component';
import {CarrierPage} from './carrier.page';
import {PrintServices} from '../models/PrintServices';

console.log('dans assemblage1');
@Component({
  templateUrl: 'assemblage.html',
})
export class AssemblagePage {
  pack: any = {};
  model: any = {};
  nextStep: string = '';
  constructor(
      public navCtrl: NavController,
      public navParams: NavParams,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public modalCtrl: ModalController,
      public productsProvider: ProductsProvider,
      public printServices: PrintServices
    ) {
      this.reset();

      var scanned = this.navParams.get('scanned');
      if (scanned)
        this.addIt(scanned);
  }
  displayWarning(msg) {
    this.toastCtrl.create({
      message: msg,
      duration: 2000
    }).present();
  }
  showModal(shipment) {
    this.modalCtrl.create(CarrierPage, {shipment: shipment}).present()
  }
  addIt(scanned) {
    if (!scanned)
      return;
    let pack = this.productsProvider.getPack(scanned);

    if (!pack)
      return this.displayWarning(`${scanned} not found`);
    if (this.model.packs[pack.name] && this.model.packs[pack.name].done)
      return this.displayWarning(`${scanned} already scanned`);

    if (!this.model.shipment) {
      let shipment = pack.shipment
      this.model.shipment = shipment;
      this.model.toBeScanned = shipment.packs.length;

      this.model.allProductsPacked = shipment.products.every( (p) => {
        //tous les produits doivent être colisés
        return p.nextSteps().length == 0; //no next step = colisé
      });
      console.log('tous les produits du shipment packed', this.model.allProductsPacked);

      shipment.packs.forEach((p) => {
        /* tous les packs doivent être assemblés */
        let ready = (p.nextSteps().indexOf('assembler') !== -1);
        this.model.packs[p.name] = {
          ready: ready,
          done: false,
        };
      });
    } else {
      if (this.model.shipment != pack.shipment) {
        console.log('on reset car ', this.model.shipment,'!=', pack.shipment);
        this.reset();
        return this.displayWarning(`${scanned} is not from the same shipment`);
      }
      console.log('ship already set normal pour un deuximee prod');
    }
    this.model.nextStep = "";
    this.model.toBeScanned--;
    this.model.packs[pack.name].done = true;
    this.model.ready = false;

    if (this.model.shipment.partial_allowed) {
      this.model.nextStep = "Assemble"; // rien a foutre !
      this.model.ready = true;
    } else if (this.model.toBeScanned == 0 && this.model.allProductsPacked) {
      this.model.nextStep = "Assemble";
      this.model.ready = true;
    } else if (this.model.allProductsPacked) {
      this.model.nextStep = `Some products are not packed`;
    } else {
      this.model.nextStep = `${this.model.toBeScanned} of ${this.model.shipment.packs.length} to scan`;
    }

    console.log(this.model);

  }
  reset() {
    this.model = { packs: {}};
  }
  assembler(shipment) {
    console.log('assemblage', shipment);
    //il faut update avant
    shipment.update()
      .then( () => shipment.assembler())
      .then( () => this.productsProvider.ship(shipment))
      .then( (labels) => {
        var msg = 'Transfert Done.'
        msg+= (labels.length == 0) ? 'Nothing to print': 'Printing ' + labels.length + ' labels'
        this.displayWarning(msg);
        labels.forEach( label => this.printServices.printZebra(label.data));
      })
      .then( () => this.reset(), (x) => {
        this.displayWarning('An error occured');
        console.log(x); //todo: on devrait logger ça au serveur
      });
    this.model.nextStep = 'Expedier';
  }
}
