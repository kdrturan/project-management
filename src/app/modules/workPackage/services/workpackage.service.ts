import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataResponseModel } from '../../../core/models/dataResponseModel';

@Injectable({
  providedIn: 'root'
})
export class WorkpackageService {

  constructor(private httpClient:HttpClient) { }

    apiUrl=  "http://localhost:7041/api"
  
  
    getWorkPackagesByProjectId (projectId: number): Observable<DataResponseModel<any[]>> {
      const newUrl = this.apiUrl + `/workPackages`//?projectId=${projectId}`;
      return this.httpClient.get<DataResponseModel<any[]>>(newUrl);
    }
}
