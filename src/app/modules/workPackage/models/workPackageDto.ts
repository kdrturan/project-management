export interface WorkPackageDto {
  name: string;
  description?: string;
  departmentId?: number;
  technicalManagerId?: number;
  status: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
}