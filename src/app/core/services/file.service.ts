import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseModel } from '../models/responseModel';
import { FileItem } from '../models/fileItem';
import { ListResponseModel } from '../models/listResponseModel';
import { environment } from '../../../environments/devEnvironments';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(private httpClient:HttpClient) { }
  private apiUrl = `${environment.apiUrl}/Attachments`;



  getFilesByTaskId(taskId:number):Observable<ListResponseModel<FileItem>>{
    const newUrl = this.apiUrl + `/task?id=${taskId}`;
    return this.httpClient.get<ListResponseModel<FileItem>>(newUrl);
  }



  getProjectFiles(projectId:number):Observable<ListResponseModel<FileItem>>{
    const newUrl = this.apiUrl + `/project/${projectId}`;
    return this.httpClient.get<ListResponseModel<FileItem>>(newUrl);
  }

  uploadFiles(formData: FormData):Observable<ResponseModel>{
    const newUrl = this.apiUrl + "/upload";
    return this.httpClient.post<ResponseModel>(newUrl, formData);
  }

  downloadFile(fileId:number): Observable<Blob> {
    const newUrl = this.apiUrl + `/download/${fileId}`;
    return this.httpClient.get(newUrl, { responseType: 'blob' });
  }


  deleteFile(fileId:number): Observable<ResponseModel> {
    const newUrl = this.apiUrl + "?id=" + `${fileId}`;
    return this.httpClient.delete<ResponseModel>(newUrl);
  }

  getFiles():Observable<ListResponseModel<FileItem>>{
    let newUrl = this.apiUrl + "/user-files";
    return this.httpClient.get<ListResponseModel<FileItem>>(newUrl);
  }
}
