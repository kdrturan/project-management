export interface UpdateWorkPackageDto {
  id?: number;
  projectId?: number;
  isDeleted?: boolean;
  departmentId?: number;
  name: string;
  description?: string;
  technicalManagerId?: number;
  status: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  departmentName?: string;
}