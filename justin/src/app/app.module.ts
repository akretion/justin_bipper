import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import {HttpModule} from '@angular/http';


import { MyApp } from './app.component';

import {BeepPage} from '../beep/beep.page';
import {ColisagePage} from '../colisage/colisage.page';
import {SearchPage} from '../search/Search.page';
import {AssemblagePage} from '../assemblage/assemblage.page';
import {DestockagePage} from '../destockage/destockage.page';
import { GroupingPage } from '../grouping/grouping.page';
import {StockPage} from './../stock/stock.page';
import {LoadPage} from '../load/load.page';
import {DebugPage} from '../debug/debug.page';
import {LoginPage} from '../login/login';
import {LogoutPage} from '../login/logout';
import {CarrierPage} from '../assemblage/carrier.page';
import {HomePage} from '../home/home.page';

import {ScansProvider} from '../beep/Scans.provider';
import {ProductsProvider} from '../models/Products.provider';
import {ColisageProvider} from '../colisage/Colisage.Provider';
import {GroupingProvider} from '../grouping/Grouping.Provider';
import {RouteService} from '../models/route.Service';
import {nextAppComponent} from '../models/nextSteps.component';
import {inputBarComponent} from '../models/inputBar.component';
import {PrintServices} from './../models/PrintServices';

import { odooService } from '../angular-odoo/odoo';
import { errorComponent } from '../models/error.handler';
import { DeadManSwitchService } from '../models/deadManSwitch.Service';

@NgModule({
  declarations: [
    MyApp,
    BeepPage,
    ColisagePage,
    SearchPage,
    AssemblagePage,
    CarrierPage,
    DestockagePage,
    GroupingPage,
    StockPage,
    LoadPage,
    LoginPage,
    LogoutPage,
    DebugPage,
    HomePage,
    nextAppComponent,
    inputBarComponent,
    errorComponent,
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    HttpModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    BeepPage,
    ColisagePage,
    SearchPage,
    AssemblagePage,
    CarrierPage,
    DestockagePage,
    GroupingPage,
    StockPage,
    LoadPage,
    LoginPage,
    LogoutPage,
    DebugPage,
    HomePage,
  ],
  providers: [
      ProductsProvider,
      ScansProvider,
      ColisageProvider,
      GroupingProvider,
      RouteService,
      DeadManSwitchService,
      odooService,
      PrintServices,
  ]
})
export class AppModule{}
