import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Project } from '../models/project';
import { Observable } from 'rxjs';
import { ResponseModel } from '../../../core/models/responseModel';
import { ProjectDto } from '../models/projectDto';
import { ListResponseModel } from '../../../core/models/listResponseModel';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(private httpClient:HttpClient) { }
  apiUrl=  "https://localhost:7041"



addProject(project: ProjectDto): Observable<ResponseModel> {
  const newUrl = this.apiUrl + "/api/Projects";
  return this.httpClient.post<ResponseModel>(newUrl, project);
}

  getProjects():Observable<ListResponseModel<Project[]>>{
    const newUrl = this.apiUrl + "/api/Projects";
    return this.httpClient.get<ListResponseModel<Project[]>>(newUrl);
  }
}
