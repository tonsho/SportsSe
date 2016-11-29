import { Component, Input } from '@angular/core';

@Component({
    selector: 'reservation-target',
    template: `
      <table class="reservationItem">
        <tr>
        <td>
          <input id="{{'inputDate' + target.calendar_idx}}" class="editable" type="text" [(ngModel)]="target.date" style="width:7em;font-size:large;text-align:center" onclick="YahhoCal.render(this.id);">
          <div id="{{'calendar' + target.calendar_idx}}"></div>
        </td>
        <td>
          <select class="" (change)="onChangeFacility($event.target.value)">
            <option *ngFor="let f of facilities" [selected]="target.facility.name == f.name" >{{f.name}}</option>
          </select>
          <div>
          </div>
          <table><tr>
            <td *ngFor="let s of target.facility.slots">
              <input type="checkbox" class="editable" value="{{s.t}}" [checked]="s.v" (change)="s.v=$event.target.checked">
              <label>{{s.t}}</label>
            </td>
          </tr></table>
        </td>
      </table>
      {{this | json}}
    `
})
export class ReservationTagetComponent {
    @Input() target: ReservationTarget;
    facilities = FACILITIES;
    onChangeFacility(name: string): void {
        this.target.changeFacility(name);
    }
    onChangeDate(obj: Object): void {
        let e = <HTMLInputElement>UI.getElementById("inputDate" + this.target.calendar_idx);
        this.target.date = e.value;
    }
}

let next_calendar_idx: number = 0;

export class ReservationTarget {
    calendar_idx: number;
    date: string;
    facility: Facility;
    constructor() {
        this.calendar_idx = next_calendar_idx;
        next_calendar_idx += 1;
        var defaultDate = new Date();
        defaultDate.setDate(1);
        defaultDate.setMonth(defaultDate.getMonth() + 1);
        this.date = toDateString(defaultDate.getUTCFullYear(), defaultDate.getMonth() + 1, defaultDate.getDate());
        this.facility = cloneFacility(DEFAULT_FACILITY);
    };
    changeFacility(name: string): void {
        this.facility = cloneFacility(name);
    }
    serialize(): SerializedReservationTarget {
        let e = <HTMLInputElement>UI.getElementById("inputDate" + this.calendar_idx);
        this.date = e.value;
        return {
            facility: this.facility.name,
            date: this.date,
            time: this.facility.slots.filter(s => s.v).map(s => s.t)
        };
    }
    static deserialize(serialized: SerializedReservationTarget): ReservationTarget {
        let ret = new ReservationTarget();
        ret.date = serialized.date;
        ret.changeFacility(serialized.facility);
        for (let s of ret.facility.slots) {
            s.v = (0 < serialized.time.indexOf(s.t));
        }
        return ret;
    }
}

export class Facility {
    name: string;
    slots: { t: string, v: boolean }[];
}

export class SerializedReservationTarget {
    date: string;
    facility: string;
    time: string[];
}

export const FACILITIES: Facility[] = [
    {
        name: "法典公園（グラスポ）",
        slots: [{ t: "830", v: false }, { t: "1030", v: false }, { t: "1230", v: true }, { t: "1430", v: true }, { t: "1630", v: false }]
    },
    {
        name: "運動公園",
        slots: [{ t: "700", v: false }, { t: "900", v: false }, { t: "1100", v: true }, { t: "1300", v: true }, { t: "1500", v: false }, { t: "1700", v: false }]
    }
];

const DEFAULT_FACILITY: string = "法典公園（グラスポ）";

function cloneFacility(name: string): Facility {
    for (let f of FACILITIES) {
        if (f.name === name) {
            return JSON.parse(JSON.stringify(f));
        }
    }
}

function toDateString(y: number, m: number, d: number): string {
    return `${y}/${m}/${d}`;
}

class UI {
    public static getElementById(id: string) {
        return document.getElementById(id);
    }
}
