export interface WorkPackage {
  id?: number;
  projectId?: number;
  departmentId?: number;
  name: string;
  description?: string;
  technicalManagerId?: number;
  status: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  departmentName?: string;
}