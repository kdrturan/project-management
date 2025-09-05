export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  departmentId?: number;
  isActive: boolean;
  currentWorkload?: number;
}