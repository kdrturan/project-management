import { Routes } from '@angular/router';
import { ProjectDashboardComponent } from './modules/project/components/project-dashboard/project-dashboard.component';
import { ProjectAddComponent } from './modules/project/components/project-add/project-add.component';
import { TeamTaskManagementComponent } from './modules/teamManagement/components/team-task-management/team-task-management.component';
import { UserTaskComponent } from './modules/task/components/user-tasks/user-tasks.component';
import { LoginComponent } from './core/components/login/login.component';

export const routes: Routes = [
  // Login route - HİÇ GUARD YOK
  { 
    path: 'login', 
    component: LoginComponent 
  },
  
  // Root redirect
  { 
    path: '', 
    redirectTo: '/login',  // Geçici olarak login'e yönlendir
    pathMatch: 'full' 
  },
  
  // Test routes - HİÇ GUARD YOK
  {
    path: 'projects',
    component: ProjectDashboardComponent
  },
  {
    path: 'projects/add',
    component: ProjectAddComponent
  },
  {
    path: 'user-tasks',
    component: UserTaskComponent
  },
  {
    path: 'team-management',
    component: TeamTaskManagementComponent
  },
  
  // 404 fallback
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];
