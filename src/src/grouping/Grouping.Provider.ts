import { Injectable } from '@angular/core';
import { ProductsProvider } from '../models/Products.provider';
import { odooService } from '../angular-odoo/odoo';

import { Pack, Shipment, Product } from '../statemachine/src/states';
import { PromiseObservable } from 'rxjs/observable/PromiseObservable';

@Injectable()
export class GroupingProvider {
    pack: any;
    ship: any;
    constructor(
        private productsProvider: ProductsProvider,
        private odoo: odooService
    ) {
        this.reset();
    }
    groupPack(weight, packs, withLabel) {
        //TODO appeler pour faire d'un groupe cote odoo
        console.log('weight, products', weight, packs);
        var withLabel = withLabel['withLabel'];
        var products = packs.flatMap(p => p.products);
        var newPack = this.pack;
        var shipment = products[0].shipment
        newPack.shipment = shipment;
        return shipment.stateMachine.can('group', { weight: weight, packs: packs, newPack: newPack })
            .then(() => {
                var payload = {
                    'weight': weight,
                    'packs': packs.map(x => x.name)
                };
                return this.odoo.call('bipper.webservice', 'do_group_pack', [payload, withLabel], {})
                //return  ['nouveau nom', 'labellabel'];
            }).then((x) => {
                newPack.name = x[0];
                newPack.label = x[1];
                this.productsProvider.explicitRefresh();
                return newPack;
            }).then(() => shipment.setPack(newPack)
            ).then(() => shipment.group(weight, packs, newPack)
            ).then(() => this.productsProvider.addPack(newPack)
            ).then(() => newPack, (err) => console.log('erreur', err));
    }
    reset() {
        //on défait
        this.pack = this.productsProvider.newPack();
        return this.pack;
    }
};
