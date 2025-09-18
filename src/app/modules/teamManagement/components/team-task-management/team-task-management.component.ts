import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserTask } from '../../models/userTask';
import { User } from '../../models/user';
import { TaskService } from '../../../task/services/task.service';
import { UserService } from '../../../user/services/user.service';
import { AssignTaskDto } from '../../../task/models/assignTaskDto';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-team-task-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './team-task-management.component.html',
  styleUrls: ['./team-task-management.component.css']
})
export class TeamTaskManagementComponent implements OnInit {
  
  // Takım liderinin takımına atanan görevler (henüz bireysel atama yapılmamış)
  unassignedTasks: UserTask[] = [];
  
  // Takım üyelerine atanmış görevler
  assignedTasks: UserTask[] = [];
  
  // Takım üyeleri
  teamMembers: User[] = [];
  
  // Form ve modal kontrolleri
  assignTaskForm!: FormGroup;
  selectedTask: UserTask | null = null;
  showAssignModal = false;
  
  // Filtreler
  statusFilter = 'all';
  priorityFilter = 'all';
  assigneeFilter = 'all';

  constructor(private fb: FormBuilder, private userTaskService: TaskService,private userService:UserService,private routes:Router) {}

  ngOnInit() {
    this.initializeForm();
    this.loadData();
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
  this.userService.getUsersByDepartment(5).subscribe({
    next: (response) => {
      console.log('Team Members API Response:', response);
      
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
        console.log('Takım üyeleri yüklendi, toplam:', this.teamMembers.length);
      }
    },
    error: (error) => {
      console.error('Takım üyeleri yüklenirken hata:', error);
      // Hata durumunda mock data ile devam et
    }
  });
}
  loadData() {
    // Mock takım üyeleri
    this.teamMembers = [
      {
        id: 1,
        firstName: 'Ahmet',
        role:"user",
        lastName: 'Yılmaz',
        email: 'ahmet.yilmaz@company.com',
        position: 'Senior Developer',
        departmentId: 1,
        isActive: true,
        currentWorkload: 35
      },
      {
        id: 2,
        firstName: 'Mehmet',
                role:"user",
        lastName: 'Kaya',
        email: 'mehmet.kaya@company.com',
        position: 'Frontend Developer',
        departmentId: 1,
        isActive: true,
        currentWorkload: 20
      },
      {
        id: 3,
        firstName: 'Selin',
                role:"user",
        lastName: 'Başak',
        email: 'selin.basak@company.com',
        position: 'QA Engineer',
        departmentId: 1,
        isActive: true,
        currentWorkload: 15
      },
      {
        id: 4,
        firstName: 'Emre',
                role:"user",
        lastName: 'Koç',
        email: 'emre.koc@company.com',
        position: 'DevOps Engineer',
        departmentId: 1,
        isActive: true,
        currentWorkload: 40
      }
    ];
    this.loadTeamMembers();

    // Backend'den atanmamış görevleri çek
    this.userTaskService.getUnassignedTasksByDepartmentId(5).subscribe({
      next: (response) => {
        console.log('RAW API Response:', response);
        
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
          
          console.log('Atanmamış görevler yüklendi:', this.unassignedTasks);
        } else {
          console.error('Invalid response structure:', response);
          this.unassignedTasks = [];
        }
        
        // Mock data ekle
        this.addMockUnassignedTask();
      },
      error: (error) => {
        console.error('Atanmamış görevler yüklenirken hata:', error);
        this.unassignedTasks = [];
        
        // Hata durumunda da mock data ekle
        this.addMockUnassignedTask();
      }
    });

    // Mock atanmış görevler
    this.assignedTasks = [
      {
        id: 1,
        workPackageId: 101,
        projectId: 1,
        title: 'Kullanıcı Profil Sayfası Geliştirme',
        description: 'Kullanıcı hesap yönetimi ve profil düzenleme sayfalarının geliştirilmesi',
        assignedUserId: 1,
        assignedUserName: 'Ahmet Yılmaz',
        status: 'In Progress',
        priority: 'Yüksek',
        plannedStartDate: new Date('2024-09-01'),
        plannedEndDate: new Date('2024-09-10'),
        actualStartDate: new Date('2024-09-02'),
        estimatedEffort: 20,
        actualEffort: 12,
        createdAt: new Date('2024-08-30'),
        updatedAt: new Date('2024-09-05'),
        isOverdue: false,
        projectName: 'E-Ticaret Projesi',
        workPackageName: 'Kullanıcı Yönetimi',
        assignedUser: this.teamMembers.find(m => m.id === 1)
      },
      {
        id: 2,
        workPackageId: 104,
        projectId: 1,
        title: 'Sepet ve Ödeme UI',
        description: 'Alışveriş sepeti ve ödeme sürecinin kullanıcı arayüzü geliştirmesi',
        assignedUserId: 2,
        assignedUserName: 'Mehmet Kaya',
        status: 'In Review/Test',
        priority: 'Kritik',
        plannedStartDate: new Date('2024-08-20'),
        plannedEndDate: new Date('2024-09-05'),
        actualStartDate: new Date('2024-08-22'),
        estimatedEffort: 18,
        actualEffort: 16,
        createdAt: new Date('2024-08-15'),
        updatedAt: new Date('2024-09-04'),
        isOverdue: false,
        projectName: 'E-Ticaret Projesi',
        workPackageName: 'E-ticaret Sepet Modülü',
        assignedUser: this.teamMembers.find(m => m.id === 2)
      },
      {
        id: 3,
        workPackageId: 202,
        projectId: 2,
        title: 'Kurumsal Blog Sistemi',
        description: 'Blog yazıları listeleme ve detay sayfalarının frontend implementasyonu',
        assignedUserId: 3,
        assignedUserName: 'Selin Başak',
        status: 'To Do',
        priority: 'Orta',
        plannedStartDate: new Date('2024-09-08'),
        plannedEndDate: new Date('2024-09-15'),
        estimatedEffort: 12,
        actualEffort: 0,
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date('2024-09-01'),
        isOverdue: false,
        projectName: 'Kurumsal Web Sitesi',
        workPackageName: 'İçerik Yönetim Sistemi',
        assignedUser: this.teamMembers.find(m => m.id === 3)
      },
      
    ];
    this.loadAssignedTasks();
  }
loadAssignedTasks() {
  this.userTaskService.getAssignedTasksByDepartmentId(5).subscribe({
    next: (response) => {
      console.log('Assigned Tasks API Response:', response);
      
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
        this.assignedTasks = [...this.assignedTasks, ...backendAssignedTasks];
        console.log('Atanmış görevler yüklendi, toplam:', this.assignedTasks.length);
      }
    },
    error: (error) => {
      console.error('Atanmış görevler yüklenirken hata:', error);
    }
  });
} 
  // Mock data ekleme method'u
  addMockUnassignedTask() {
  const mockTask: UserTask = {
    id: 9999,
    workPackageId: 999,
    projectId: 99,
    title: 'Mock Test Görevi',
    description: 'Bu bir test görevi, backend entegrasyonu sonrası eklenen mock data',
    assignedUserId: undefined, // null yerine undefined
    assignedUserName: undefined, // null yerine undefined
    status: 'To Do',
    priority: 'Orta',
    plannedStartDate: new Date('2024-09-20'),
    plannedEndDate: new Date('2024-09-25'),
    actualStartDate: undefined, // null yerine undefined
    actualEndDate: undefined, // null yerine undefined
    estimatedEffort: 8,
    actualEffort: undefined, // null yerine undefined
    createdAt: new Date(),
    updatedAt: new Date(),
    isOverdue: false,
    daysOverdue: undefined, // null yerine undefined
    projectName: 'Mock Test Projesi',
    workPackageName: 'Mock Test İş Paketi'
  };
    
    // Backend verilerine mock data ekle
    this.unassignedTasks = [...this.unassignedTasks, mockTask];
    console.log('Mock data eklendi, toplam görev sayısı:', this.unassignedTasks.length);
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
        console.log('Görev atama başarılı:', response);
        
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

        console.log(`Görev "${this.selectedTask!.title}" kullanıcı "${assignedUser.firstName} ${assignedUser.lastName}"'e atandı.`);
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
          console.log("Task status updated:", response);
          console.log(`Görev "${task.title}" durumu "${newStatus}" olarak güncellendi.`);
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

  // Kullanıcı adını getir
  getUserFullName(user?: User): string {
    return user ? `${user.firstName} ${user.lastName}` : 'Atanmamış';
  }

  // Tarih formatını input için düzenle
  formatDateForInput(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  // Tarih formatını görüntülemek için düzenle
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