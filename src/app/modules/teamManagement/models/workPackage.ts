import { DepartmentDto } from "../../departments/models/departmentsDto";
import { Project } from "../../project/models/project";
import { User } from "./user";

export interface WorkPackage {
  id: number;
  projectId: number;
  departmentId?: number;
  name: string;
  projectName: string;
  description?: string;
  technicalManagerId?: number;
  status: 'Backlog' | 'Planlandı' | 'Yürütme' | 'Test/Doğrulama' | 'Tamamlandı';
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  estimatedEffort?: number;
  actualEffort?: number;
  progressPercentage: number;
  createdAt: Date;
  updatedAt: Date;
  // Navigation properties
  project?: Project;
  department?: DepartmentDto;
  technicalManager?: User;
}