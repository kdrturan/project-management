export interface DepartmentDto {
  id: number;
  name: string;
  description?: string | null; 
  status: string;
  managerId?: number | null;
  plannedStartDate?: string;
  plannedEndDate?: string;
}