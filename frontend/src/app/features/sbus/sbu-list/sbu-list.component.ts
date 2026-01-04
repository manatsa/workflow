import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '@core/services/user.service';
import { SBU } from '@core/models/user.model';

interface SBUNode extends SBU {
  children?: SBUNode[];
}

@Component({
  selector: 'app-sbu-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTreeModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="sbu-list-container">
      <div class="header">
        <h1>SBU Management</h1>
        <button mat-raised-button color="primary" (click)="showAddSbu = true">
          <mat-icon>add</mat-icon>
          Add SBU
        </button>
      </div>

      <div class="content-grid">
        <mat-card class="tree-card">
          <mat-card-header>
            <mat-card-title>Organization Structure</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-tree [dataSource]="dataSource" [treeControl]="treeControl" class="sbu-tree">
              <mat-nested-tree-node *matTreeNodeDef="let node">
                <div class="mat-tree-node">
                  <button mat-icon-button disabled></button>
                  <div class="sbu-node" (click)="selectSbu(node)" [class.selected]="selectedSbu?.id === node.id">
                    <mat-icon>business</mat-icon>
                    <span>{{ node.name }}</span>
                    @if (node.code) {
                      <span class="code">({{ node.code }})</span>
                    }
                  </div>
                  <button mat-icon-button (click)="editSbu(node)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="deleteSbu(node)" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </mat-nested-tree-node>

              <mat-nested-tree-node *matTreeNodeDef="let node; when: hasChild">
                <div class="mat-tree-node">
                  <button mat-icon-button matTreeNodeToggle>
                    <mat-icon>
                      {{ treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}
                    </mat-icon>
                  </button>
                  <div class="sbu-node" (click)="selectSbu(node)" [class.selected]="selectedSbu?.id === node.id">
                    <mat-icon>business</mat-icon>
                    <span>{{ node.name }}</span>
                    @if (node.code) {
                      <span class="code">({{ node.code }})</span>
                    }
                  </div>
                  <button mat-icon-button (click)="editSbu(node)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="deleteSbu(node)" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                <div [class.hidden]="!treeControl.isExpanded(node)">
                  <ng-container matTreeNodeOutlet></ng-container>
                </div>
              </mat-nested-tree-node>
            </mat-tree>

            @if (flatSbus.length === 0) {
              <div class="no-data">
                <mat-icon>business</mat-icon>
                <p>No SBUs configured. Add your first SBU to get started.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>{{ editingSbu ? 'Edit SBU' : (showAddSbu ? 'Add SBU' : 'SBU Details') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (showAddSbu || editingSbu) {
              <form [formGroup]="sbuForm" (ngSubmit)="saveSbu()">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name">
                  @if (sbuForm.get('name')?.hasError('required')) {
                    <mat-error>Name is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Code</mat-label>
                  <input matInput formControlName="code">
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="3"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Parent SBU</mat-label>
                  <mat-select formControlName="parentId">
                    <mat-option [value]="null">None (Root Level)</mat-option>
                    @for (sbu of flatSbus; track sbu.id) {
                      @if (!editingSbu || sbu.id !== editingSbu.id) {
                        <mat-option [value]="sbu.id">{{ sbu.name }}</mat-option>
                      }
                    }
                  </mat-select>
                </mat-form-field>

                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="loading">
                    {{ editingSbu ? 'Update' : 'Create' }}
                  </button>
                </div>
              </form>
            } @else if (selectedSbu) {
              <div class="sbu-details">
                <div class="detail-row">
                  <span class="label">Name</span>
                  <span class="value">{{ selectedSbu.name }}</span>
                </div>
                @if (selectedSbu.code) {
                  <div class="detail-row">
                    <span class="label">Code</span>
                    <span class="value">{{ selectedSbu.code }}</span>
                  </div>
                }
                @if (selectedSbu.description) {
                  <div class="detail-row">
                    <span class="label">Description</span>
                    <span class="value">{{ selectedSbu.description }}</span>
                  </div>
                }
                @if (selectedSbu.parent) {
                  <div class="detail-row">
                    <span class="label">Parent</span>
                    <span class="value">{{ selectedSbu.parent.name }}</span>
                  </div>
                }
                <div class="detail-actions">
                  <button mat-raised-button (click)="editSbu(selectedSbu)">
                    <mat-icon>edit</mat-icon>
                    Edit
                  </button>
                  <button mat-raised-button color="primary" (click)="addChildSbu()">
                    <mat-icon>add</mat-icon>
                    Add Child
                  </button>
                </div>
              </div>
            } @else {
              <div class="no-selection">
                <mat-icon>touch_app</mat-icon>
                <p>Select an SBU to view details or click "Add SBU" to create a new one.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .sbu-list-container { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 1rem;
    }

    .sbu-tree {
      min-height: 300px;
    }

    .mat-tree-node {
      display: flex;
      align-items: center;
    }

    .sbu-node {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .sbu-node:hover {
      background: #f5f5f5;
    }

    .sbu-node.selected {
      background: #e3f2fd;
    }

    .sbu-node .code {
      font-size: 0.75rem;
      color: #666;
    }

    .hidden {
      display: none;
    }

    .no-data, .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #666;
      text-align: center;
    }

    .no-data mat-icon, .no-selection mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    .form-field {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .sbu-details {
      padding: 0.5rem;
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      margin-bottom: 1rem;
    }

    .detail-row .label {
      font-size: 0.75rem;
      color: #666;
    }

    .detail-row .value {
      font-weight: 500;
    }

    .detail-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }
  `]
})
export class SbuListComponent implements OnInit {
  treeControl = new NestedTreeControl<SBUNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<SBUNode>();
  flatSbus: SBU[] = [];

  selectedSbu: SBU | null = null;
  editingSbu: SBU | null = null;
  showAddSbu = false;
  loading = false;

  sbuForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.sbuForm = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      description: [''],
      parentId: [null]
    });
  }

  ngOnInit() {
    this.loadSbus();
  }

  hasChild = (_: number, node: SBUNode) => !!node.children && node.children.length > 0;

  loadSbus() {
    this.userService.getSbus().subscribe(res => {
      if (res.success) {
        this.flatSbus = res.data;
        this.dataSource.data = this.buildTree(res.data);
      }
    });
  }

  buildTree(sbus: SBU[]): SBUNode[] {
    const map = new Map<string, SBUNode>();
    const roots: SBUNode[] = [];

    sbus.forEach(sbu => {
      map.set(sbu.id, { ...sbu, children: [] });
    });

    sbus.forEach(sbu => {
      const node = map.get(sbu.id)!;
      if (sbu.parent?.id) {
        const parent = map.get(sbu.parent.id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  selectSbu(sbu: SBU) {
    this.selectedSbu = sbu;
  }

  editSbu(sbu: SBU) {
    this.editingSbu = sbu;
    this.showAddSbu = false;
    this.sbuForm.patchValue({
      name: sbu.name,
      code: sbu.code,
      description: sbu.description,
      parentId: sbu.parent?.id || null
    });
  }

  addChildSbu() {
    this.showAddSbu = true;
    this.editingSbu = null;
    this.sbuForm.reset();
    this.sbuForm.patchValue({
      parentId: this.selectedSbu?.id || null
    });
  }

  cancelEdit() {
    this.showAddSbu = false;
    this.editingSbu = null;
    this.sbuForm.reset();
  }

  saveSbu() {
    if (this.sbuForm.invalid) return;

    this.loading = true;
    const sbuData = this.sbuForm.value;

    const request = this.editingSbu
      ? this.userService.updateSbu(this.editingSbu.id, sbuData)
      : this.userService.createSbu(sbuData);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.snackBar.open(
            this.editingSbu ? 'SBU updated successfully' : 'SBU created successfully',
            'Close',
            { duration: 3000 }
          );
          this.cancelEdit();
          this.loadSbus();
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  deleteSbu(sbu: SBU) {
    if (confirm(`Are you sure you want to delete "${sbu.name}"? This will also delete all child SBUs.`)) {
      this.userService.deleteSbu(sbu.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('SBU deleted successfully', 'Close', { duration: 3000 });
            if (this.selectedSbu?.id === sbu.id) {
              this.selectedSbu = null;
            }
            this.loadSbus();
          }
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to delete SBU', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
