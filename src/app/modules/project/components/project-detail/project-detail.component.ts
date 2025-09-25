import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project-service.service';
import { FileService } from '../../../../core/services/file.service';
import { WorkPackage } from '../../../workPackage/models/workPackage';
import { createWorkPackageDto } from '../../../workPackage/models/createWorkPackageDto';
import { DepartmentService } from '../../../departments/services/department.service';
import { DepartmentDto } from '../../../departments/models/departmentsDto';
import { WorkpackageService } from '../../../workPackage/services/workpackage.service';
import { UpdateWorkPackageDto } from '../../../workPackage/models/updateWorkPackageDto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [ReactiveFormsModule , CommonModule, FormsModule],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css'],
})
export class ProjectDetailComponent implements OnInit {
  projectForm!: FormGroup;
  project: any = null;
  projectFiles: any[] = [];
  newFiles: any[] = [];
  projectWorkPackages: WorkPackage[] = [];
  newWorkPackages: createWorkPackageDto[] = [];
  isEditMode = false;
  isLoading = false;
  projectId!: number;
  departments: DepartmentDto[] = [];

  editingWorkPackages: { [key: number]: boolean } = {};
  editedWorkPackages: { [key: number]: any } = {};
  updatedWorkPackages: UpdateWorkPackageDto[] = [];

  // Expandable sections state
  isFilesSectionExpanded = false;
  isWorkPackagesSectionExpanded = false;

  priorities = [
    { value: 'Düşük', label: 'Düşük', color: '#4CAF50' },
    { value: 'Orta', label: 'Orta', color: '#ff9800' },
    { value: 'Yüksek', label: 'Yüksek', color: '#f44336' },
    { value: 'Kritik', label: 'Kritik', color: '#9c27b0' },
  ];

  statuses = [
    { value: 'Başlatılmadı', label: 'Başlatılmadı' },
    { value: 'Devam Ediyor', label: 'Devam Ediyor' },
    { value: 'Beklemede', label: 'Beklemede' },
    { value: 'Tamamlandı', label: 'Tamamlandı' },
    { value: 'İptal Edildi', label: 'İptal Edildi' },
  ];

  workPackageStatuses = [
    { value: 'Başlatılmadı', label: 'Başlatılmadı' },
    { value: 'Devam Ediyor', label: 'Devam Ediyor' },
    { value: 'Tamamlandı', label: 'Tamamlandı' },
    { value: 'Beklemede', label: 'Beklemede' },
  ];

  projectHistory: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private fileService: FileService,
    private departmnetService: DepartmentService,
    private workPackageService: WorkpackageService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.getProjectId();
    this.getProjectWorkPackes();
    this.getDepartments();
    this.loadProject();
  }

  getProjectWorkPackes() {
    this.workPackageService
      .getWorkPackagesByProjectId(this.projectId)
      .subscribe({
        next: (response) => {
          this.projectWorkPackages = response.data || [];
        },
        error: (error) => {
          console.error('İş paketleri yüklenirken hata oluştu:', error);
        },
      });
  }

  getDepartments() {
    this.departmnetService.getAllDepartments().subscribe({
      next: (response) => {
        this.departments = response.data || [];
      },
      error: (error) => {
        console.error('Departmanlar yüklenirken hata oluştu:', error);
      },
    });
  }

  initializeForm() {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      plannedStartDate: ['', Validators.required],
      plannedEndDate: ['', Validators.required],
      priority: ['Orta'],
      status: ['Başlatılmadı'],
      budget: [0],
    });
  }

  getProjectId() {
    this.route.params.subscribe((params) => {
      this.projectId = +params['id'];
    });
  }

  // Expandable sections toggle functions
  toggleFilesSection() {
    this.isFilesSectionExpanded = !this.isFilesSectionExpanded;
  }

  toggleWorkPackagesSection() {
    this.isWorkPackagesSectionExpanded = !this.isWorkPackagesSectionExpanded;
  }

  // Add files button click handler
  addFiles(event: Event) {
    event.stopPropagation();
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Add work package button click handler
  addWorkPackage(event: Event) {
    event.stopPropagation();

    const today = new Date().toISOString().split('T')[0];

    const newWorkPackage: createWorkPackageDto = {
      name: '',
      description: '',
      status: 'Başlatılmadı',
      plannedStartDate: today,
      plannedEndDate: today,
      departmentId: 0,
    };

    this.newWorkPackages.push(newWorkPackage);
  }

  removeNewWorkPackage(index: number) {
    this.newWorkPackages.splice(index, 1);
  }

  startEditingWorkPackage(workPackage: WorkPackage, index: number) {
    this.editingWorkPackages[index] = true;

    // Mevcut değerleri kopyala
    this.editedWorkPackages[index] = {
      id: workPackage.id,
      name: workPackage.name,
      description: workPackage.description,
      status: workPackage.status,
      plannedStartDate: this.formatDateForInput(
        workPackage.plannedStartDate || ''
      ),
      plannedEndDate: this.formatDateForInput(workPackage.plannedEndDate || ''),
      departmentId: this.getDepartmentIdByName(
        workPackage.departmentName || ''
      ),
    };
  }

  // İş paketi düzenlemeyi iptal et
  cancelEditingWorkPackage(index: number) {
    delete this.editingWorkPackages[index];
    delete this.editedWorkPackages[index];
  }

  // Düzenlenen iş paketini kaydet
  saveEditedWorkPackage(index: number) {
    const editedWp = this.editedWorkPackages[index];

    // Validasyon
    if (!editedWp.name || editedWp.name.trim() === '') {
      alert('İş paketi adı zorunludur.');
      return;
    }

    // updatedWorkPackages dizisine ekle
    const updatedWorkPackage = {
      id: editedWp.id,
      name: editedWp.name,
      description: editedWp.description || '',
      status: editedWp.status,
      plannedStartDate: editedWp.plannedStartDate,
      plannedEndDate: editedWp.plannedEndDate,
      departmentId: editedWp.departmentId,
    };

    // Daha önce bu iş paketi güncellenmiş mi kontrol et
    const existingIndex = this.updatedWorkPackages.findIndex(
      (wp) => wp.id === editedWp.id
    );
    if (existingIndex !== -1) {
      this.updatedWorkPackages[existingIndex] = updatedWorkPackage;
    } else {
      this.updatedWorkPackages.push(updatedWorkPackage);
    }

    // Düzenleme modundan çık
    delete this.editingWorkPackages[index];
    delete this.editedWorkPackages[index];

    alert('İş paketi değişiklikleri kaydedildi. Projeyi kaydetmeyi unutmayın!');
  }

  // İş paketini sil
  deleteWorkPackage(workPackage: WorkPackage, index: number) {
    if (
      confirm(
        `"${workPackage.name}" iş paketini silmek istediğinizden emin misiniz?`
      )
    ) {
      this.workPackageService.deleteWorkPackage(workPackage.id || 0).subscribe({
        next: (response) => {
          this.projectWorkPackages.splice(index, 1);
          alert('İş paketi silindi. Projeyi kaydetmeyi unutmayın!');
        },
        error: (error) => {
          console.log('İş silinirken bir hata oluştu.');
        },
      });
    }
  }

  // Departman adından ID'yi bul
  getDepartmentIdByName(departmentName: string): number {
    const department = this.departments.find((d) => d.name === departmentName);
    return department ? department.id : 0;
  }

  // Work package status class
  getWorkPackageStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      Başlatılmadı: 'wp-status-not-started',
      'Devam Ediyor': 'wp-status-in-progress',
      Tamamlandı: 'wp-status-completed',
      Beklemede: 'wp-status-on-hold',
    };
    return statusClasses[status] || '';
  }

  // Work package status label
  getWorkPackageStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      Başlatılmadı: 'Başlatılmadı',
      'Devam Ediyor': 'Devam Ediyor',
      Tamamlandı: 'Tamamlandı',
      Beklemede: 'Beklemede',
    };
    return statusLabels[status] || status;
  }

  routeHistory(historyId: number) {
    this.router.navigate([`/projects/${this.projectId}/history/${historyId}`]);
  }

  loadProject() {
    this.isLoading = true;
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (response) => {
        this.project = response.data;
        this.populateForm();
        this.loadProjectFiles();
        this.loadProjectHistory();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Proje yüklenirken hata oluştu:', error);
        this.isLoading = false;
      },
    });
  }

  populateForm() {
    if (this.project) {
      this.projectForm.patchValue({
        name: this.project.name,
        description: this.project.description,
        plannedStartDate: this.formatDateForInput(
          this.project.plannedStartDate
        ),
        plannedEndDate: this.formatDateForInput(this.project.plannedEndDate),
        priority: this.project.priority,
        status: this.project.status,
        budget: this.project.budget,
      });
    }
  }

  loadProjectFiles() {
    this.fileService.getProjectFiles(this.projectId).subscribe({
      next: (response) => {
        this.projectFiles = response.data || [];
      },
      error: (error) => {
        console.error('Dosyalar yüklenirken hata oluştu:', error);
      },
    });
  }

  loadProjectHistory() {
    this.projectService.getProjectHistory(this.projectId).subscribe({
      next: (response) => {
        this.projectHistory = response.data || [];
        this.projectHistory.sort((a, b) => b.VersionNumber - a.VersionNumber);
      },
      error: (error) => {
        console.error('Proje geçmişi yüklenirken hata oluştu:', error);
        this.projectHistory = [];
      },
    });
  }

  getChangeIcon(changeType: string): string {
    const icons: any = {
      Created: '🆕',
      Updated: '✏️',
      StatusChanged: '🔄',
      FileAdded: '📎',
      FileDeleted: '🗑️',
      PriorityChanged: '⚡',
      BudgetChanged: '💰',
      DateChanged: '📅',
      DescriptionChanged: '📝',
      NameChanged: '🏷️',
    };
    return icons[changeType] || '📋';
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.populateForm();
      this.newFiles = [];
      this.newWorkPackages = [];
      this.updatedWorkPackages = [];
      this.editingWorkPackages = {};
      this.editedWorkPackages = {};
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.populateForm();
    this.newFiles = [];
    this.newWorkPackages = [];
    this.updatedWorkPackages = [];
    this.editingWorkPackages = {};
    this.editedWorkPackages = {};
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    for (let file of files) {
      if (file.size <= 10 * 1024 * 1024) {
        this.newFiles.push({
          name: file.name,
          size: file.size,
          file: file,
        });
      }
    }
  }

  removeNewFile(index: number) {
    this.newFiles.splice(index, 1);
  }

  deleteFile(file: any, index: number) {
    if (
      confirm(
        `"${file.originalFilename}" dosyasını silmek istediğinizden emin misiniz?`
      )
    ) {
      this.fileService.deleteFile(file.id).subscribe({
        next: () => {
          this.projectFiles.splice(index, 1);
          alert('Dosya başarıyla silindi.');
        },
        error: (error) => {
          console.error('Dosya silinirken hata oluştu:', error);
          alert('Dosya silinirken bir hata oluştu.');
        },
      });
    }
  }

  downloadFile(file: any) {
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalFilename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Dosya indirilirken hata oluştu:', error);
        alert('Dosya indirilirken bir hata oluştu.');
      },
    });
  }

  onSave() {
    if (!this.projectForm.valid) {
      alert('Lütfen form alanlarını kontrol edin.');
      return;
    }
    // Yeni iş paketleri için validasyon
    for (let i = 0; i < this.newWorkPackages.length; i++) {
      const wp = this.newWorkPackages[i];
      if (!wp.name || wp.name.trim() === '') {
        alert(`${i + 1}. iş paketi için ad zorunludur.`);
        console.log('Invalid work package:', wp);
        return;
      }
    }
    this.isLoading = true;
    const formData = new FormData();

    if (this.newFiles.length > 0) {
      this.newFiles.forEach((fileObj) => {
        formData.append('Files', fileObj.file);
      });
    }

    this.setProjectForm(formData);
    this.addNewWorkPackages(formData);
    this.addUpdatedWorkPackages(formData);
    this.updateProjectForm(formData);
  }




private updateProjectForm(formData:FormData){
  this.projectService.updateProject(formData).subscribe({
      next: (response) => {
        let successMessage = 'Proje başarıyla güncellendi!';
        if (this.newWorkPackages.length > 0) {
          successMessage += ` ${this.newWorkPackages.length} yeni iş paketi eklendi.`;
        }
        if (this.updatedWorkPackages.length > 0) {
          successMessage += ` ${this.updatedWorkPackages.length} iş paketi güncellendi.`;
        }

        alert(successMessage);
        this.isEditMode = false;
        this.newFiles = [];
        this.newWorkPackages = [];
        this.updatedWorkPackages = [];
        this.editingWorkPackages = {};
        this.editedWorkPackages = {};
        this.loadProject();
        this.getProjectWorkPackes();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Proje güncellenirken hata oluştu:', error);
        alert('Proje güncellenirken bir hata oluştu.');
        this.isLoading = false;
      },
    });
}

private setProjectForm(formData:FormData){
  const formValue = this.projectForm.value;
  formData.append('Id', this.projectId.toString());
  formData.append('Name', formValue.name);
  formData.append('Description', formValue.description || '');
  formData.append('PlannedStartDate', formValue.plannedStartDate);
  formData.append('PlannedEndDate', formValue.plannedEndDate);
  formData.append('Priority', formValue.priority);
  formData.append('Status', formValue.status);

  if (formValue.budget) {
    formData.append('Budget', formValue.budget.toString());
  }

}


private addUpdatedWorkPackages(formData:FormData){
  this.updatedWorkPackages.forEach((wp, index) => {
      formData.append(
        `WorkPackages[${index}].Id`,
        wp.id != null ? wp.id.toString() : ''
      );
      formData.append(`WorkPackages[${index}].Name`, wp.name);
      formData.append(
        `WorkPackages[${index}].Description`,
        wp.description || ''
      );
      formData.append(`WorkPackages[${index}].Status`, wp.status);
      if (wp.plannedStartDate) {
        formData.append(
          `WorkPackages[${index}].PlannedStartDate`,
          wp.plannedStartDate
        );
      }
      if (wp.plannedEndDate) {
        formData.append(
          `WorkPackages[${index}].PlannedEndDate`,
          wp.plannedEndDate
        );
      }
      if (wp.departmentId) {
        formData.append(
          `WorkPackages[${index}].DepartmentId`,
          wp.departmentId.toString()
        );
      }
  });
}


  private addNewWorkPackages(formData:FormData){
    this.newWorkPackages.forEach((wp, index) => {
      formData.append(`WorkPackages[${index}].Name`, wp.name);
      formData.append(
        `WorkPackages[${index}].Description`,
        wp.description || ''
      );
      formData.append(`WorkPackages[${index}].Status`, wp.status);
      if (wp.plannedStartDate) {
        formData.append(
          `WorkPackages[${index}].PlannedStartDate`,
          wp.plannedStartDate
        );
      }
      if (wp.plannedEndDate) {
        formData.append(
          `WorkPackages[${index}].PlannedEndDate`,
          wp.plannedEndDate
        );
      }
      if (wp.departmentId) {
        formData.append(
          `WorkPackages[${index}].DepartmentId`,
          wp.departmentId.toString()
        );
      }
    });
  }

  goBack() {
    this.router.navigate(['/projects']);
  }

  // Utility Functions
  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const icons: any = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
    };
    return icons[ext || ''] || '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateStr: string | Date | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  }

  formatCurrency(amount: number): string {
    return amount ? `₺${amount.toLocaleString('tr-TR')}` : '₺0';
  }

  calculateDuration(): string {
    const start = this.projectForm.get('plannedStartDate')?.value;
    const end = this.projectForm.get('plannedEndDate')?.value;

    if (start && end) {
      const diffTime = new Date(end).getTime() - new Date(start).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 30) {
        return `${diffDays} Gün`;
      } else {
        const diffMonths = Math.ceil(diffDays / 30);
        return `${diffMonths} Ay`;
      }
    }
    return '-';
  }

  calculateRemainingTime(): string {
    const endDate = this.projectForm.get('plannedEndDate')?.value;
    if (!endDate) return '-';

    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} gün gecikme`;
    } else if (diffDays === 0) {
      return 'Bugün bitiyor';
    } else {
      return `${diffDays} gün kaldı`;
    }
  }

  getRemainingTimeClass(): string {
    const endDate = this.projectForm.get('plannedEndDate')?.value;
    if (!endDate) return '';

    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'danger';
    if (diffDays <= 7) return 'warning';
    return 'success';
  }

  getPriorityLabel(): string {
    const priority = this.priorities.find(
      (p) => p.value === this.projectForm.get('priority')?.value
    );
    return priority?.label || 'Orta';
  }

  getStatusLabel(): string {
    const status = this.statuses.find(
      (s) => s.value === this.projectForm.get('status')?.value
    );
    return status?.label || 'Başlatılmadı';
  }

  deleteProject() {
    if (
      confirm(
        `"${this.project?.name}" projesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`
      )
    ) {
      this.projectService.deleteProject(this.projectId).subscribe({
        next: () => {
          alert('Proje başarıyla silindi!');
          this.router.navigate(['/projects']);
        },
        error: (error) => {
          console.error('Proje silinirken hata:', error);
          alert('Proje silinirken bir hata oluştu.');
        },
      });
    }
  }

  copyProjectInfo() {
    const projectInfo = `
  Proje: ${this.project?.name}
  Açıklama: ${this.project?.description || 'Yok'}
  Durum: ${this.project?.status}
  Öncelik: ${this.getPriorityLabel()}
  Başlangıç: ${this.formatDate(this.project?.plannedStartDate)}
  Bitiş: ${this.formatDate(this.project?.plannedEndDate)}
  Bütçe: ${this.formatCurrency(this.project?.budget)}
      `.trim();

    navigator.clipboard.writeText(projectInfo).then(() => {
      alert('Proje bilgileri panoya kopyalandı!');
    });
  }
}
