import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project-service.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WorkpackageService } from '../../../workPackage/services/workpackage.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { DepartmentDto } from '../../../departments/models/departmentsDto';
import { ListResponseModel } from '../../../../core/models/listResponseModel';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './project-add.component.html',
  styleUrls: ['./project-add.component.css']
})
export class ProjectAddComponent implements OnInit {
  projectForm!: FormGroup;
  departments!: DepartmentDto[]
  uploadedFiles: any[] = [];
  isWorkPackageExpanded = false;


  priorities = [
    { value: 'Düşük', label: 'Düşük', color: '#4CAF50' },
    { value: 'Orta', label: 'Orta', color: '#ff9800' },
    { value: 'Yüksek', label: 'Yüksek', color: '#f44336' },
    { value: 'Kritik', label: 'Kritik', color: '#9c27b0' }
  ];

  workPackageStatuses = [
    { value: 'Başlatılmadı', label: 'Başlatılmadı' },
    { value: 'Devam Ediyor', label: 'Devam Ediyor' },
    { value: 'Tamamlandı', label: 'Tamamlandı' },
    { value: 'Beklemede', label: 'Beklemede' }
  ];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService, 
    private authService: AuthService,
    private workPackageService: WorkpackageService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit() {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  this.getDepartments();
  this.projectForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    plannedStartDate: [todayString, Validators.required],
    plannedEndDate: [todayString, Validators.required],
    priority: ['Orta'],
    budget: [50000],
    workPackages: this.fb.array([])
  });
}


  getDepartments(){
      this.departmentService.getAllDepartments().subscribe({
      next: (response:ListResponseModel<DepartmentDto>) => {
        this.departments = response.data;
      },
      error: (error) => {
        console.error('Bölümler yüklenirken hata oluştu:', error);
      }
    });
  }

  get workPackages(): FormArray {
    return this.projectForm.get('workPackages') as FormArray;
  }

  toggleWorkPackageSection() {
    this.isWorkPackageExpanded = !this.isWorkPackageExpanded;
  }

  addWorkPackage() {
    const today = new Date().toISOString().split('T')[0];
    
    const workPackageGroup = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      status: ['Başlatılmadı', Validators.required],
      plannedStartDate: [today],
      plannedEndDate: [today],
      department: [null, Validators.required], // null olarak başlat
      technicalManagerId: [null]
    });

    this.workPackages.push(workPackageGroup);
  }

  removeWorkPackage(index: number) {
    this.workPackages.removeAt(index);
  }

  getWorkPackagePreviewCount(): number {
    return this.workPackages.length;
  }

  getWorkPackageStatusLabel(value: string): string {
    const status = this.workPackageStatuses.find(s => s.value === value);
    return status ? status.label : value;
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

onDepartmentChange(workPackageIndex: number, event: any): void {
  const departmentId = event.target?.value || event;
  const selectedDepartment = this.departments.find(dept => dept.id === parseInt(departmentId));
  
  if (selectedDepartment) {
    const workPackageFormGroup = this.workPackages.at(workPackageIndex) as FormGroup;
    workPackageFormGroup.patchValue({
      technicalManagerId: selectedDepartment.managerId
    });
  }
}

// Alternatif olarak, daha modern bir yaklaşım:
onDepartmentSelectionChange(workPackageIndex: number, departmentId: string): void {
  if (!departmentId || departmentId === '') return;
  
  const selectedDepartment = this.departments.find(dept => dept.id === parseInt(departmentId));
  
  if (selectedDepartment) {
    const workPackageFormGroup = this.workPackages.at(workPackageIndex) as FormGroup;
    workPackageFormGroup.patchValue({
      technicalManagerId: selectedDepartment.managerId
    });
  }
}

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
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


  onSubmit(): void {
  if (!this.projectForm.valid) {
    console.log('Form errors:');
    alert('Lütfen form alanlarını kontrol edin.');
    return;
  }
  const formData = new FormData();
  
  this.addProjectToFormdata(formData);
  this.addWorkPackageToFormdata(formData);

  this.projectService.addProjectWithFormData(formData).subscribe({
    next: (response) => {
      this.resetForm();
      alert('Proje başarıyla oluşturuldu!');
    },
    error: (error) => {
      console.error('Proje oluşturulurken hata oluştu:', error);
      alert('Proje oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  });
}


  private addProjectToFormdata(formData: FormData) {
    const formValue = this.projectForm.value;
    formData.append('Name', formValue.name);
    formData.append('Description', formValue.description || '');
    formData.append('PlannedStartDate', formValue.plannedStartDate);
    formData.append('PlannedEndDate', formValue.plannedEndDate);
    formData.append('Priority', formValue.priority);
    formData.append('Status', 'Başlatılmadı');

    if (formValue.budget) {
      formData.append('Budget', formValue.budget.toString());
    }
    
    const currentUserId = this.authService.getCurrentUserId();
    if (currentUserId) {
      formData.append('ProjectManagerId', currentUserId.toString());
    }
    
    this.uploadedFiles.forEach((fileObj, index) => {
      formData.append('Files', fileObj.file);
    });
  }



  private addWorkPackageToFormdata(formData: FormData) {
    const formValue = this.projectForm.value;
    if (formValue.workPackages && formValue.workPackages.length > 0) {
      formValue.workPackages.forEach((wp: any, index: number) => {
        formData.append(`WorkPackages[${index}].Name`, wp.name);
        formData.append(`WorkPackages[${index}].Description`, wp.description || '');
        formData.append(`WorkPackages[${index}].Status`, wp.status);
        formData.append(`WorkPackages[${index}].PlannedStartDate`, wp.plannedStartDate);
        formData.append(`WorkPackages[${index}].PlannedEndDate`, wp.plannedEndDate);
        
        if (wp.department) {
          const selectedDepartment = this.departments.find(dept => dept.id === parseInt(wp.department));
          
          if (selectedDepartment) {
            formData.append(`WorkPackages[${index}].DepartmentId`, selectedDepartment.id.toString());
            
            const managerId = wp.technicalManagerId || selectedDepartment.managerId;
            if (managerId) {
              formData.append(`WorkPackages[${index}].TechnicalManagerId`, managerId.toString());
            }
          }
        }
      });
    }
  }


  private resetForm() {
    this.projectForm.reset();
    this.uploadedFiles = [];
    this.departments = [];
    this.isWorkPackageExpanded = false;
    
    const today = new Date().toISOString().split('T')[0];
    this.projectForm.patchValue({
      plannedStartDate: today,
      plannedEndDate: today,
      priority: 'medium',
      budget: 50000
    });

    while (this.workPackages.length !== 0) {
      this.workPackages.removeAt(0);
    }
  }
}