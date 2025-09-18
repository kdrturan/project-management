import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project-service.service';
import { FileService } from '../../../../core/services/file.service';

@Component({
  selector: 'app-project-history',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './project-history.component.html',
  styleUrl: './project-history.component.css'
})
export class ProjectHistoryComponent {
projectForm!: FormGroup;
  project: any = null;
  projectFiles: any[] = [];
  newFiles: any[] = [];
  isEditMode = false;
  isLoading = false;
  projectId!: number;
  fileProjectId!: number;

  priorities = [
    { value: 'Düşük', label: 'Düşük', color: '#4CAF50' },
    { value: 'Orta', label: 'Orta', color: '#ff9800' },
    { value: 'Yüksek', label: 'Yüksek', color: '#f44336' },
    { value: 'Kritik', label: 'Kritik', color: '#9c27b0' }
  ];

  statuses = [
    { value: 'Başlatılmadı', label: 'Başlatılmadı' },
    { value: 'Devam Ediyor', label: 'Devam Ediyor' },
    { value: 'Beklemede', label: 'Beklemede' },
    { value: 'Tamamlandı', label: 'Tamamlandı' },
    { value: 'İptal Edildi', label: 'İptal Edildi' }
  ];

  projectHistory: any[] = [];

  recentActivities: any[] = [
    { icon: '📝', description: 'Proje oluşturuldu', date: new Date() },
    { icon: '📎', description: 'Dosya eklendi', date: new Date() },
    { icon: '✏️', description: 'Proje güncellendi', date: new Date() }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private fileService: FileService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.getProjectId();
    this.loadProject();
  }

  initializeForm() {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      plannedStartDate: ['', Validators.required],
      plannedEndDate: ['', Validators.required],
      priority: ['medium'],
      status: ['Başlatılmadı'],
      budget: [0]
    });
  }

  getProjectId() {
    this.route.params.subscribe(params => {
      this.fileProjectId =  +params['id'];
      this.projectId = +params['historyId']; // URL'den historyId parametresini al
    });
  }


  loadProject() {
    this.isLoading = true;
    this.projectService.getProjectHistoryByHistoryId(this.projectId).subscribe({
      next: (response) => {
        this.project = response.data;
        this.populateForm();
        this.loadProjectFiles();
        this.loadProjectHistory(); // Proje geçmişini yükle
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Proje yüklenirken hata oluştu:', error);
        this.isLoading = false;
      }
    });
  }

  populateForm() {
    if (this.project) {
      this.projectForm.patchValue({
        name: this.project.name,
        description: this.project.description,
        plannedStartDate: this.formatDateForInput(this.project.plannedStartDate),
        plannedEndDate: this.formatDateForInput(this.project.plannedEndDate),
        priority: this.project.priority,
        status: this.project.status,
        budget: this.project.budget
      });
    }
  }

  loadProjectFiles() {
    this.fileService.getProjectFiles(this.fileProjectId).subscribe({
      next: (response) => {
        this.projectFiles = response.data || [];
      },
      error: (error) => {
        console.error('Dosyalar yüklenirken hata oluştu:', error);
      }
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
      }
    });
  }

  getChangeIcon(changeType: string): string {
    const icons: any = {
      'Created': '🆕',
      'Updated': '✏️',
      'StatusChanged': '🔄',
      'FileAdded': '📎',
      'FileDeleted': '🗑️',
      'PriorityChanged': '⚡',
      'BudgetChanged': '💰',
      'DateChanged': '📅',
      'DescriptionChanged': '📝',
      'NameChanged': '🏷️'
    };
    return icons[changeType] || '📋';
  }

  getChangeDescription(historyItem: any): string {
    const changeType = historyItem.changeType;
    const oldValue = historyItem.oldValue;
    const newValue = historyItem.newValue;
    const userName = historyItem.changedByUserName || 'Kullanıcı';

    switch (changeType) {
      case 'Created':
        return `${userName} tarafından proje oluşturuldu`;
      case 'Updated':
        return `${userName} tarafından proje güncellendi`;
      case 'StatusChanged':
        return `${userName} durumu "${oldValue}" den "${newValue}" ye değiştirdi`;
      case 'PriorityChanged':
        return `${userName} önceliği "${oldValue}" den "${newValue}" ye değiştirdi`;
      case 'BudgetChanged':
        return `${userName} bütçeyi ${this.formatCurrency(parseFloat(oldValue))} den ${this.formatCurrency(parseFloat(newValue))} ye değiştirdi`;
      case 'NameChanged':
        return `${userName} proje adını "${oldValue}" den "${newValue}" ye değiştirdi`;
      case 'DescriptionChanged':
        return `${userName} proje açıklamasını güncelledi`;
      case 'DateChanged':
        return `${userName} proje tarihlerini güncelledi`;
      case 'FileAdded':
        return `${userName} "${newValue}" dosyasını ekledi`;
      case 'FileDeleted':
        return `${userName} "${oldValue}" dosyasını sildi`;
      default:
        return `${userName} tarafından ${historyItem.fieldName} alanı güncellendi`;
    }
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.populateForm(); // İptal edildiğinde formu eski haline getir
      this.newFiles = []; // Yeni dosyaları temizle
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.populateForm();
    this.newFiles = [];
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    for (let file of files) {
      if (file.size <= 10 * 1024 * 1024) { // 10MB
        this.newFiles.push({
          name: file.name,
          size: file.size,
          file: file
        });
      }
    }
  }

  removeNewFile(index: number) {
    this.newFiles.splice(index, 1);
  }

  deleteFile(file: any, index: number) {
    if (confirm(`"${file.originalFilename}" dosyasını silmek istediğinizden emin misiniz?`)) {
      this.fileService.deleteFile(file.id).subscribe({
        next: () => {
          this.projectFiles.splice(index, 1);
          alert('Dosya başarıyla silindi.');
        },
        error: (error) => {
          console.error('Dosya silinirken hata oluştu:', error);
          alert('Dosya silinirken bir hata oluştu.');
        }
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
      }
    });
  }

  onSave() {
    if (!this.projectForm.valid) {
      alert('Lütfen form alanlarını kontrol edin.');
      return;
    }

    this.isLoading = true;
    const formValue = this.projectForm.value;

    // Eğer sadece proje bilgileri değiştiyse ve yeni dosya yoksa JSON gönder
    if (this.newFiles.length === 0) {
      const projectData = {
        id: this.projectId,
        name: formValue.name,
        description: formValue.description || '',
        plannedStartDate: formValue.plannedStartDate,
        plannedEndDate: formValue.plannedEndDate,
        priority: formValue.priority,
        status: formValue.status,
        budget: formValue.budget || 0
      };

      this.projectService.updateProjectInfo(projectData).subscribe({
        next: (response) => {
          alert('Proje bilgileri başarıyla güncellendi!');
          this.isEditMode = false;
          this.loadProject();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Proje güncellenirken hata oluştu:', error);
          alert('Proje güncellenirken bir hata oluştu.');
          this.isLoading = false;
        }
      });
    } else {
      // Yeni dosya varsa FormData ile gönder
      const formData = new FormData();
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

      // Yeni dosyaları ekle
      this.newFiles.forEach((fileObj) => {
        formData.append('Files', fileObj.file);
      });

      this.projectService.updateProject(formData).subscribe({
        next: (response) => {
          alert('Proje başarıyla güncellendi!');
          this.isEditMode = false;
          this.newFiles = [];
          this.loadProject();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Proje güncellenirken hata oluştu:', error);
          alert('Proje güncellenirken bir hata oluştu.');
          this.isLoading = false;
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/projects']);
  }

  // Utility Functions
  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const icons: any = {
      'pdf': '📄', 'doc': '📝', 'docx': '📝',
      'xls': '📊', 'xlsx': '📊',
      'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️'
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

  formatDate(dateStr: string | Date): string {
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

  getProgressPercentage(): number {
    const status = this.projectForm.get('status')?.value;
    const statusProgress: any = {
      'Başlatılmadı': 0,
      'Devam Ediyor': 50,
      'Beklemede': 30,
      'Tamamlandı': 100,
      'İptal Edildi': 0
    };
    return statusProgress[status] || 0;
  }

  getPriorityLabel(): string {
    const priority = this.priorities.find(p => p.value === this.projectForm.get('priority')?.value);
    return priority?.label || 'Orta';
  }

  getStatusLabel(): string {
    const status = this.statuses.find(s => s.value === this.projectForm.get('status')?.value);
    return status?.label || 'Başlatılmadı';
  }

  // Quick Status Update
  updateStatus(newStatus: string) {
    this.projectService.updateProjectStatus(this.projectId, newStatus).subscribe({
      next: () => {
        this.project.status = newStatus;
        this.projectForm.patchValue({ status: newStatus });
        alert('Proje durumu güncellendi!');
      },
      error: (error) => {
        console.error('Durum güncellenirken hata:', error);
      }
    });
  }

  // Quick Progress Update
  updateProgress(newProgress: number) {
    this.projectService.updateProjectProgress(this.projectId, newProgress).subscribe({
      next: () => {
        this.project.progressPercentage = newProgress;
        alert('Proje ilerlemesi güncellendi!');
      },
      error: (error) => {
        console.error('İlerleme güncellenirken hata:', error);
      }
    });
  }

  // File size validation
  validateFileSize(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  }

  // File type validation
  validateFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];
    return allowedTypes.includes(file.type);
  }

  // Enhanced file selection with validation
  onFileSelectedEnhanced(event: any) {
    const files = event.target.files;
    const validFiles: any[] = [];
    const errors: string[] = [];

    for (let file of files) {
      if (!this.validateFileType(file)) {
        errors.push(`${file.name}: Desteklenmeyen dosya türü`);
        continue;
      }
      
      if (!this.validateFileSize(file)) {
        errors.push(`${file.name}: Dosya boyutu çok büyük (max 10MB)`);
        continue;
      }

      validFiles.push({
        name: file.name,
        size: file.size,
        file: file
      });
    }

    this.newFiles = [...this.newFiles, ...validFiles];

    if (errors.length > 0) {
      alert('Bazı dosyalar eklenemedi:\n' + errors.join('\n'));
    }

    // Input'u temizle
    event.target.value = '';
  }

  // Delete project
  deleteProject() {
    if (confirm(`"${this.project?.name}" projesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      this.projectService.deleteProject(this.projectId).subscribe({
        next: () => {
          alert('Proje başarıyla silindi!');
          this.router.navigate(['/projects']);
        },
        error: (error) => {
          console.error('Proje silinirken hata:', error);
          alert('Proje silinirken bir hata oluştu.');
        }
      });
    }
  }

  // Copy project info to clipboard
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
