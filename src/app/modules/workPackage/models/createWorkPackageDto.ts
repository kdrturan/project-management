export interface createWorkPackageDto {
  departmentId?: number;
  name: string;
  description?: string;
  technicalManagerId?: number;
  status: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  departmentName?: string;
}