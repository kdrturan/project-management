import { User } from "./user";

export interface Department {
  id: number;
  name: string;
  description?: string;
  managerId?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Navigation properties
  manager?: User;
  users?: User[];
}