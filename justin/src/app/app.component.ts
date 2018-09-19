import {Component, ViewChild} from '@angular/core';
import {Platform, Nav, MenuController, App} from 'ionic-angular';
import {StatusBar} from 'ionic-native';

import {RouteService} from './../models/route.Service';

import {BeepPage} from './../beep/beep.page';
import {ColisagePage} from './../colisage/colisage.page';
import {SearchPage} from './../search/Search.page';
import {AssemblagePage} from './../assemblage/assemblage.page';
import {DestockagePage} from './../destockage/destockage.page';
import {HomePage} from './../home/home.page';
import {StockPage} from './../stock/stock.page';
import {LoadPage} from './../load/load.page';
import {DebugPage} from './../debug/debug.page';

import { LoginPage} from '../login/login';
import { LogoutPage} from '../login/logout';
import { StandardProductsPage} from '../standardProducts/standardProducts.page';
import { Product } from '../statemachine/src/states';

import { errorComponent } from '../models/error.handler';

@Component({
  templateUrl: '../menu/menu.html',
})
export class MyApp {
  rootPage: any;
  appRoutes = [
    {data: {title: "Home" }, component: HomePage, path: 'home', action:'home', hide:false},
    {data: {title: 'Receipt' }, component: BeepPage, path:'bip', action:'receptionner', hide:false},
    {data: {title: 'Packing' }, component: ColisagePage, path: 'colisage', action:'coliser', hide:false},
    {data: {title: 'Standard Products' }, component: StandardProductsPage, path: 'standardProducts', action:'standardProducts', hide:false},
    {data: {title: "Unstock"}, component: DestockagePage, path:'destockage', action:'destocker', hide:false},
    {data: {title: "Stock"}, component: StockPage, path:'stock', action:'stocker', hide:false},
    {data: {title: "Ship"}, component: AssemblagePage, path:'assemblage', action: 'assembler', hide:false},
    {data: {title: "Load" }, component: LoadPage, path: 'load', action:'load', hide:false},
    {data: {title: "Inspect" }, component: SearchPage, path: 'search', action:'rechercher', hide:false},
    {data: {title: "Debug" }, component: DebugPage, path: 'debug', action:'debug', hide:false},
    {data: {title: "Logout" }, component: LogoutPage, path: 'logout', action:'logout', hide:false},
    {data: {title: "Login" }, component: LoginPage, path: 'login', action:'login', hide:true}
  ];
  appRoutesWithoutLogin = [];

  @ViewChild(Nav) nav;
  constructor(platform: Platform, public routeService: RouteService,
  public menuCtrl: MenuController) {
    routeService.setRoutes(this.appRoutes);
    var watcher;
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      //routeService.goTo('receptionner');
      this.nav.push(LoginPage);
    });
    watcher = routeService.get();
    watcher.subscribe(i => {
      this.openPage(i.page.component, i.data);
    });

    this.appRoutesWithoutLogin = this.appRoutes.filter(p => p.path !='login');
  }
  openPage(page, data) {
    console.log('openPage', data);
    this.menuCtrl.enable(true);
    this.nav.setRoot(page, data);
    this.menuCtrl.close();
  }
}
