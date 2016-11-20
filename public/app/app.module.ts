import './rxjs-extensions';

import { NgModule }           from '@angular/core';
import { BrowserModule }      from '@angular/platform-browser';
import { FormsModule }        from '@angular/forms';

import { AppComponent }        from './app.component';
import { ReservationTagetComponent } from './reservation-target.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
    ],
    declarations: [
        AppComponent,
        ReservationTagetComponent,
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
