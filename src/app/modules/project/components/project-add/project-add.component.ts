import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project-service.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './project-add.component.html',
  styleUrls: ['./project-add.component.css']
})
export class ProjectAddComponent implements OnInit {
  projectForm!: FormGroup;
  uploadedFiles: any[] = [];
  selectedTemplate = 'marketing';

  templates = [
    { id: 'software', name: 'Yazılım Geliştirme', icon: '🚀', desc: 'Agile metodoloji' },
    { id: 'marketing', name: 'Marketing Kampanyası', icon: '📊', desc: 'Pazarlama süreci' },
    { id: 'construction', name: 'İnşaat Projesi', icon: '🏗️', desc: 'Yapı süreci' },
    { id: 'creative', name: 'Kreatif Proje', icon: '🎨', desc: 'Tasarım süreci' }
  ];

  priorities = [
    { value: 'low', label: 'Düşük', color: '#4CAF50' },
    { value: 'medium', label: 'Orta', color: '#ff9800' },
    { value: 'high', label: 'Yüksek', color: '#f44336' },
    { value: 'critical', label: 'Kritik', color: '#9c27b0' }
  ];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService, 
    private authService: AuthService
  ) {}

  ngOnInit() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      plannedStartDate: [todayString, Validators.required],
      plannedEndDate: [todayString, Validators.required],
      priority: ['medium'],
      budget: [50000]
    });
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    for (let file of files) {
      if (file.size <= 10 * 1024 * 1024) { // 10MB
        this.uploadedFiles.push({
          name: file.name,
          size: file.size,
          file: file
        });
      }
    }
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  selectTemplate(templateId: string) {
    this.selectedTemplate = templateId;
  }

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

  formatDate(dateStr: string): string {
    return dateStr ? new Date(dateStr).toLocaleDateString('tr-TR') : '-';
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

  getPriorityColor(): string {
    const priority = this.priorities.find(p => p.value === this.projectForm.get('priority')?.value);
    return priority?.color || '#ff9800';
  }

  getSelectedTemplate(): any {
    return this.templates.find(t => t.id === this.selectedTemplate);
  }

  onSubmit(): void {
    if (!this.projectForm.valid) {
      alert('Lütfen form alanlarını kontrol edin.');
      return;
    }

    const formValue = this.projectForm.value;
    
    // FormData oluştur
    const formData = new FormData();
    
    // Proje bilgilerini FormData'ya ekle
    formData.append('Name', formValue.name);
    formData.append('Description', formValue.description || '');
    formData.append('PlannedStartDate', formValue.plannedStartDate);
    formData.append('PlannedEndDate', formValue.plannedEndDate);
    formData.append('Priority', formValue.priority);
    formData.append('Status', 'Başlatılmadı');
    
    // Budget varsa ekle
    if (formValue.budget) {
      formData.append('Budget', formValue.budget.toString());
    }
    
    // ProjectManagerId varsa ekle
    const currentUserId = this.authService.getCurrentUserId();
    if (currentUserId) {
      formData.append('ProjectManagerId', currentUserId.toString());
    }
    
    // Dosyaları FormData'ya ekle
    this.uploadedFiles.forEach((fileObj, index) => {
      formData.append('Files', fileObj.file);
    });

    console.log('FormData içeriği:');
    // FormData içeriğini debug için göster
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    // Backend'e gönder
    this.projectService.addProjectWithFormData(formData).subscribe({
      next: (response) => {
        console.log('Proje başarıyla oluşturuldu:', response);
        alert('Proje başarıyla oluşturuldu!');
        this.projectForm.reset();
        this.uploadedFiles = [];
        
        // Form'u varsayılan değerlere sıfırla
        const today = new Date().toISOString().split('T')[0];
        this.projectForm.patchValue({
          plannedStartDate: today,
          plannedEndDate: today,
          priority: 'medium',
          budget: 50000
        });
      },
      error: (error) => {
        console.error('Proje oluşturulurken hata oluştu:', error);
        alert('Proje oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    });
  }
}