import { Injectable } from "@angular/core";
import { Http } from '@angular/http';
import { odooService } from '../angular-odoo/odoo';


@Injectable()
export class SamplesProvider {
    constructor(public http: Http, public odoo: odooService) {

    }
    getSamples() {
        var payload = {};
        // return this.odoo.call('bipper.webservice', 'get_samples', [payload], {});
        return Promise.resolve([{
            'id': 1,
            'name':'SRMEM/OUT/00001',
            'products': [{
                'name': 'ABCDEF',
            }, {
                'name': 'EFDG',
            }]
        },  {
            'id': 2,
            'name': 'SREM/OUT/OO0O2',
            'products': [{
                'name': '123'
            }]
        }]);
    }
    shipSample(delivery) {
        //send the delivery prepared
        //and get a printable address label 
        var payload = { 'id': delivery.id, 'name': delivery.name };
        return this.odoo.call('bipper.webservice', 'ship_sample', [payload], {});
    }
}
