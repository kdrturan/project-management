// files.component.ts
import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../../modules/project/services/project-service.service';
import { FileService } from '../../services/file.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileItem } from '../../models/fileItem';
import { Project } from '../../../modules/project/models/project';


@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css']
})

export class FilesComponent implements OnInit {
  // Data Properties
  files: FileItem[] = [];
  filteredFiles: FileItem[] = [];
  paginatedFiles: FileItem[] = [];
  projects: Project[] = [];
  selectedFiles: number[] = [];
  downloadingFiles: number[] = [];
  isLoading = true;
  error: string | null = null;
  // Search and Filter
  searchTerm: string = '';
  selectedFileType: string = '';
  selectedProject: string = '';

  // View Settings
  viewMode: 'grid' | 'list' = 'grid';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 12;
  totalPages: number = 1;

  // Sorting
  sortField: string = 'uploadDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Stats
  totalFiles: number = 0;
  totalSize: number = 0;
  recentFilesCount: number = 0;
  sharedFilesCount: number = 0;

  // Upload Modal
  showUploadModal: boolean = false;
  selectedUploadFiles: File[] = [];
  selectedUploadProject: string = '';
  isUploading: boolean = false;
  uploadProgress: number = 0;
  isDragOver: boolean = false;

  // Delete Modal
  showDeleteModal: boolean = false;
  fileToDelete: FileItem | null = null;
  isDeleting: boolean = false;

  constructor(
    private fileService: FileService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.loadFiles();
    this.loadProjects();
  }

  // Data Loading Methods
loadFiles() {
  this.isLoading = true;
  this.fileService.getFiles().subscribe({
    next: (response) => {
      this.files = response.data;
      this.isLoading = false;
      this.calculateStats();
      this.applyFilters();
    },
    error: (error) => {
      console.error('Dosyalar yüklenirken hata:', error);
      this.error = 'Dosyalar yüklenirken bir hata oluştu. Mock veriler kullanılıyor.';
      this.isLoading = false;
      this.calculateStats();
      this.applyFilters();
    }
  });
}

loadProjects() {
    this.isLoading = true;
    this.error = null;

    console.log('Backend\'den projeler yükleniyor...');
    
    this.projectService.getProjects().subscribe({
      next: (response) => {
        console.log('Backend API Response:', response);
        
        let backendProjects: Project[] = [];
        
        // Backend response formatını kontrol et
        if (response && Array.isArray(response)) {
          // Eğer response direkt array ise
          backendProjects = this.processBackendProjects(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          // Eğer response.data array ise
          backendProjects = this.processBackendProjects(response.data);
        } else {
          console.warn('Beklenmeyen API response formatı:', response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Backend\'den projeler yüklenirken hata:', error);
        this.error = 'Projeler yüklenirken bir hata oluştu. Mock veriler kullanılıyor.';
        this.calculateStats();
        
        this.isLoading = false;
      }
    });
  }
  private processBackendProjects(backendData: any[]): Project[] {
    return backendData.map(project => ({
      ...project,
      plannedStartDate: project.plannedStartDate ? new Date(project.plannedStartDate) : undefined,
      plannedEndDate: project.plannedEndDate ? new Date(project.plannedEndDate) : undefined,
      actualStartDate: project.actualStartDate ? new Date(project.actualStartDate) : undefined,
      actualEndDate: project.actualEndDate ? new Date(project.actualEndDate) : undefined
    }));
  }
  calculateStats(): void {
    this.totalFiles = this.files.length;
    this.totalSize = this.files.reduce((sum, file) => sum + file.size, 0);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    this.recentFilesCount = this.files.filter(
      file => new Date(file.uploadDate) > oneWeekAgo
    ).length;
    
    this.sharedFilesCount = this.files.filter(
      file => file.projectId
    ).length;
  }

  // Search and Filter Methods
  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onProjectFilter(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.files];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(file => 
        file.originalFilename.toLowerCase().includes(term)
      );
    }

    // File type filter
    if (this.selectedFileType) {
      filtered = filtered.filter(file => {
        const fileType = this.getFileType(file.originalFilename).toLowerCase();
        return fileType === this.selectedFileType;
      });
    }

    // Project filter
    if (this.selectedProject) {
      filtered = filtered.filter(file => 
        file.projectId?.toString() === this.selectedProject
      );
    }

    // Apply sorting
    filtered = this.sortFiles(filtered);

    this.filteredFiles = filtered;
    this.calculatePagination();
    this.updatePaginatedFiles();
  }

  // Sorting Methods
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  sortFiles(files: FileItem[]): FileItem[] {
    return files.sort((a, b) => {
      let aValue: any = a[this.sortField as keyof FileItem];
      let bValue: any = b[this.sortField as keyof FileItem];

      if (this.sortField === 'uploadDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // Pagination Methods
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredFiles.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  updatePaginatedFiles(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedFiles = this.filteredFiles.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedFiles();
    }
  }

  // View Methods
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  // Selection Methods
  selectFile(file: FileItem): void {
    const index = this.selectedFiles.indexOf(file.id);
    if (index > -1) {
      this.selectedFiles.splice(index, 1);
    } else {
      this.selectedFiles.push(file.id);
    }
  }

  toggleFileSelection(fileId: number): void {
    const index = this.selectedFiles.indexOf(fileId);
    if (index > -1) {
      this.selectedFiles.splice(index, 1);
    } else {
      this.selectedFiles.push(fileId);
    }
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedFiles = [];
    } else {
      this.selectedFiles = this.paginatedFiles.map(file => file.id);
    }
  }

  isAllSelected(): boolean {
    return this.paginatedFiles.length > 0 && 
           this.paginatedFiles.every(file => this.selectedFiles.includes(file.id));
  }

  // File Operations
    downloadFile(id: number, filename: string) {
    this.fileService.downloadFile(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;  // İstemcide görünecek dosya adı
        a.click();
        window.URL.revokeObjectURL(url); // Bellek temizliği
      },
      error: (err) => console.error('Dosya indirilemedi', err)
    });
  }

  previewFile(file: FileItem): void {
    // Önizleme modalı açılabilir veya yeni sekmede açılabilir
    console.log('Previewing file:', file);
    // this.router.navigate(['/files/preview', file.id]);
  }

  confirmDelete(file: FileItem): void {
    this.fileToDelete = file;
    this.showDeleteModal = true;
  }

  async deleteFile(): Promise<void> {
    if (!this.fileToDelete || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    
    this.fileService.deleteFile(this.fileToDelete.id).subscribe({
      next: (response) => {
        console.log('Dosya silindi:', response);  
      this.files = this.files.filter(f => f.id !== this.fileToDelete!.id);
      this.calculateStats();
      this.applyFilters();
      this.closeDeleteModal();
      this.isDeleting = false;
      alert('Dosya başarıyla silindi!');
      },
      error: (error) => {
        console.error('Dosya silinirken hata:', error);
        this.isDeleting = false;
        alert('Dosya silinirken bir hata oluştu!');
      }
    });
    
  }

  // Upload Modal Methods
  openUploadModal(): void {
    this.showUploadModal = true;
    this.clearSelectedFiles();
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.clearSelectedFiles();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFilesToSelection(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    if (event.dataTransfer?.files) {
      this.addFilesToSelection(Array.from(event.dataTransfer.files));
    }
  }

  addFilesToSelection(newFiles: File[]): void {
    const validFiles = newFiles.filter(file => this.validateFile(file));
    this.selectedUploadFiles = [...this.selectedUploadFiles, ...validFiles];
  }

  validateFile(file: File): boolean {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (file.size > maxSize) {
      alert(`${file.name} dosyası çok büyük (Max: 50MB)`);
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      alert(`${file.name} dosya türü desteklenmiyor`);
      return false;
    }

    return true;
  }

  removeSelectedFile(index: number): void {
    this.selectedUploadFiles.splice(index, 1);
  }

  clearSelectedFiles(): void {
    this.selectedUploadFiles = [];
    this.selectedUploadProject = '';
    this.uploadProgress = 0;
  }

  async uploadFiles(): Promise<void> {
    if (this.selectedUploadFiles.length === 0 || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    try {
      const formData = new FormData();
      
      this.selectedUploadFiles.forEach(file => {
        formData.append('files', file);
      });

      if (this.selectedUploadProject) {
        formData.append('projectId', this.selectedUploadProject);
      }

      // await this.fileService.uploadFiles(formData, (progress) => {
      //   this.uploadProgress = progress;
      // });

      await this.loadFiles(); // Refresh file list
      this.closeUploadModal();
      alert('Dosyalar başarıyla yüklendi!');
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Dosya yükleme sırasında hata oluştu!');
    } finally {
      this.isUploading = false;
    }
  }

  // Delete Modal Methods
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.fileToDelete = null;
  }

  // Utility Methods

  filesSize(): number {
    let totelSize:number=0;
    this.files.forEach(file => {
      totelSize += file.fileSizeBytes;
    });
    return totelSize;
  }

  formatBytes(bytes: number): string {

    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif': return '🖼️';
      case 'zip':
      case 'rar': return '📦';
      case 'txt': return '📃';
      case 'mp4':
      case 'avi':
      case 'mkv': return '🎥';
      case 'mp3':
      case 'wav': return '🎵';
      default: return '📄';
    }
  }

  getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return 'PDF';
      case 'doc':
      case 'docx': return 'Word';
      case 'xls':
      case 'xlsx': return 'Excel';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif': return 'Resim';
      case 'zip':
      case 'rar': return 'Arşiv';
      case 'txt': return 'Metin';
      case 'mp4':
      case 'avi':
      case 'mkv': return 'Video';
      case 'mp3':
      case 'wav': return 'Ses';
      default: return 'Dosya';
    }
  }

  getFileTypeClass(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return 'file-pdf';
      case 'doc':
      case 'docx': return 'file-doc';
      case 'xls':
      case 'xlsx': return 'file-excel';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif': return 'file-image';
      case 'zip':
      case 'rar': return 'file-zip';
      default: return 'file-default';
    }
  }

  canPreview(mimeType: string): boolean {
    const previewableTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/gif',
      'text/plain'
    ];
    return previewableTypes.includes(mimeType);
  }

  canDelete(file: FileItem): boolean {
    // Burada kullanıcının dosyayı silme yetkisi kontrol edilebilir
    // Örneğin sadece dosyayı yükleyen kişi silebilir
    return true; // Şimdilik herkese silme yetkisi
  }

  trackByFileId(index: number, file: FileItem): number {
    return file.id;
  }
}