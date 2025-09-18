import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DepartmentDto } from '../models/departmentsDto';
import { ListResponseModel } from '../../../core/models/listResponseModel';
import { environment } from '../../../../environments/devEnvironments';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  constructor(private httpClient: HttpClient) {}

  private apiUrl = `${environment.apiUrl}/departments`;
  getAllDepartments(): Observable<ListResponseModel<DepartmentDto>> {
    return this.httpClient.get<ListResponseModel<DepartmentDto>>(this.apiUrl);
  }
}
