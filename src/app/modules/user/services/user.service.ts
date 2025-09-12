import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ListResponseModel } from '../../../core/models/listResponseModel';
import { User } from '../../teamManagement/models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private httpClient:HttpClient) { }

  apiUrl = 'http://localhost:7041/api/Users';

  getUsers():Observable<ListResponseModel<User>>{
    return this.httpClient.get<ListResponseModel<User>>(this.apiUrl);
  }


  getUsersByDepartment(id:number):Observable<ListResponseModel<User>>{
    const newUrl = this.apiUrl + "/GetByDepartment?id=" + id;
    return this.httpClient.get<ListResponseModel<User>>(newUrl);
  }  
}
