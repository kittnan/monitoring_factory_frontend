import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private URL: any
  constructor(
    private http: HttpClient
  ) {
    this.URL = environment.API
  }

  getCount(data:any): Observable<any> {
    return this.http.post(`${this.URL}/kvRecords/count`,data)
  }
  postKvRecords(data: any): Observable<any> {
    return this.http.post(`${this.URL}/kvRecords/query`, data)
  }
  putKvRecords(data: any): Observable<any> {
    return this.http.put(`${this.URL}/kvRecords/delete`, data)
  }

  postDataMachine(data: any): Observable<any> {
    return this.http.post(`${this.URL}/kv/post/get-data`, data)
  }

  postSettingDataMachine(data: any): Observable<any> {
    return this.http.post(`${this.URL}/kvSet/post/get-data`, data)
  }
  putSettingDataMachine(data: any): Observable<any> {
    return this.http.put(`${this.URL}/kvSet/put/update-data`, data)
  }
  deleteSettingDataMachine(data: any): Observable<any> {
    return this.http.put(`${this.URL}/kvSet/put/delete`, data)
  }

  postPassword(data: any): Observable<any> {
    return this.http.post(`${this.URL}/kvPassword/query/bypassword`, data)
  }




}
