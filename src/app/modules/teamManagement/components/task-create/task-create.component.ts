// src/app/modules/task/components/task-create/task-create.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { TaskService } from '../../../task/services/task.service';
import { ProjectService } from '../../../project/services/project-service.service';
import { UserService } from '../../../user/services/user.service';
import { WorkpackageService } from '../../../workPackage/services/workpackage.service';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-create.component.html',
  styleUrls: ['./task-create.component.css']
})
export class TaskCreateComponent implements OnInit {
  taskForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;

  // Dropdown verileri
  projects: any[] = [];
  workPackages: any[] = [];
  users: any[] = [];
  
  // Öncelik ve durum seçenekleri
  priorities = [
    { value: 'Düşük', label: 'Düşük', color: '#4CAF50' },
    { value: 'Orta', label: 'Orta', color: '#ff9800' },
    { value: 'Yüksek', label: 'Yüksek', color: '#f44336' },
    { value: 'Kritik', label: 'Kritik', color: '#9c27b0' }
  ];

  statuses = [
    { value: 'Yapılacak', label: 'Yapılacak' },
    { value: 'Devam Eden', label: 'Devam Eden' },
    { value: 'İnceleme/Test', label: 'İnceleme/Test' },
    { value: 'Engelli', label: 'Engelli' },
    { value: 'Tamamlanan', label: 'Tamamlanan' }
  ];

  constructor(
    private workpackageService:WorkpackageService,
    private fb: FormBuilder,
    private router: Router,
    private taskService: TaskService,
    private projectService: ProjectService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadDropdownData();
  }

  initializeForm() {
    const today = new Date().toISOString().split('T')[0];
    
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.maxLength(2000)],
      projectId: ['', Validators.required],
      workPackageId: [''],
      priority: ['Orta', Validators.required],
      status: ['Yapılacak', Validators.required],
      plannedStartDate: [today],
      plannedEndDate: [''],
      assignedUserId: [''],
      estimatedEffort: [0, [Validators.min(0)]],
      tags: ['']
    });

    // Proje değiştiğinde iş paketlerini yükle
    this.taskForm.get('projectId')?.valueChanges.subscribe(projectId => {
      if (projectId) {
         this.loadWorkPackages(projectId);
      } else {
        this.workPackages = [];
        this.taskForm.get('workPackageId')?.setValue('');
      }
    });
  }

  loadDropdownData() {
    this.isLoading = true;
    
    // Projeler
    this.projectService.getProjects().subscribe({
      next: (response) => {
        this.projects = response.data || [];
      },
      error: (error) => {
        console.error('Projeler yüklenirken hata:', error);
        this.showErrorMessage('Projeler yüklenirken bir hata oluştu.');
      }
    });

    // Kullanıcılar
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Kullanıcılar yüklenirken hata:', error);
        this.showErrorMessage('Kullanıcılar yüklenirken bir hata oluştu.');
        this.isLoading = false;
      }
    });
  }

   loadWorkPackages(projectId: number) {
     this.workpackageService.getWorkPackagesByProjectId(projectId).subscribe({
       next: (response) => {
         this.workPackages = response.data || [];
       },
       error: (error) => {
         console.error('İş paketleri yüklenirken hata:', error);
         this.workPackages = [];
       }
     });
   }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.markFormGroupTouched(this.taskForm);
      this.showErrorMessage('Lütfen tüm gerekli alanları doldurun.');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.taskForm.value;

    const taskData = {
      title: formValue.title.trim(),
      description: formValue.description?.trim() || '',
      projectId: formValue.projectId,
      workPackageId: formValue.workPackageId || 0,
      priority: formValue.priority,
      status: formValue.status,
      plannedStartDate: formValue.plannedStartDate || null,
      plannedEndDate: formValue.plannedEndDate || null,
      assignedUserId: formValue.assignedUserId || null,
      estimatedEffort: formValue.estimatedEffort || 0,
      createdByUserId: this.authService.getCurrentUserId()
    };

    this.taskService.createTask(taskData).subscribe({
      next: (response) => {
        console.log('Görev başarıyla oluşturuldu:', response);
        this.showSuccessMessage('Görev başarıyla oluşturuldu!');
        
        // 2 saniye sonra görev listesine yönlendir
        setTimeout(() => {
          this.router.navigate(['/tasks/my-tasks']);
        }, 2000);
      },
      error: (error) => {
        console.error('Görev oluşturulurken hata:', error);
        this.showErrorMessage('Görev oluşturulurken bir hata oluştu.');
        this.isSubmitting = false;
      }
    });
  }

  onCancel() {
    if (this.taskForm.dirty) {
      if (confirm('Değişiklikler kaydedilmedi. Sayfadan ayrılmak istediğinizden emin misiniz?')) {
        this.router.navigate(['/team-management']);
      }
    } else {
      this.router.navigate(['/team-management']);
    }
  }

  // Form validation helper
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Validation helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'Bu alan zorunludur';
      }
      if (field.errors['maxlength']) {
        return `Maksimum ${field.errors['maxlength'].requiredLength} karakter olmalı`;
      }
      if (field.errors['min']) {
        return `Minimum değer ${field.errors['min'].min} olmalı`;
      }
    }
    return '';
  }

  // Priority color helper
  getPriorityColor(priority: string): string {
    const priorityObj = this.priorities.find(p => p.value === priority);
    return priorityObj?.color || '#666';
  }

  // Date validation
  onStartDateChange() {
    const startDate = this.taskForm.get('plannedStartDate')?.value;
    const endDate = this.taskForm.get('plannedEndDate')?.value;
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      this.taskForm.get('plannedEndDate')?.setValue('');
    }
  }

  onEndDateChange() {
    const startDate = this.taskForm.get('plannedStartDate')?.value;
    const endDate = this.taskForm.get('plannedEndDate')?.value;
    
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      this.showErrorMessage('Bitiş tarihi başlangıç tarihinden önce olamaz.');
      this.taskForm.get('plannedEndDate')?.setValue('');
    }
  }

  // Helper methods for preview
  formatPreviewDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  }

  getSelectedProject(): any {
    const projectId = this.taskForm.get('projectId')?.value;
    return this.projects.find(p => p.id == projectId);
  }

  getSelectedWorkPackage(): any {
    const workPackageId = this.taskForm.get('workPackageId')?.value;
    return this.workPackages.find(wp => wp.id == workPackageId);
  }

  getSelectedUser(): any {
    const userId = this.taskForm.get('assignedUserId')?.value;
    return this.users.find(u => u.id == userId);
  }

  // Message helpers
  private showSuccessMessage(message: string) {
    console.log('Success:', message);
    alert(message);
  }

  private showErrorMessage(message: string) {
    console.error('Error:', message);
    alert(message);
  }
}