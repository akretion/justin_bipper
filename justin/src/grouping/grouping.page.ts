import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { GroupingProvider } from './Grouping.Provider';
import { ProductsProvider } from '../models/Products.provider';
import { inputBarComponent } from '../models/inputBar.component';
import { nextAppComponent } from '../models/nextSteps.component';
import { PrintServices } from '../models/PrintServices';
import { RouteService } from '../models/route.Service';
import { Pack, Shipment } from '../statemachine/src/states';

@Component({
    templateUrl: 'grouping.html',
})
export class GroupingPage {
    model: {
        shipment: Shipment,
        shipmentTotalWeight: Number,
        packs: Array<Pack>,
        weight: Number,
        nextStep: string,
    } = { packs: [], weight: 0, shipment: undefined, shipmentTotalWeight: 0, nextStep: undefined};
    @ViewChild(inputBarComponent) inputBar: inputBarComponent;
    @ViewChild(nextAppComponent) nextApp: nextAppComponent;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private toastCtrl: ToastController,
        public loadingCtrl: LoadingController,
        private groupingProvider: GroupingProvider,
        private productsProvider: ProductsProvider,
        private printServices: PrintServices,
        public routeService: RouteService,
    ) {
        console.log('grouping Ctrl');
        this.reset();

        var scanned = this.navParams.get('scanned');
        if (scanned)
            this.addIt(scanned);
    }
    displayWarning(msg) {
        var toast = this.toastCtrl.create({
            message: msg,
            duration: 2000
        });
        toast.onDidDismiss(() => this.inputBar.focus());
        return toast.present();
    }
    addIt(scanned) {
        if (!scanned)
            return;
        let pack = this.productsProvider.getPack(scanned);

        if (!pack)
            return this.displayWarning(`${scanned} not found`);
        
        if (this.model.packs.find( (x) => x == pack))
            return this.displayWarning(`${scanned} already scanned`);

        if (!this.model.shipment) {
            this.model.shipment = pack.shipment;
            this.model.shipmentTotalWeight = pack.shipment.packs.reduce((prev, cur) => prev + cur.weight, 0);
        } else {
            if (this.model.shipment != pack.shipment) {
                this.reset();
                return this.displayWarning(`${scanned} is not from the same shipment`);
            }
        }
        this.model.packs.push(pack);
        this.model.weight = this.model.packs.reduce(function (prev, cur) {
            return prev + cur.weight;
        }, 0)

        // TODO: empecher l'user de commencer à grouper si tout n'a pas été reçu ?
        //if (this.model.allProductsPacked) {
        //    this.model.nextStep = `Some products are not packed`;
        //}
        pack.stateMachine.can('destocker').then((x) => {
            //if a stocked pack is scanned, we guess the guy has the pack
            //on hand and it didn't bother to unstock it first
            console.log('on va desctock');
            pack.destocker();
        }, () => {
            // dummy to avoid zone error if no handler for reject (like it can't be destocker)
        });
    }
    printAndContinue() {
        var loader = this.loadingCtrl.create({
            content: 'Please wait',
            duration: 3000
        });
        loader.present();

        return this.groupingProvider.groupPack(this.model.weight, this.model.packs, { 'withLabel': true })
            .then(
                (pack) => {
                    var ns = pack.shipment.nextSteps();
                    if (ns.indexOf('assembler') != -1) {
                        this.nextApp.refresh();
                    }
                    loader.dismissAll();
                    this.printServices.printDymo(pack.label);
                    return this.displayWarning(`Saved`);
                }).then(() => this.inputBar.focus())
            .then(() => this.reset());
    }
    shipNow() {
        //pack, don't prnt label and go to shipping page directly
        var loader = this.loadingCtrl.create({
            content: 'Please wait',
            duration: 3000
        });
        loader.present();

        // redirect to ship
        this.groupingProvider.groupPack(this.model.weight, this.model.packs, { 'withLabel': false })
            .then(
                (pack) => {
                    loader.dismissAll()
                    return this.routeService.goTo('assembler', { 'scanned': pack.name });
                }
            );
        this.reset();
    }

    reset() {
        this.groupingProvider.reset();
        this.model = { 
            packs: [], weight: 0,
            shipment: undefined,
            shipmentTotalWeight: 0,
            nextStep: undefined};
        if (this.inputBar)
            this.inputBar.focus();
    }

    remove(pack) {
        let idx = this.model.packs.findIndex(x => x == pack)
        this.model.packs.splice(idx, 1);
        // update sum of weights
        this.model.weight = this.model.packs.reduce(function (prev, cur) {
            return prev + cur.weight;
        }, 0)
    }
}
