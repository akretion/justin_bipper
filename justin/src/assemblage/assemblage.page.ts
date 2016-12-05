import {Component} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';
import {nextAppComponent} from '../models/actionFor.component';
import {inputBarComponent} from '../models/inputBar.component';

@Component({
  templateUrl: 'assemblage.html',
})
export class AssemblagePage {
  pack: any = {};
  model: any = {};
  nextStep: string = '';
  constructor(
      public navCtrl: NavController,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public productsProvider: ProductsProvider
    ) {
      this.reset();
  }
  displayWarning(msg) {
    this.toastCtrl.create({
      message: msg,
      duration: 2000
    }).present();
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
      this.model.ready = true;
      shipment.packs.forEach((p) => {
        let ready = (p.nextSteps().indexOf('assembler') !== -1);
        this.model.packs[p.name] = {
          ready: ready,
          done: false,
        };
        this.model.ready = this.model.ready && ready;
      });
      console.log('ship set');
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

    if (this.model.toBeScanned == 0) {
      this.model.nextStep = "Assemble";
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
      .then( () => this.productsProvider.ship(shipment));
    this.model.nextStep = 'Expedier';
  }
}
