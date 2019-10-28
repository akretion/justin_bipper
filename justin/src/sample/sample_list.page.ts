import { Component, ViewChild } from '@angular/core';
import { ToastController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { ProductsProvider } from '../models/Products.provider';
import { SamplesProvider } from '../models/Samples.provider';
import { inputBarComponent } from '../models/inputBar.component';
import { RouteService } from '../models/route.Service';

@Component({
    templateUrl: 'sample_list.html',
})
export class SampleListPage {
    deliveries = [];
    @ViewChild(inputBarComponent) inputBar: inputBarComponent;
    constructor(
        private toastCtrl: ToastController,
        private loadingCtrl: LoadingController,
        private productsProvider: ProductsProvider,
        private samplesProvider: SamplesProvider,
        private routeService: RouteService,
    ) {
        productsProvider.explicitPause();
        this.refresh();
    }
    displayWarning(msg) {
        this.toastCtrl.create({
            message: msg,
            duration: 2000
        }).present();
    }
    addIt(scanned) {
        let p = this.deliveries.find(a => a.name == scanned);
        if (!p)
            return this.displayWarning(`${scanned} not in the list`);
        this.routeService.goTo('sample_detail', { 'delivery': p });
    }
    refresh() {
        var loader = this.loadingCtrl.create({
            content: 'Please wait',
            duration: 3000
        });
        loader.present();
        this.samplesProvider.getSamples()
        .then((deliveries) => {
            this.deliveries = deliveries;
            loader.dismissAll();
        })
        if (this.inputBar)
            this.inputBar.focus();
    }
}
