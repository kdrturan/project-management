import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataResponseModel } from '../../../core/models/dataResponseModel';
import { ResponseModel } from '../../../core/models/responseModel';
import { WorkPackage } from '../models/workPackage';
import { ListResponseModel } from '../../../core/models/listResponseModel';
import { environment } from '../../../../environments/devEnvironments';

@Injectable({
  providedIn: 'root'
})
export class WorkpackageService {

  constructor(private httpClient:HttpClient) { }

    apiUrl = `${environment.apiUrl}/WorkPackages`;
  

    addWorkPackage(workPackage: WorkPackage): Observable<ResponseModel> {
      const url = `${this.apiUrl}`;
      return this.httpClient.post<ResponseModel>(url, workPackage);
    }

    getWorkPackagesByProjectAndDepartmentId(projectId: number, departmentId:number): Observable<ListResponseModel<WorkPackage[]>> {
      const url = `${this.apiUrl}/project/${projectId}?departmentId=${departmentId}`;
      return this.httpClient.get<ListResponseModel<WorkPackage[]>>(url);
    }

    updateWorkPackage(id: number, workPackage: WorkPackage): Observable<ResponseModel> {
      const url = `${this.apiUrl}/${id}`;
      return this.httpClient.put<ResponseModel>(url, workPackage);
    }

    deleteWorkPackage(id: number): Observable<ResponseModel> {
      const url = `${this.apiUrl}?id=${id}`;
      return this.httpClient.delete<ResponseModel>(url);
    }
  

    ////Eski EKLENEN KODLAR////
    getWorkPackagesByProjectId (projectId: number): Observable<DataResponseModel<any[]>> {
      const newUrl = this.apiUrl + `/projectid?id=${projectId}`;
      return this.httpClient.get<DataResponseModel<any[]>>(newUrl);
    }
}
