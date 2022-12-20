import {ErrorHandler} from '@angular/core';

import {Component} from '@angular/core';
import {NavController, ToastController} from 'ionic-angular';
import {AlertController} from 'ionic-angular';

import {odooService} from '../angular-odoo/odoo';

@Component({
  selector: 'error-handler',
  template: `
    <h2></h2>
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
      if (x.title && x.message) {
        msgs[(x.title == "internal_error") as any] = "Error ! " + x.message;
        msgs[(x.title == "UserError") as any] = "User Error ! " + x.message;
        msgs[(x.title == 'wrong_login') as any] = "Wrong credentials, Please reconnect";
        msgs[(x.title == 'SessionExpired') as any] = "Session Expired. Please reconnect";
        msgs[(x.title == 'ValidationError') as any] = x.message;        
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
