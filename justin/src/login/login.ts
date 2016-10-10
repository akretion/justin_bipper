import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
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

  constructor(public route: RouteService, public odoo: odooService) {
    console.log('login page ctrl');
    var defaultDb = null;
    odoo.getSessionInfo().then( x => defaultDb = x.db)
    .then( () => odoo.isLoggedIn().then(
        isLogged => {
          if (isLogged)
              this.loginSuccess();
        }
      )
    ).then( () => odoo.getDbList().then(
        x => {
            console.log('voici les bases', x)
            this.dbs = x;
            this.login.db = defaultDb;
        }
      )
    );
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
      this.odoo.login(db, login, password).then(
        () => this.loginSuccess()
      );

      console.log(form);
      console.log('boom c\'est bon');
    }
  }
  loginSuccess() {
    console.log('go to home');
    this.route.goTo('receptionner');
  }
}
