import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DeadlineService, DeadlineItemDTO, DeadlineActionDTO, DeadlineRecipientDTO, DeadlineInstanceDTO } from '../services/deadline.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-deadline-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatDatepickerModule, MatExpansionModule, MatTableModule,
    MatChipsModule, MatCheckboxModule, MatTooltipModule, MatProgressSpinnerModule,
    MatDividerModule, MatSnackBarModule, MatAutocompleteModule
  ],
  template: `
    <div class="deadline-detail-page">
      <div class="page-header">
        <div>
          <button mat-icon-button routerLink="/deadlines/items" matTooltip="Back to list">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ isEdit ? 'Edit Deadline' : 'New Deadline' }}</h1>
        </div>
        <div class="header-actions">
          <button mat-button routerLink="/deadlines/items">Cancel</button>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="saving || !form.valid">
            @if (saving) { <mat-spinner diameter="20"></mat-spinner> }
            {{ isEdit ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="form-layout">
          <!-- Basic Info -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Basic Information</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="form" class="form-grid">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Deadline Name</mat-label>
                  <input matInput formControlName="name" placeholder="e.g., Annual Report Filing">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Code</mat-label>
                  <input matInput formControlName="code" placeholder="Auto-generated if empty">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Category</mat-label>
                  <mat-select formControlName="categoryId">
                    <mat-option [value]="null">None</mat-option>
                    @for (cat of categories; track cat.id) {
                      <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Priority</mat-label>
                  <mat-select formControlName="priority">
                    <mat-option value="LOW">Low</mat-option>
                    <mat-option value="MEDIUM">Medium</mat-option>
                    <mat-option value="HIGH">High</mat-option>
                    <mat-option value="CRITICAL">Critical</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Status</mat-label>
                  <mat-select formControlName="status">
                    <mat-option value="ACTIVE">Active</mat-option>
                    <mat-option value="PAUSED">Paused</mat-option>
                    <mat-option value="COMPLETED">Completed</mat-option>
                    <mat-option value="ARCHIVED">Archived</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Recurrence</mat-label>
                  <mat-select formControlName="recurrenceType">
                    <mat-option value="ONE_TIME">One Time</mat-option>
                    <mat-option value="MONTHLY">Monthly</mat-option>
                    <mat-option value="QUARTERLY">Quarterly</mat-option>
                    <mat-option value="SEMI_ANNUAL">Semi-Annual</mat-option>
                    <mat-option value="ANNUAL">Annual</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Next Due Date</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="nextDueDate">
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Reminder Days Before (comma-separated)</mat-label>
                  <input matInput formControlName="reminderDaysBefore" placeholder="30,7,1">
                  <mat-hint>e.g., 30,7,1 sends reminders 30, 7, and 1 day(s) before due date</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Owner</mat-label>
                  <mat-select formControlName="ownerId">
                    <mat-option [value]="null">None</mat-option>
                    @for (user of users; track user.id) {
                      <mat-option [value]="user.id">{{ user.fullName }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="3" placeholder="Describe this deadline"></textarea>
                </mat-form-field>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Actions -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Actions / Checklist</mat-card-title>
              <mat-card-subtitle>Define the steps needed to complete this deadline</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @for (action of actions; track action; let i = $index) {
                <div class="action-row">
                  <span class="action-number">{{ i + 1 }}</span>
                  <mat-form-field appearance="outline" class="action-title">
                    <mat-label>Action Title</mat-label>
                    <input matInput [(ngModel)]="action.title" placeholder="What needs to be done">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="action-assignee">
                    <mat-label>Assignee</mat-label>
                    <mat-select [(ngModel)]="action.assigneeId">
                      <mat-option [value]="null">Unassigned</mat-option>
                      @for (user of users; track user.id) {
                        <mat-option [value]="user.id">{{ user.fullName }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="action-offset">
                    <mat-label>Days Before</mat-label>
                    <input matInput type="number" [(ngModel)]="action.dueOffsetDays" placeholder="Due offset">
                    <mat-hint>Days before deadline</mat-hint>
                  </mat-form-field>
                  <button mat-icon-button color="warn" matTooltip="Remove action" (click)="removeAction(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
              <button mat-stroked-button color="primary" (click)="addAction()">
                <mat-icon>add</mat-icon> Add Action
              </button>
            </mat-card-content>
          </mat-card>

          <!-- Notification Recipients -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Notification Recipients</mat-card-title>
              <mat-card-subtitle>Who should be notified about this deadline</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @for (recipient of recipients; track recipient; let i = $index) {
                <div class="recipient-row">
                  <mat-form-field appearance="outline" class="recipient-name">
                    <mat-label>Name</mat-label>
                    <input matInput [(ngModel)]="recipient.recipientName">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="recipient-email">
                    <mat-label>Email</mat-label>
                    <input matInput [(ngModel)]="recipient.recipientEmail" type="email">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="recipient-user">
                    <mat-label>Or select user</mat-label>
                    <mat-select [(ngModel)]="recipient.userId" (selectionChange)="onUserSelected(recipient, $event.value)">
                      <mat-option [value]="null">Manual entry</mat-option>
                      @for (user of users; track user.id) {
                        <mat-option [value]="user.id">{{ user.fullName }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <div class="recipient-toggles">
                    <mat-checkbox [(ngModel)]="recipient.notifyOnReminder" matTooltip="Notify on reminders">Reminder</mat-checkbox>
                    <mat-checkbox [(ngModel)]="recipient.notifyOnOverdue" matTooltip="Notify when overdue">Overdue</mat-checkbox>
                    <mat-checkbox [(ngModel)]="recipient.notifyOnCompletion" matTooltip="Notify on completion">Complete</mat-checkbox>
                  </div>
                  <button mat-icon-button color="warn" matTooltip="Remove recipient" (click)="removeRecipient(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
              <button mat-stroked-button color="primary" (click)="addRecipient()">
                <mat-icon>add</mat-icon> Add Recipient
              </button>
            </mat-card-content>
          </mat-card>

          <!-- Instances (edit mode only) -->
          @if (isEdit && instances.length > 0) {
            <mat-card>
              <mat-card-header>
                <mat-card-title>Deadline History</mat-card-title>
                <mat-card-subtitle>Past and upcoming occurrences</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <table mat-table [dataSource]="instances" class="instances-table">
                  <ng-container matColumnDef="dueDate">
                    <th mat-header-cell *matHeaderCellDef>Due Date</th>
                    <td mat-cell *matCellDef="let row">{{ row.dueDate | date:'dd MMM yyyy' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let row">
                      <span class="status-chip" [class]="'status-' + row.status?.toLowerCase()">{{ row.status?.replace('_', ' ') }}</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="daysRemaining">
                    <th mat-header-cell *matHeaderCellDef>Days</th>
                    <td mat-cell *matCellDef="let row"
                        [class.overdue-text]="row.daysRemaining < 0"
                        [class.due-soon-text]="row.daysRemaining >= 0 && row.daysRemaining <= 7">
                      {{ row.status === 'COMPLETED' || row.status === 'SKIPPED' ? '-' : (row.daysRemaining >= 0 ? row.daysRemaining + ' remaining' : Math.abs(row.daysRemaining) + ' overdue') }}
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="completedAt">
                    <th mat-header-cell *matHeaderCellDef>Completed</th>
                    <td mat-cell *matCellDef="let row">{{ row.completedAt ? (row.completedAt | date:'dd MMM yyyy HH:mm') : '-' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let row">
                      @if (row.status !== 'COMPLETED' && row.status !== 'SKIPPED') {
                        <button mat-icon-button matTooltip="Mark Complete" color="primary" (click)="completeInstance(row)">
                          <mat-icon>check_circle</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Skip" (click)="skipInstance(row)">
                          <mat-icon>skip_next</mat-icon>
                        </button>
                      }
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="instanceColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: instanceColumns"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .deadline-detail-page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header > div:first-child { display: flex; align-items: center; gap: 8px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .header-actions { display: flex; gap: 8px; align-items: center; }
    .loading-container { display: flex; justify-content: center; padding: 60px; }

    .form-layout { display: flex; flex-direction: column; gap: 24px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .full-width { grid-column: 1 / -1; }

    .action-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
    .action-number { width: 28px; height: 28px; background: #e3f2fd; color: #1565c0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; margin-top: 12px; flex-shrink: 0; }
    .action-title { flex: 1; }
    .action-assignee { width: 200px; }
    .action-offset { width: 120px; }

    .recipient-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .recipient-name { width: 180px; }
    .recipient-email { width: 220px; }
    .recipient-user { width: 200px; }
    .recipient-toggles { display: flex; gap: 8px; align-items: center; padding-top: 12px; flex-wrap: wrap; }
    .recipient-toggles mat-checkbox { font-size: 13px; }

    .instances-table { width: 100%; }
    .overdue-text { color: #c62828; font-weight: 600; }
    .due-soon-text { color: #e65100; font-weight: 600; }

    .status-chip { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-upcoming { background: #e3f2fd; color: #1565c0; }
    .status-due_soon { background: #fff3e0; color: #e65100; }
    .status-overdue { background: #ffebee; color: #c62828; }
    .status-completed { background: #e8f5e9; color: #2e7d32; }
    .status-skipped { background: #f5f5f5; color: #666; }

    .priority-chip { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; text-transform: uppercase; }
    .priority-critical { background: #ffebee; color: #c62828; }
    .priority-high { background: #fff3e0; color: #e65100; }
    .priority-medium { background: #fff8e1; color: #f57f17; }
    .priority-low { background: #e8f5e9; color: #2e7d32; }
  `]
})
export class DeadlineDetailComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  deadlineId: string | null = null;
  loading = false;
  saving = false;
  Math = Math;

  actions: DeadlineActionDTO[] = [];
  recipients: DeadlineRecipientDTO[] = [];
  instances: DeadlineInstanceDTO[] = [];
  users: any[] = [];
  categories: any[] = [];

  instanceColumns = ['dueDate', 'status', 'daysRemaining', 'completedAt', 'actions'];

  constructor(
    private fb: FormBuilder,
    private deadlineService: DeadlineService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      description: [''],
      categoryId: [null],
      priority: ['MEDIUM'],
      status: ['ACTIVE'],
      recurrenceType: ['ONE_TIME'],
      nextDueDate: [null],
      reminderDaysBefore: ['30,7,1'],
      ownerId: [null]
    });

    this.loadUsers();
    this.loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.deadlineId = id;
      this.loadItem(id);
    }
  }

  loadItem(id: string) {
    this.loading = true;
    this.deadlineService.getById(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          const item = res.data;
          this.form.patchValue({
            name: item.name,
            code: item.code,
            description: item.description,
            categoryId: item.categoryId,
            priority: item.priority,
            status: item.status,
            recurrenceType: item.recurrenceType,
            nextDueDate: item.nextDueDate ? new Date(item.nextDueDate) : null,
            reminderDaysBefore: item.reminderDaysBefore,
            ownerId: item.ownerId
          });
          this.actions = item.actions || [];
          this.recipients = item.recipients || [];
          this.instances = item.instances || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load deadline', 'Close', { duration: 3000 });
        this.router.navigate(['/deadlines/items']);
      }
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (res: any) => {
        if (res.success) this.users = res.data;
      }
    });
  }

  loadCategories() {
    this.deadlineService.getActiveCategories().subscribe({
      next: (res: any) => {
        if (res.success) this.categories = res.data;
      }
    });
  }

  addAction() {
    this.actions.push({
      title: '',
      displayOrder: this.actions.length,
      status: 'PENDING'
    });
  }

  removeAction(index: number) {
    this.actions.splice(index, 1);
  }

  addRecipient() {
    this.recipients.push({
      recipientName: '',
      recipientEmail: '',
      notifyOnReminder: true,
      notifyOnOverdue: true,
      notifyOnCompletion: true
    });
  }

  removeRecipient(index: number) {
    this.recipients.splice(index, 1);
  }

  onUserSelected(recipient: DeadlineRecipientDTO, userId: string) {
    if (userId) {
      const user = this.users.find(u => u.id === userId);
      if (user) {
        recipient.recipientName = user.fullName;
        recipient.recipientEmail = user.email;
      }
    }
  }

  save() {
    if (!this.form.valid) return;

    this.saving = true;
    const formValue = this.form.value;

    // Format the date
    let nextDueDate = formValue.nextDueDate;
    if (nextDueDate instanceof Date) {
      nextDueDate = nextDueDate.toISOString().split('T')[0];
    }

    const dto: DeadlineItemDTO = {
      ...formValue,
      nextDueDate,
      actions: this.actions.filter(a => a.title?.trim()),
      recipients: this.recipients.filter(r => r.recipientEmail?.trim())
    };

    const request = this.isEdit
      ? this.deadlineService.update(this.deadlineId!, dto)
      : this.deadlineService.create(dto);

    request.subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.success) {
          this.snackBar.open(this.isEdit ? 'Deadline updated' : 'Deadline created', 'Close', { duration: 3000 });
          this.router.navigate(['/deadlines/items']);
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Failed to save', 'Close', { duration: 3000 });
      }
    });
  }

  completeInstance(instance: DeadlineInstanceDTO) {
    this.deadlineService.completeInstance(instance.id!).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.snackBar.open('Marked as completed', 'Close', { duration: 3000 });
          this.loadItem(this.deadlineId!);
        }
      }
    });
  }

  skipInstance(instance: DeadlineInstanceDTO) {
    this.deadlineService.skipInstance(instance.id!).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.snackBar.open('Instance skipped', 'Close', { duration: 3000 });
          this.loadItem(this.deadlineId!);
        }
      }
    });
  }
}
