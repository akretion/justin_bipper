import {Component, ViewChild} from '@angular/core';
import {Platform, Nav, MenuController, App} from 'ionic-angular';
import {StatusBar} from 'ionic-native';

import {RouteService} from './../models/route.Service';
import { DeadManSwitchService } from '../models/deadManSwitch.Service';
import { odooService } from '../angular-odoo/odoo';

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
import { Product } from '../statemachine/src/states';

import { ToastController } from 'ionic-angular';

@Component({
  templateUrl: '../menu/menu.html',
})
export class MyApp {
  rootPage: any;
  appRoutes = [
    {data: {title: "Home" }, component: HomePage, path: 'home', action:'home', hide:false},
    {data: {title: 'Receipt' }, component: BeepPage, path:'bip', action:'receptionner', hide:false},
    {data: {title: 'Packing' }, component: ColisagePage, path: 'colisage', action:'coliser', hide:false},
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
  constructor(
    platform: Platform,
    public routeService: RouteService,
    public toastCtrl: ToastController,
    public deadManSwitch: DeadManSwitchService,
    public odooService: odooService,
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
    deadManSwitch.setCallback( () => {
      toastCtrl.create({
        message: 'Logout due to inactivity',
        duration: 6000
      }).present();
      return this.routeService.goTo('logout');
    });
    // if we are already logged in, login page is not loaded
    // so we have to activate deadManSwitch here.
    deadManSwitch.start();
  }
  openPage(page, data) {
    console.log('openPage', data);
    this.menuCtrl.enable(true);
    this.nav.setRoot(page, data);
    this.menuCtrl.close();
  }
}
