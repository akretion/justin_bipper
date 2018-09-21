import {Injectable} from "@angular/core";
import {Http} from '@angular/http';

import {odooService} from '../angular-odoo/odoo';


@Injectable()
export class StandardProductsProvider {

  constructor(public http: Http, public odoo: odooService) {
    console.log('Init standard product provider');
  }

  fetch() {
    return this.odoo.call('bipper.webservice', 'get_stockpicking_spl', [], {})
  }

  doPick(picking_dict) {
    return this.odoo.call('bipper.webservice', 'do_picking_standard_products', [], {picking_dict})
  }

  doPack(packing_info) {
    return this.odoo.call('bipper.webservice', 'do_packing_std', [], {packing_info})
  }

  doShip(picking_name, pack) {
    var payload = [
      picking_name,
      [pack]
    ];

    return this.odoo.call('bipper.webservice', 'do_ship_std', payload, {});
  }
}
