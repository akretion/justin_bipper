import { Component, ViewChild } from '@angular/core';
import { NavParams, NavController, ToastController } from 'ionic-angular';
import { AlertController, LoadingController } from 'ionic-angular';
import { ProductsProvider } from '../models/Products.provider';
import { SamplesProvider } from '../models/Samples.provider';
import { inputBarComponent } from '../models/inputBar.component';
import { RouteService} from '../models/route.Service';

@Component({
    templateUrl: 'sample_detail.html',
})
export class SamplePage {
    model: any = { products: Map };
    nextStep: string = '';
    delivery = { products: []};
    @ViewChild(inputBarComponent) inputBar: inputBarComponent;
    constructor(
        public params: NavParams,
        public navCtrl: NavController,
        private toastCtrl: ToastController,
        private loadingCtrl: LoadingController,
        private productsProvider: ProductsProvider,
        private samplesProvider: SamplesProvider,
        private routeService: RouteService      ,
    ) {
        productsProvider.explicitPause(); //stop sync for other modules
        this.delivery = this.params.get('delivery');
        this.reset();
    }
    displayWarning(msg) {
        this.toastCtrl.create({
            message: msg,
            duration: 2000
        }).present();
    }
    addIt(scanned) {

        let p = this.delivery.products.find(a => a.name == scanned);
        if (!p)
             return this.displayWarning(`${scanned} not in the list`);
    
        this.model.products.set(p.name, p);
    }
    reset() {
        this.model = { products: new Map() };

        if (this.inputBar)
            this.inputBar.focus();
    }
    validate() {
        var loader = this.loadingCtrl.create({
            content: 'Please wait',
            duration: 3000
        });
        loader.present();
        var products = Array.from(this.model.products.values());
        this.samplesProvider.shipSample(products)
        .then(() => {
            this.displayWarning(`Printing... !`);
            loader.dismissAll();
        }).then( () => console.log('print here the  label'))
        .then(() => this.routeService.goTo('sample_list'));
    }
}
