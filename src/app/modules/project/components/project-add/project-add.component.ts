import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // NgIf, NgFor için gerekli
import { ProjectService } from '../../services/project-service.service';
import { ProjectDto } from '../../models/projectDto';


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

  constructor(private fb: FormBuilder,private projectService:ProjectService) {}

  ngOnInit() {
    this.projectForm = this.fb.group({
      name: ['E-Ticaret Web Sitesi', Validators.required],
      description: ['Modern e-ticaret platformu geliştirme projesi. Kullanıcı dostu arayüz, güvenli ödeme sistemi ve envanter yönetimi içerecek.'],
      plannedStartDate: ['2024-01-15', Validators.required],
      plannedEndDate: ['2024-06-15', Validators.required],
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
  // ❌ Yanlış: startDate ve endDate
  // const start = this.projectForm.get('startDate')?.value;
  // const end = this.projectForm.get('endDate')?.value;
  
  // ✅ Doğru: plannedStartDate ve plannedEndDate
  const start = this.projectForm.get('plannedStartDate')?.value;
  const end = this.projectForm.get('plannedEndDate')?.value;
  
  if (start && end) {
    const diffTime = new Date(end).getTime() - new Date(start).getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return `${diffMonths} Ay`;
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

  const newProject: ProjectDto = {
    name: formValue.name, // ✅ Doğru - eskiden projectName yazıyordu
    description: formValue.description, // ✅ Doğru - eskiden projectDescription yazıyordu
    plannedStartDate: new Date(formValue.plannedStartDate), // ✅ Doğru - eskiden startDate yazıyordu
    plannedEndDate: new Date(formValue.plannedEndDate), // ✅ Doğru - eskiden endDate yazıyordu
    priority: formValue.priority,
  };

  console.log('Gönderilecek Project DTO:', newProject);

  this.projectService.addProject(newProject).subscribe({
    next: (response) => {
      console.log('Proje eklendi:', response);
      alert('Proje başarıyla oluşturuldu!');
      this.projectForm.reset();
      this.uploadedFiles = [];
    },
    error: (err) => {
      console.error('Hata oluştu:', err);
      alert('Proje eklenirken hata oluştu!');
    }
  });
}

}
