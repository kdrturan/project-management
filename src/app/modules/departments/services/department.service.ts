import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DepartmentDto } from '../models/departmentsDto';
import { ListResponseModel } from '../../../core/models/listResponseModel';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  constructor(private httpClient:HttpClient) { }

  getAllDepartments():Observable<ListResponseModel<DepartmentDto>>{
    return this.httpClient.get<ListResponseModel<DepartmentDto>>("http://localhost:7041/api/departments");
  }
}
