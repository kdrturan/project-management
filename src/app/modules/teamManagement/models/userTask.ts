import { Project } from "../../project/models/project";
import { User } from "./user";
import { WorkPackage } from "./workPackage";

export interface UserTask {
  id: number;
  workPackageId: number;
  projectId: number;
  title: string;
  description?: string;
  assignedUserId?: number;
  assignedUserName?: string; // Backend'den gelen alan
  status: string;
  priority: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  estimatedEffort?: number;
  actualEffort?: number;
  createdAt: Date;
  updatedAt: Date;
  isOverdue: boolean;
  daysOverdue?: number;
  projectName: string; // Backend'den gelen alan
  workPackageName: string; // Backend'den gelen alan
  
  // Frontend için eklenen alanlar (optional)
  assignedUser?: User;
  workPackage?: any;
  project?: any;
}