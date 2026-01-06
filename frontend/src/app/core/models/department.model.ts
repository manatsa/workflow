export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  corporateId?: string;
  corporateName?: string;
  contactEmail?: string;
  contactPhone?: string;
  headOfDepartment?: string;
  isActive: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}
