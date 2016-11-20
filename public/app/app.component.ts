import { Component } from '@angular/core';

import { ReservationTarget } from './reservation-target.component';

@Component({
    selector: 'my-app',
    moduleId: module.id,
    template: `
      <table>
          <tr>
              <td valign="top" class="ui-widget">
                  <h1>{{title}}</h1>
                  <button class="btn btn-primary" (click)="add()">+</button>
                  <button class="btn btn-primary" (click)="save()">Save</button>
                  <button class="btn btn-primary" (click)="load()">Load</button>
                  <br />
                  <table>
                  <tr *ngFor="let t of targetList">
                    <td>
                      <reservation-target [target]="t"></reservation-target>
                    </td><td>
                      <button class="btn btn-danger" (click)="delete(t); $event.stopPropagation()">x</button>
                    </td>
                  </tr>
                  </table>
              </td>
          </tr>
      </table>
      <div class="alert alert-success">{{serialized | json}}</div>
    `,
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
        alert(JSON.stringify(jsonArray, null, 2));
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
        for (let serialized of jsonArray) {
            this.targetList.push(ReservationTarget.deserialize(serialized));
        }
    }
}

const STORAGE_KEY_LIST = "keyList";
