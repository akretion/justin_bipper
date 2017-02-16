import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ToastController, LoadingController} from 'ionic-angular';

import { odooService } from '../angular-odoo/odoo';
import { RouteService } from '../models/route.Service';

@Component({
  templateUrl: 'login.html',
})
export class LoginPage {
  login: { userpass?: string, db?: string} = {};
  dbs = [];
  submitted = false;
  separator = ' ';
  handleError = null;

  constructor(
      public route: RouteService,
      public odoo: odooService,
      public toastCtrl: ToastController,
      public loadingCtrl: LoadingController) {
    console.log('login page ctrl');
    var defaultDb = null;

    this.handleError = (err) => {
      console.log('yeah ! une erreur', err);
      this.toastCtrl.create({
        message: err.title,
        duration: 3000
      }).present();
    }

    odoo.getSessionInfo()
    .then( x => defaultDb = x.db)
    .then( () => odoo.isLoggedIn().then(
        isLogged => {
          if (isLogged)
              this.loginSuccess();
          return isLogged
        }
      )
    ).then( (isLogged) =>
      if (!isLogged)
        return odoo.getDbList().then(
        x => {
            console.log('voici les bases', x)
            this.dbs = x;
            this.login.db = defaultDb;
        }
      )
    ).then(null, this.handleError);
  }

  onLogin(form) {
    this.submitted = true;
    var db = null, login = null, password = null;

    if (form.valid) {
      db = this.login.db;
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
      this.odoo.login(db, login, password).then(
        () => this.loginSuccess()
      , this.handleError).then(
        () => loader.dismissAll()
      );
    }
  }
  loginSuccess() {
    this.route.goTo('rechercher');
  }
}
