import { Routes } from '@angular/router';
import { ProjectDashboardComponent } from './modules/project/components/project-dashboard/project-dashboard.component';
import { ProjectAddComponent } from './modules/project/components/project-add/project-add.component';
import { TeamTaskManagementComponent } from './modules/teamManagement/components/team-task-management/team-task-management.component';

export const routes: Routes = [
  { path: '', redirectTo: 'projects', pathMatch: 'full' },
  { path: 'projects', component: ProjectDashboardComponent },
  { path: 'projects/add', component: ProjectAddComponent },
  { path: 'team-management', component:TeamTaskManagementComponent },
  { path: '**', redirectTo: 'projects' },
];
