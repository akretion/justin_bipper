import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ToastController, LoadingController} from 'ionic-angular';

import { odooService } from '../angular-odoo/odoo';
import { RouteService } from '../models/route.Service';

@Component({
  template: '<p>Wait, we logout</p>',
})
export class LogoutPage {

  constructor(
      public route: RouteService,
      public odoo: odooService,
      public toastCtrl: ToastController,
      public loadingCtrl: LoadingController) {
    console.log('logout page ctrl');

    odoo.logout().then(
      () => this.route.goTo('login')
    );
  }
}
