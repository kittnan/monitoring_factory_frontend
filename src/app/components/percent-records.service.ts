import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PercentRecordsService {
  private percent: BehaviorSubject<number> = new BehaviorSubject(0)
  percent$ = this.percent.asObservable();
  constructor() { }

  getPercent() {
    return this.percent
  }
  setPercent(newPercent: number) {
    this.percent.next(newPercent)
  }
}
