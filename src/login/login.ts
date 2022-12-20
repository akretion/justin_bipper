import { Component } from '@angular/core';
import { ToastController, LoadingController} from 'ionic-angular';

import { odooService } from '../angular-odoo/odoo';
import { RouteService } from '../models/route.Service';
import { DeadManSwitchService } from '../models/deadManSwitch.Service';

@Component({
  templateUrl: 'login.html',
})
export class LoginPage {
  login: { userpass?: string} = {};
  submitted = false;
  separator = ' ';
  handleError = null;

  constructor(
      public route: RouteService,
      public deadManSwitch: DeadManSwitchService,
      public odoo: odooService,
      public toastCtrl: ToastController,
      public loadingCtrl: LoadingController) {
    console.log('login page ctrl');

    // no need to detect activity on this page.
    deadManSwitch.stop();

    this.handleError = (err) => {
      this.toastCtrl.create({
        message: err.title,
        duration: 3000
      }).present();
    }

    odoo.getSessionInfo()
    .then( () => odoo.isLoggedIn().then(
        isLogged => {
          if (isLogged)
              this.loginSuccess();
          return isLogged
        }
      ), this.handleError);
  }

  onLogin(form) {
    this.submitted = true;
    var login = null, password = null;

    if (form.valid) {
      let userpass = this.login.userpass;
      if (userpass.indexOf(this.separator) !== -1 ) {
        let splitted = userpass.split(this.separator);
        login = splitted[0];
        password = splitted[1];
      } else { //token based auth
        login = 'based_on_token';
        password = userpass;
      }

      var loader = this.loadingCtrl.create({
        content:'Please wait',
        duration: 3000
      });
      loader.present();
      this.odoo.login(login, password).then(
        (a) => { this.loginSuccess() }
      , this.handleError).then(
        () => loader.dismissAll()
      );
    }
  }
  loginSuccess() {
    this.route.goTo('home');
    this.deadManSwitch.start();
  }
}
