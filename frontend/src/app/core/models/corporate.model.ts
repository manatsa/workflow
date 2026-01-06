import { SBU } from './user.model';

export enum CorporateType {
  PRIVATE_LIMITED = 'PRIVATE_LIMITED',
  SOLE_TRADER = 'SOLE_TRADER',
  PUBLIC = 'PUBLIC',
  PARTNERSHIP = 'PARTNERSHIP',
  NGO = 'NGO',
  GOVERNMENT = 'GOVERNMENT'
}

export const CorporateTypeLabels: { [key in CorporateType]: string } = {
  [CorporateType.PRIVATE_LIMITED]: 'Private Limited',
  [CorporateType.SOLE_TRADER]: 'Sole Trader',
  [CorporateType.PUBLIC]: 'Public',
  [CorporateType.PARTNERSHIP]: 'Partnership',
  [CorporateType.NGO]: 'NGO',
  [CorporateType.GOVERNMENT]: 'Government'
};

export interface Corporate {
  id: string;
  code: string;
  name: string;
  description?: string;
  address?: string;
  categoryId?: string;
  categoryName?: string;
  corporateType?: CorporateType;
  corporateTypeDisplayName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  isActive: boolean;
  sbus?: SBU[];
}
