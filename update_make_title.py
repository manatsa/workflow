import os

# 1. Update workflow-builder.component.ts - Add isTitle checkbox
path = r'C:\Users\codemaster\Videos\Claude Workspace\Sonarworks\frontend\src\app\features\workflows\workflow-builder\workflow-builder.component.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add isTitle checkbox to the checkbox-row
old_checkboxes = '''<div class="checkbox-row">
                              <mat-checkbox [(ngModel)]="field.required">Required</mat-checkbox>
                              <mat-checkbox [(ngModel)]="field.readOnly">Read Only</mat-checkbox>
                              <mat-checkbox [(ngModel)]="field.hidden">Hidden</mat-checkbox>
                              <mat-checkbox [(ngModel)]="field.isUnique">Unique</mat-checkbox>
                            </div>'''

new_checkboxes = '''<div class="checkbox-row">
                              <mat-checkbox [(ngModel)]="field.required">Required</mat-checkbox>
                              <mat-checkbox [(ngModel)]="field.readOnly">Read Only</mat-checkbox>
                              <mat-checkbox [(ngModel)]="field.hidden">Hidden</mat-checkbox>
                              <mat-checkbox [(ngModel)]="field.isUnique">Unique</mat-checkbox>
                              <mat-checkbox [(ngModel)]="field.isTitle">Make Title</mat-checkbox>
                            </div>'''

content = content.replace(old_checkboxes, new_checkboxes)

# Add isTitle to addField method
old_add_field = '''const field = {
      id: 'temp_' + Date.now(),
      type,
      name: '',
      label: '',
      placeholder: '',
      value: '',
      required: false,
      readOnly: false,
      hidden: false,
      isUnique: false,
      columnSpan: 2,
      displayOrder: this.fields.length,
      fieldGroupId: null,
      optionsText: ''
    };'''

new_add_field = '''const field = {
      id: 'temp_' + Date.now(),
      type,
      name: '',
      label: '',
      placeholder: '',
      value: '',
      required: false,
      readOnly: false,
      hidden: false,
      isUnique: false,
      isTitle: false,
      columnSpan: 2,
      displayOrder: this.fields.length,
      fieldGroupId: null,
      optionsText: ''
    };'''

content = content.replace(old_add_field, new_add_field)

# Add isTitle to loadWorkflow field mapping
old_field_mapping = '''this.fields = workflow.forms[0].fields?.map((f: any) => ({
            ...f,
            // Map backend property names to frontend property names
            type: f.fieldType || f.type,
            value: f.value || f.defaultValue || '',
            required: f.isMandatory ?? f.required ?? false,
            readOnly: f.isReadonly ?? f.readOnly ?? false,
            hidden: f.isHidden ?? f.hidden ?? false,
            isUnique: f.isUnique ?? false,
            optionsText: f.options?.map((o: any) => o.value).join('\\n') || ''
          })) || [];'''

new_field_mapping = '''this.fields = workflow.forms[0].fields?.map((f: any) => ({
            ...f,
            // Map backend property names to frontend property names
            type: f.fieldType || f.type,
            value: f.value || f.defaultValue || '',
            required: f.isMandatory ?? f.required ?? false,
            readOnly: f.isReadonly ?? f.readOnly ?? false,
            hidden: f.isHidden ?? f.hidden ?? false,
            isUnique: f.isUnique ?? false,
            isTitle: f.isTitle ?? false,
            optionsText: f.options?.map((o: any) => o.value).join('\\n') || ''
          })) || [];'''

content = content.replace(old_field_mapping, new_field_mapping)

# Add isTitle to saveWorkflow field mapping
old_save_mapping = '''const processedFields = this.fields.map(f => ({
      ...f,
      // Map frontend property names to backend property names
      fieldType: f.type || f.fieldType,
      defaultValue: f.value || f.defaultValue || '',
      isMandatory: f.required ?? f.isMandatory ?? false,
      isReadonly: f.readOnly ?? f.isReadonly ?? false,
      isHidden: f.hidden ?? f.isHidden ?? false,
      isUnique: f.isUnique ?? false,'''

new_save_mapping = '''const processedFields = this.fields.map(f => ({
      ...f,
      // Map frontend property names to backend property names
      fieldType: f.type || f.fieldType,
      defaultValue: f.value || f.defaultValue || '',
      isMandatory: f.required ?? f.isMandatory ?? false,
      isReadonly: f.readOnly ?? f.isReadonly ?? false,
      isHidden: f.hidden ?? f.isHidden ?? false,
      isUnique: f.isUnique ?? false,
      isTitle: f.isTitle ?? false,'''

content = content.replace(old_save_mapping, new_save_mapping)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated workflow-builder.component.ts')

# 2. Update backend WorkflowField entity
path = r'C:\Users\codemaster\Videos\Claude Workspace\Sonarworks\backend\src\main\java\com\sonarworks\workflow\entity\WorkflowField.java'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add isTitle field after isUnique
old_unique = '''@Column(name = "is_unique")
    private Boolean isUnique = false;'''

new_unique = '''@Column(name = "is_unique")
    private Boolean isUnique = false;

    @Column(name = "is_title")
    private Boolean isTitle = false;'''

content = content.replace(old_unique, new_unique)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated WorkflowField.java entity')

# 3. Update WorkflowFieldDTO
path = r'C:\Users\codemaster\Videos\Claude Workspace\Sonarworks\backend\src\main\java\com\sonarworks\workflow\dto\WorkflowFieldDTO.java'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add isTitle field
if 'private Boolean isTitle' not in content:
    old_unique_dto = 'private Boolean isUnique;'
    new_unique_dto = '''private Boolean isUnique;
    private Boolean isTitle;'''
    content = content.replace(old_unique_dto, new_unique_dto)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated WorkflowFieldDTO.java')
else:
    print('WorkflowFieldDTO.java already has isTitle')

# 4. Update WorkflowInstance entity to add title field
path = r'C:\Users\codemaster\Videos\Claude Workspace\Sonarworks\backend\src\main\java\com\sonarworks\workflow\entity\WorkflowInstance.java'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add title field after referenceNumber if not already present
if 'private String title;' not in content:
    old_reference = '''@Column(name = "reference_number", unique = true)
    private String referenceNumber;'''

    new_reference = '''@Column(name = "reference_number", unique = true)
    private String referenceNumber;

    @Column(name = "title")
    private String title;'''

    content = content.replace(old_reference, new_reference)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated WorkflowInstance.java entity')
else:
    print('WorkflowInstance.java already has title field')

# 5. Update WorkflowInstanceDTO
path = r'C:\Users\codemaster\Videos\Claude Workspace\Sonarworks\backend\src\main\java\com\sonarworks\workflow\dto\WorkflowInstanceDTO.java'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add title field
if 'private String title;' not in content:
    old_reference_dto = 'private String referenceNumber;'
    new_reference_dto = '''private String referenceNumber;
    private String title;'''
    content = content.replace(old_reference_dto, new_reference_dto)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated WorkflowInstanceDTO.java')
else:
    print('WorkflowInstanceDTO.java already has title field')

print('\nAll frontend and backend files updated!')
print('Now need to update WorkflowInstanceService to generate title from isTitle fields.')
