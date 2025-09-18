import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserTask } from '../../models/userTask';
import { User } from '../../models/user';
import { TaskService } from '../../../task/services/task.service';
import { UserService } from '../../../user/services/user.service';
import { AssignTaskDto } from '../../../task/models/assignTaskDto';
import { Route, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-team-task-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './team-task-management.component.html',
  styleUrls: ['./team-task-management.component.css']
})
export class TeamTaskManagementComponent implements OnInit {
  
  unassignedTasks: UserTask[] = [];
  
  assignedTasks: UserTask[] = [];
  teamMembers: User[] = [];
  assignTaskForm!: FormGroup;
  selectedTask: UserTask | null = null;
  showAssignModal = false;
  departmentId?:number; 
  // Filtreler
  statusFilter = 'all';
  priorityFilter = 'all';
  assigneeFilter = 'all';

  constructor(
    private fb: FormBuilder, 
    private userTaskService: TaskService,
    private userService:UserService,
    private routes:Router, 
    private authService:AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$
    .pipe(filter(Boolean), take(1))
    .subscribe(() => {
      this.departmentId = this.authService.getUserDepartmentId();
      this.initializeForm();
      this.loadTeamMembers();
      this.loadData(); // diğer yüklemeler
    });
  }

  openTaskModal() {
    this.routes.navigate(['/tasks/create']);
  }

  initializeForm() {
    this.assignTaskForm = this.fb.group({
      assignedUserId: ['', Validators.required],
      plannedStartDate: [''],
      plannedEndDate: [''],
      notes: ['']
    });
  }

    loadTeamMembers() {
    this.userService.getUsersByDepartment(this.departmentId ?? 0).subscribe({
      next: (response) => {        
        if (response && response.data && Array.isArray(response.data)) {
          const backendMembers = response.data.map(user => ({
            ...user,
            currentWorkload: user.currentWorkload || 0 // Default workload
          }));
          
          // Mock data ile backend data'yı birleştir (duplicate ID'leri önle)
          const allMembers = [...this.teamMembers];
          
          backendMembers.forEach(backendMember => {
            const existingIndex = allMembers.findIndex(m => m.id === backendMember.id);
            if (existingIndex !== -1) {
              // Eğer aynı ID varsa güncelle
              allMembers[existingIndex] = backendMember;
            } else {
              // Yeni üye ekle
              allMembers.push(backendMember);
            }
          });
          
          this.teamMembers = allMembers;
        }
      },
      error: (error) => {
        console.error('Takım üyeleri yüklenirken hata:', error);
      }
    });
  }
  loadData() {
    this.loadTeamMembers();

    // Backend'den atanmamış görevleri çek
    this.userTaskService.getUnassignedTasksByDepartmentId(this.departmentId ?? 0).subscribe({
      next: (response) => {        
        if (response && response.data && Array.isArray(response.data)) {
          // Backend'den gelen tarihleri Date objesine çevir
          this.unassignedTasks = response.data.map(task => ({
            ...task,
            plannedStartDate: task.plannedStartDate ? new Date(task.plannedStartDate) : undefined,
            plannedEndDate: task.plannedEndDate ? new Date(task.plannedEndDate) : undefined,
            actualStartDate: task.actualStartDate ? new Date(task.actualStartDate) : undefined,
            actualEndDate: task.actualEndDate ? new Date(task.actualEndDate) : undefined,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt)
          }));
          
        } else {
          console.error('Invalid response structure:', response);
          this.unassignedTasks = [];
        }        
      },
      error: (error) => {
        console.error('Atanmamış görevler yüklenirken hata:', error);
        this.unassignedTasks = [];

      }
    });

    this.loadAssignedTasks();
  }
loadAssignedTasks() {
  this.userTaskService.getAssignedTasksByDepartmentId(this.departmentId ?? 0).subscribe({
    next: (response) => {      
      if (response && response.data && Array.isArray(response.data)) {
        const backendAssignedTasks = response.data.map(task => ({
          ...task,
          plannedStartDate: task.plannedStartDate ? new Date(task.plannedStartDate) : undefined,
          plannedEndDate: task.plannedEndDate ? new Date(task.plannedEndDate) : undefined,
          actualStartDate: task.actualStartDate ? new Date(task.actualStartDate) : undefined,
          actualEndDate: task.actualEndDate ? new Date(task.actualEndDate) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          // Backend'den gelen kullanıcı bilgisini eşleştir
          assignedUser: this.teamMembers.find(m => m.id === task.assignedUserId)
        }));
        
        // Mock data ile backend data'yı birleştir
        this.assignedTasks = [...this.assignedTasks, ...backendAssignedTasks];      }
    },
    error: (error) => {
      console.error('Atanmış görevler yüklenirken hata:', error);
    }
  });
} 

  onStatusChange(task: UserTask, event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.updateTaskStatus(task, target.value);
    }
  }

  // Görev atama modalını aç
  openAssignModal(task: UserTask) {
    this.selectedTask = task;
    this.showAssignModal = true;
    
    // Form değerlerini sıfırla
    this.assignTaskForm.patchValue({
      assignedUserId: '',
      plannedStartDate: task.plannedStartDate ? this.formatDateForInput(task.plannedStartDate) : '',
      plannedEndDate: task.plannedEndDate ? this.formatDateForInput(task.plannedEndDate) : '',
      notes: ''
    });
  }

  // Görev atama modalını kapat
  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedTask = null;
    this.assignTaskForm.reset();
  }

  // Görevi kullanıcıya ata
  assignTask() {
  if (!this.selectedTask || !this.assignTaskForm.valid) {
    return;
  }

  const formValue = this.assignTaskForm.value;
  const assignedUser = this.teamMembers.find(member => member.id === parseInt(formValue.assignedUserId));

  if (assignedUser) {
    // Backend'e görev atama isteği gönder
    const assignTaskDto:AssignTaskDto={
      taskId:this.selectedTask.id,
      assignedUserId:assignedUser.id
    };
    this.userTaskService.assignTaskToUser(assignTaskDto).subscribe({
      next: (response) => {        
        // Frontend'te de güncelleme yap
        const updatedTask: UserTask = {
          ...this.selectedTask!,
          assignedUserId: assignedUser.id,
          assignedUserName: this.getUserFullName(assignedUser),
          assignedUser: assignedUser,
          status: 'To Do',
          plannedStartDate: formValue.plannedStartDate ? new Date(formValue.plannedStartDate) : this.selectedTask!.plannedStartDate,
          plannedEndDate: formValue.plannedEndDate ? new Date(formValue.plannedEndDate) : this.selectedTask!.plannedEndDate,
          updatedAt: new Date()
        };

        // Atanmamış görevlerden çıkar
        this.unassignedTasks = this.unassignedTasks.filter(task => task.id !== this.selectedTask!.id);
        
        // Atanmış görevlere ekle
        this.assignedTasks.push(updatedTask);

        alert('Görev başarıyla atandı!');
        
        this.closeAssignModal();
      },
      error: (error) => {
        console.error('Görev atama hatası:', error);
        alert('Görev atanırken hata oluştu!');
      }
    });
  }
}

  // Görev durumunu güncelle
  updateTaskStatus(task: UserTask, newStatus: string) {
    const updatedTask = { ...task, status: newStatus, updatedAt: new Date() };
    const taskIndex = this.assignedTasks.findIndex(t => t.id === task.id);
    
    if (taskIndex !== -1) {
      this.assignedTasks[taskIndex] = updatedTask;
      this.userTaskService.updateTaskStatus({ taskId: task.id, status: newStatus }).subscribe({
        next: (response) => {
        },
        error: (err) => {
          console.error("Task status update error:", err);
        }
      });
    }
  }


  getDoneTasksCount(): number {
    return this.assignedTasks.filter(t => t.status === 'Tamamlanan').length;
  }

  getUserFullName(user?: User): string {
    return user ? `${user.firstName} ${user.lastName}` : 'Atanmamış';
  }

  formatDateForInput(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  formatDate(date?: Date): string {
    return date ? new Date(date).toLocaleDateString('tr-TR') : '-';
  }

  // Öncelik rengini getir
  getPriorityColor(priority: string): string {
    const colors = {
      'Düşük': '#4CAF50',
      'Orta': '#ff9800',
      'Yüksek': '#f44336',
      'Kritik': '#9c27b0'
    };
    return colors[priority as keyof typeof colors] || '#666';
  }

  // Durum rengini getir
  getStatusColor(status: string): string {
    const colors = {
      'Yapılacak': '#666',
      'Devam Eden': '#2196F3',
      'İnceleme/Test': '#ff9800',
      'Engelli': '#f44336',
      'Tamamlanan': '#4CAF50'
    };
    return colors[status as keyof typeof colors] || '#666';
  }

  // İş yükü durumunu getir
  getWorkloadStatus(workload?: number): { color: string, text: string } {
    if (!workload) return { color: '#4CAF50', text: 'Uygun' };
    
    if (workload < 20) return { color: '#4CAF50', text: 'Düşük' };
    if (workload < 35) return { color: '#ff9800', text: 'Orta' };
    return { color: '#f44336', text: 'Yüksek' };
  }

  
  // Filtrelenmiş görevleri getir
  getFilteredAssignedTasks(): UserTask[] {
    return this.assignedTasks.filter(task => {
      const statusMatch = this.statusFilter === 'all' || task.status === this.statusFilter;
      const priorityMatch = this.priorityFilter === 'all' || task.priority === this.priorityFilter;
      const assigneeMatch = this.assigneeFilter === 'all' || task.assignedUserId?.toString() === this.assigneeFilter;
      
      return statusMatch && priorityMatch && assigneeMatch;
    });
  }

  // Filtrelenmiş atanmamış görevleri getir
  getFilteredUnassignedTasks(): UserTask[] {
    return this.unassignedTasks.filter(task => {
      const priorityMatch = this.priorityFilter === 'all' || task.priority === this.priorityFilter;
      return priorityMatch;
    });
  }
}