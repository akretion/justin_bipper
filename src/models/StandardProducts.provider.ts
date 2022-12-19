import {Injectable} from "@angular/core";
import {Http} from '@angular/http';

import {odooService} from '../angular-odoo/odoo';
import { AppServices } from './../models/AppServices';

@Injectable()
export class StandardProductsProvider {
  private pickings: any = {}

  constructor(public http: Http, public odoo: odooService, private appServices: AppServices) {
    console.log('Init standard product provider');
  }

  fetch() {
    // declare promise
    var promise = new Promise((resolve, reject) => {
      // check if we have pickings do display
      if ('pickings' in this.pickings){
        resolve(this.pickings)
      } else {
        let payload = {
          size: 20,
          filter_with_today: this.appServices.getConfig('samples').filter
        }
        this.odoo.call('bipper.webservice', 'get_stockpicking_spl', [payload], {}).then(
          x => {
            // cache the resoult
            this.pickings = x;

            // resolve
            resolve(this.pickings)
          },
          err => {
            reject(err)
          }
        )
      }
    });

    return promise;
  }

  reprintData(pickingName) {
    // declare promise
    return  this.odoo.call('bipper.webservice', 'get_reprint_data_std', [pickingName], {})
  }

  removePicking(id) {
    // get object index in array
    let idx = this.pickings.pickings.findIndex(x => x.id == id)
    
    // remove object from array
    this.pickings.pickings.splice(idx,1)
    
    // decrease total sample 
    this.pickings.totall--;
    // if pickings are empty delete object key to initiate reload
    if (this.pickings.pickings.length == 0){
      delete this.pickings.pickings;
    }
  }

  compare(a, b) {
    // Use toUpperCase() to ignore character casing
    const rack_locationA = a.rack_location.toUpperCase();
    const rack_locationB = b.rack_location.toUpperCase();
  
    let comparison = 0;
    if (rack_locationA > rack_locationB) {
      comparison = 1;
    } else if (rack_locationA < rack_locationB) {
      comparison = -1;
    }
    return comparison;
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
