import { Routes } from '@angular/router';
import { ProjectDashboardComponent } from './modules/project/components/project-dashboard/project-dashboard.component';
import { ProjectAddComponent } from './modules/project/components/project-add/project-add.component';
import { TeamTaskManagementComponent } from './modules/teamManagement/components/team-task-management/team-task-management.component';
import { UserTaskComponent } from './modules/task/components/user-tasks/user-tasks.component';
import { LoginComponent } from './core/components/login/login.component';
import { FilesComponent } from './core/components/files/files.component';
import { ProjectDetailComponent } from './modules/project/components/project-detail/project-detail.component';
import { ProjectHistoryComponent } from './modules/project/components/project-history/project-history.component';
import { TaskCreateComponent } from './modules/teamManagement/components/task-create/task-create.component';
import { LoginGuard } from './core/guards/login-guard.service';
import { AuthGuard } from './core/guards/auth-guard.service';
import { RoleGuard } from './core/guards/RoleGuard.service';

// Mevcut guard'larını import et

export const routes: Routes = [
  // Login route - LoginGuard ile korun
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [LoginGuard] // Zaten giriş yapanları yönlendir
  },
  
  // Root redirect
  { 
    path: '', 
    redirectTo: '/projects',
    pathMatch: 'full' 
  },
  
  // Developer için user-tasks (sadece Developer erişebilir)
  {
    path: 'user-tasks',
    component: UserTaskComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Developer', 'Admin'] }
  },
  
  // TechnicalManager için team-management
  {
    path: 'team-management',
    component: TeamTaskManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['TechnicalManager', 'Admin'] }
  },
  
  // Task create - TechnicalManager ve Admin
  {
    path: 'tasks/create',
    component: TaskCreateComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['TechnicalManager', 'Admin'] }
  },
  
  // Projects - Herkes erişebilir (sadece login kontrolü)
  {
    path: 'projects',
    component: ProjectDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ProjectManager', 'Admin'] }
  },
  
  // Project add - Sadece TechnicalManager ve Admin
  {
    path: 'projects/add',
    component: ProjectAddComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ProjectManager', 'Admin'] }
  },
  
  // Project detail - Herkes erişebilir
  {
    path: 'projects/detail/:id',
    component: ProjectDetailComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ProjectManager', 'Admin'] }
  },
  
  // Project history - Herkes erişebilir
  {
    path: 'projects/:id/history/:historyId',
    component: ProjectHistoryComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ProjectManager', 'Admin'] }
  },
  
  // File management - Herkes erişebilir
  {
    path: 'file-management/task/:taskId',
    component: FilesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'file-management',
    component: FilesComponent,
    canActivate: [AuthGuard]
  },
  // 404 fallback
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];