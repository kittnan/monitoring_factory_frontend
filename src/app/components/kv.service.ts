import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KvService {

  public kv : BehaviorSubject<string> = new BehaviorSubject('kv1');
  kv$ = this.kv.asObservable();
  constructor() { }

  getKv(){
    return this.kv
  }
  setKv(newKv:string){
   this.kv.next(newKv)
  }
}
