import {Component, ViewChild} from '@angular/core';
import {Platform, Nav, MenuController, App} from 'ionic-angular';
import {StatusBar} from 'ionic-native';

import {RouteService} from './../models/route.Service';

import {BeepPage} from './../beep/beep.page';
import {ColisagePage} from './../colisage/colisage.page';
import {SearchPage} from './../search/Search.page';
import {AssemblagePage} from './../assemblage/assemblage.page';
import {DestockagePage} from './../destockage/destockage.page';

import { LoginPage} from '../login/login';
import { Product } from '../statemachine/src/states';

@Component({
  templateUrl: '../menu/menu.html',
})
export class MyApp {
  rootPage: any;
  appRoutes = [
    {data: {title: 'Receipt' }, component: BeepPage, path:'beep', action:'receptionner'},
    {data: {title: 'Packing' }, component: ColisagePage, path: 'colisage', action:'coliser'},
    {data: {title: "Unstock"}, component: DestockagePage, path:'destockage', action:'destocker'},
    {data: {title: "Ship"}, component: AssemblagePage, path:'assemblage', action: 'assembler'},
    {data: {title: "Inspect" }, component: SearchPage, path: 'search', action:'rechercher'}
  ];

  @ViewChild(Nav) nav;
  constructor(platform: Platform, public routeService: RouteService) {
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
      this.openPage(i.component);
    });
  }
  openPage(x) {
    //this.menu.enable(true);
    this.nav.setRoot(x);
    //this.menu.close();
  }
}
