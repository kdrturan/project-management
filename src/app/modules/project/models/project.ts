export interface Project {
  id: number;
  name: string;
  description?: string;
  scope?: string;
  projectManagerId?: number;
  primaryDepartmentId?: number;
  status?: string; 
  priority?: string; 
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  progressPercentage?: number;
}