import {Component, ViewChild} from '@angular/core';
import {Platform, ionicBootstrap, Nav, Menu, App} from 'ionic-angular';
import {StatusBar} from 'ionic-native';
import {BeepPage} from './beep/beep.page';
import {ColisagePage} from './colisage/colisage.page';
import {SearchPage} from './search/Search.page';
import {disableDeprecatedForms} from '@angular/forms';
import {ProductsProvider} from './models/Products.provider';

@Component({
  templateUrl: 'build/menu/menu.html',
  providers: [ProductsProvider]
})
export class MyApp {
  rootPage: any;// = ColisagePage;
  pages: Array<{title: string, component: any}>;
  @ViewChild(Nav) nav;
  @ViewChild(Menu) menu:Menu;
  constructor(platform: Platform) {
    disableDeprecatedForms();
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      this.nav.setRoot(SearchPage);
    });
    this.pages = [
      {title: 'Reception', component: BeepPage},
      {title: 'Colisage', component: ColisagePage},
      {title: "J'ai de la chance", component: SearchPage}
    ];
  }
  openPage(x) {
    this.menu.enable(true);
    this.nav.setRoot(x);
    this.menu.close();
    console.log('finish');
  }
}

ionicBootstrap(MyApp);
