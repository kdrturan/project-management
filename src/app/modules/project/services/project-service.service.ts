import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Project } from '../models/project';
import { Observable } from 'rxjs';
import { ResponseModel } from '../../../core/models/responseModel';
import { ProjectDto } from '../models/projectDto';
import { ListResponseModel } from '../../../core/models/listResponseModel';
import { DataResponseModel } from '../../../core/models/dataResponseModel';
import { environment } from '../../../../environments/devEnvironments';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(private httpClient:HttpClient) { }

  private apiUrl = `${environment.apiUrl}/projects`;

  
  getProjectHistoryByHistoryId(historyId: number): Observable<any> {
    return this.httpClient.get(`${this.apiUrl}/history?id=${historyId}`);
  }


  getProjectHistory(projectId: number): Observable<any> {
    return this.httpClient.get(`${this.apiUrl}/projecthistories?id=${projectId}`);
  }

  updateProjectStatus(id: number, status: string): Observable<any> {
    return this.httpClient.patch(`${this.apiUrl}/${id}/status`, { status });
  }


  updateProjectProgress(id: number, progress: number): Observable<any> {
    return this.httpClient.patch(`${this.apiUrl}/${id}/progress`, { progress });
  }

  deleteProject(id: number): Observable<any> {
    return this.httpClient.delete(`${this.apiUrl}?id=${id}`);
  }

  updateProjectInfo(projectData: any): Observable<any> {
    return this.httpClient.put(`${this.apiUrl}/${projectData.id}`, projectData);
  }

  addProjectWithFormData(formData: FormData): Observable<ResponseModel> {
    const newUrl = this.apiUrl ;
    return this.httpClient.post<ResponseModel>(newUrl, formData);
  }

  addProject(project: ProjectDto): Observable<ResponseModel> {
    const newUrl = this.apiUrl ;
    return this.httpClient.post<ResponseModel>(newUrl, project);
  }


  updateProject(formData: FormData): Observable<any> {
    return this.httpClient.put(`${this.apiUrl}`, formData);
  }

  getProjects():Observable<ListResponseModel<Project[]>>{
    const newUrl = this.apiUrl ;
    return this.httpClient.get<ListResponseModel<Project[]>>(newUrl);
  }

  getProjectById(id:number):Observable<DataResponseModel<Project>>{
    const newUrl = this.apiUrl + "/id?id=" + id;
    return this.httpClient.get<DataResponseModel<Project>>(newUrl);
  }

  getProjectsByOwner(managerId:number):Observable<ListResponseModel<Project[]>>{
    const newUrl = this.apiUrl + "/getbymanagerid?id=" + managerId;
    return this.httpClient.get<ListResponseModel<Project[]>>(newUrl);
  }
}
