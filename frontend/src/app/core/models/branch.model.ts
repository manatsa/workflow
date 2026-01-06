export interface Branch {
  id: string;
  code: string;
  name: string;
  description?: string;
  address?: string;
  sbuId: string;
  sbuName?: string;
  sbuCode?: string;
  corporateId?: string;
  corporateName?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
}
