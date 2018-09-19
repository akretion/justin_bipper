import {Component} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';
import {ProductsProvider} from '../models/Products.provider';
import {inputBarComponent} from '../models/inputBar.component';
import {nextAppComponent} from '../models/nextSteps.component';
import { RouteService } from '../models/route.Service';

@Component({
  templateUrl: 'home.html',
})
export class HomePage {
  pack: any = {};
  model: any = { packs: null};
  searched: any = {};
  nextStep: string = '';
  listeDeCourses= [];
  constructor(
      public navCtrl: NavController,
      private alertCtrl: AlertController,
      private toastCtrl: ToastController,
      private routeService: RouteService,
      private productsProvider: ProductsProvider
    ) {
      console.log('dans le consturteur de home');
      this.searched = {};
  }
  addIt(scanned) {
    console.log('il a scanned', scanned);
    let pack = this.productsProvider.getPack(scanned);
    let prod = this.productsProvider.getProducts(scanned);
    let steps = [];

    if (pack) {
      //on a trouvé un pack
      this.model.searched = "pack";
      let shipSteps = pack.shipment.nextSteps();
      let packSteps = pack.nextSteps();
      let packMinusShip = [];
      let shipMinusPack = [];
      //pack - ship
      packMinusShip = packSteps.filter( (step) => shipSteps.indexOf(step) == -1);

      //ship - pack
      shipMinusPack = shipSteps.filter( (step) => packSteps.indexOf(step) == -1);


      console.log('pack - ship', packMinusShip, 'ship-pack', shipMinusPack,
      'steps', steps,
      'shipstesp', shipSteps, 'packstesp', packSteps)
      if (shipMinusPack.length > 0) {
        steps = [];
      } else {
        if (shipSteps.length == 1) {
          steps = shipSteps; // only ship ?
        } else {
          steps = packMinusShip;
        }
      }
    } else if (prod.length) {
      // on a trouve un produit
      let uniq = new Set();
      prod.forEach(p => p.nextSteps().forEach(s => uniq.add(s)));
      steps = Array.from(uniq);
      this.model.searched = "product";
    } else {
      this.searched.notFound = true;
      this.searched.term = scanned;
    }

    if (steps.length == 1) {
      console.log('On sait ce qu on a faire, on redirige sur ', steps);
      this.routeService.goTo(steps[0], { 'scanned': scanned });
      //TODO: verifier que l'action existe (ex produire?)
    } else {
      console.log('trop de choix possibles ou pas assez, on redirige sur search', steps);
      this.routeService.goTo('rechercher', { 'scanned': scanned });
    }

  }

  reset() {
  }
  
  validate() {
  }
}
