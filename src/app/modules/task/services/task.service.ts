import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ListResponseModel } from '../../../core/models/listResponseModel';
import { UserTask } from '../../teamManagement/models/userTask';
import { ResponseModel } from '../../../core/models/responseModel';
import { AssignTaskDto } from '../models/assignTaskDto';
import { UpdateTaskStatusDto} from '../models/updateStautsTaskDto';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private httpClient:HttpClient) { }

  apiUrl = 'https://localhost:7041/api/Tasks';

  getUnassignedTasks():Observable<ListResponseModel<UserTask>>{
    const newUrl = this.apiUrl + "/GetUnassignedTasks";
    return this.httpClient.get<ListResponseModel<UserTask>>(newUrl);
  }


  getAssignedTasks():Observable<ListResponseModel<UserTask>>{
    const newUrl = this.apiUrl + "/GetAssignedTasks";
    return this.httpClient.get<ListResponseModel<UserTask>>(newUrl);
  }


  getAssignedTasksByDepartmentId(id:number):Observable<ListResponseModel<UserTask>>{
    const newUrl = this.apiUrl + "/GetAssignedTasksByDepartment?id=" + id;
    return this.httpClient.get<ListResponseModel<UserTask>>(newUrl);
  }


  getUnassignedTasksByDepartmentId(id:number):Observable<ListResponseModel<UserTask>>{
    const newUrl = this.apiUrl + "/GetUnassignedTasksByDepartment?id=" + id;
    return this.httpClient.get<ListResponseModel<UserTask>>(newUrl);
  }


  updateTaskStatus(updateTaskStatus:UpdateTaskStatusDto): Observable<ResponseModel> {
    const newUrl = this.apiUrl + "/UpdateTaskStatus"
    return this.httpClient.put<ResponseModel>(newUrl, updateTaskStatus);
  }



  assignTaskToUser(assignTaskDto:AssignTaskDto): Observable<ResponseModel> {
    const newUrl = this.apiUrl + "/AssignTask"
        console.log("TaskId:",assignTaskDto.taskId);

    return this.httpClient.put<ResponseModel>(newUrl, assignTaskDto);
  }
}
