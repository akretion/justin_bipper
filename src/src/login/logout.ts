import { Component } from '@angular/core';
import { ToastController, LoadingController} from 'ionic-angular';

import { odooService } from '../angular-odoo/odoo';
import { RouteService } from '../models/route.Service';
import { DeadManSwitchService } from '../models/deadManSwitch.Service';

@Component({
  template: '<p>Wait, we logout</p>',
})
export class LogoutPage {

  constructor(
      public route: RouteService,
      public deadManSwitch: DeadManSwitchService,
      public odoo: odooService,
      public toastCtrl: ToastController,
      public loadingCtrl: LoadingController) {

    odoo.logout().then(
      function ()  {
        route.goTo('login')
        deadManSwitch.stop();
      }
    );

  }
}
