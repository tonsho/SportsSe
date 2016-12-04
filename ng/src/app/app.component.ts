import { Component } from '@angular/core';

import { ReservationTarget } from './reservation-target.component';

@Component({
    selector: 'my-app',
    template: `
      <table>
          <tr>
              <td valign="top" class="ui-widget">
                  <h1>{{title}}</h1>
                  <button md-mini-fab (click)="add()">
                    <md-icon class="md-24">add</md-icon>
                  </button>
                  <button md-raised-button color="primary" (click)="save()">SAVE</button>
                  <button md-raised-button color="primary" (click)="load()">LOAD</button>
                  <br />
                  <md-card *ngFor="let t of targetList" style="margin:5px;">
                    <md-card-content>
                      <reservation-target [target]="t"></reservation-target>
                    </md-card-content>
                    <md-card-actions>
                      <button md-raised-button color="warn" (click)="delete(t); $event.stopPropagation()">DELETE</button>
                    </md-card-actions>
                  </md-card>
              </td>
          </tr>
      </table>
      <div>{{serialized | json}}</div>
    `,
    styles: [`
      div {
        font-family: Avenir , "Open Sans" , "Helvetica Neue" , Helvetica , Arial , Verdana , Roboto , "游ゴシック" , "Yu Gothic" , "游ゴシック体" , "YuGothic" , "ヒラギノ角ゴ Pro W3" , "Hiragino Kaku Gothic Pro" , "Meiryo UI" , "メイリオ" , Meiryo , "ＭＳ Ｐゴシック" , "MS PGothic" , sans-serif;
      }
  `]
})
export class AppComponent {
    title = 'Reservation Target';
    targetList: ReservationTarget[] = [new ReservationTarget(), new ReservationTarget(), new ReservationTarget()];
    serialized: Object[];

    add(): void {
        this.targetList.push(new ReservationTarget());
    }

    save(): void {
        console.log("save");
        let jsonArray = new Array();
        for (let t of this.targetList) {
            let serizalized = t.serialize();
            if (0 < serizalized.time.length) {
                jsonArray.push(serizalized)
            }
        }
        console.log(JSON.stringify(jsonArray));
        localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(jsonArray));
        this.serialized = jsonArray;
    }

    delete(target: ReservationTarget): void {
        console.log("delete");
        this.targetList = this.targetList.filter(t => t !== target);
    }

    load(): void {
        console.log("load")
        this.targetList = [];
        let jsonArray = JSON.parse(localStorage.getItem(STORAGE_KEY_LIST));
        console.log(JSON.stringify(jsonArray));
        this.serialized = jsonArray;
        for (let serialized of jsonArray) {
            this.targetList.push(ReservationTarget.deserialize(serialized));
        }
    }
}

const STORAGE_KEY_LIST = "keyList";
