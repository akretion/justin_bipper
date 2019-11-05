import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, ToastController, ModalController} from 'ionic-angular';
import {AlertController, LoadingController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';
import {nextAppComponent} from '../models/nextSteps.component';
import {inputBarComponent} from '../models/inputBar.component';
import {CarrierPage} from './carrier.page';
import {PrintServices} from '../models/PrintServices';

console.log('dans assemblage1');
@Component({
  templateUrl: 'assemblage.html',
})
export class AssemblagePage {
  model: any = {};
  nextStep: string = '';
  @ViewChild(inputBarComponent) inputBar:inputBarComponent;
  constructor(
      public navCtrl: NavController,
      public navParams: NavParams,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public loadingCtrl: LoadingController,
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
        //tous les produits doivent être packeds
        return p.nextSteps().length == 0; //no next step = packed
      });

      shipment.packs.forEach((p) => {
        /* tous les packs doivent être shippeds */
        let ready = (p.nextSteps().indexOf('assembler') !== -1);
        this.model.packs[p.name] = {
          ready: ready,
          done: false,
          name: p.name //pour un acces rapide ulterieur
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
    pack.stateMachine.can('destocker').then( (x) => {
      //if a stocked product is scanned, we guess the guy has the pack
      //on hand and it didn't bother to unstock it first
      pack.destocker();
      this.model.packs[pack.name].ready = true;
    }, () => {
      // dummy to avoid zone error if no handler for reject (like it can't be destocker)
    });;
  }
  reset() {
    this.model = { packs: {}};
    if (this.inputBar)
      this.inputBar.focus();
  }
  assembler(shipment) {
    console.log('assemblage');
    //si on est en envoi partiel, on envois la liste des packs
    //shipped packs = les packs à envoyer ou rien (pour tout)
    var shipped_packs = shipment.packs.filter(
        p => this.model.packs[p.name].done
    );
    if (shipped_packs.length == shipment.packs.length)
      shipped_packs = []

    var loader = this.loadingCtrl.create({
      content:'Please wait',
      duration: 3000
    });
    loader.present();
    //il faut update avant
    shipment.update()
      .then( () => shipment.assembler())
      .then( () => this.productsProvider.ship(shipment, shipped_packs))
      .then( (x) => {
        var labels = x.labels;
        var documents = x.documents;
        var msg = 'Transfert Done. ';
        if (0 == (labels.length + documents.length))
          msg += 'Nothing to print';
        else {
          msg += 'Printing ' + labels.length + ' labels';
          msg += ', ' + documents.length + ' docs';
        }
        this.displayWarning(msg);
        labels.forEach( label => this.printServices.printZebra(label.data));
        documents.forEach( doc => this.printServices.printA4(doc.data));
        this.inputBar.focus();
      })
      .then( () => this.reset(), (x) => {
        loader.dismissAll();
        this.displayWarning('An error occured');
        console.log(x); //todo: on devrait logger ça au serveur
      });
    this.model.nextStep = 'Expedier';
  }
}
