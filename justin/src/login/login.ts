import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  templateUrl: 'login.html',
})
export class LoginPage {
  login: { username?: string, password?: string} = {};
  submitted = false;

  constructor(public navCtrl: NavController) {}

  onLogin(form) {
    this.submitted = true;

    if (form.valid) {
      console.log('boom c\'est bon');
    }
  }
}
