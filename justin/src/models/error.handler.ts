import {ErrorHandler} from '@angular/core';

import {Component} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';

import {odooService} from '../angular-odoo/odoo';

@Component({
  selector: 'error-handler',
  template: `
    <h2>Je gère avec Classe</h2>
  `,
})
export class errorComponent {
  constructor(
    public odoo: odooService,
    public alertCtrl: AlertController
  ) {
    console.log('myErrorHnadler cstroct')
    odoo.errorInterceptors.push(errorHandler);
    var self = this;
    function errorHandler(x) {
      console.log('erorHandler', x);
      var msgs = {};
      msgs[true as any] = 'Unkown error';
      if (x.fullTrace.data) {
        msgs[(x.fullTrace.data.exception_type == "internal_error") as any] = "Error ! " + x.fullTrace.data.message;
        msgs[(x.fullTrace.data.exception_type == 'wrong_login') as any] = "Please reconnect";
        msgs[(x.fullTrace.data.exception_type == 'validation_error') as any] = x.fullTrace.data.message;
      } else {
        msgs[(x.message == 'HTTP Error') as any] = "Server is may be down ?";
      }

      var confirm = self.alertCtrl.create({
        title: "Error",
        message: msgs[true as any],
        buttons: [{
          text: 'Cancel'
        }, {
          text:'Ok',
          handler: () => {
            console.log('ne rien faire et continuer comme si rien n\'était');
          }
        }]
      });
      confirm.present();

    }
  }
}
