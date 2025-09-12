export interface FileItem {
  id: number;
  originalFilename: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  projectId?: number;
  projectName?: string;
  taskId?: number;
  uploadedBy: string;
}