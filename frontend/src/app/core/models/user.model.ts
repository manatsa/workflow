export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  staffId?: string;
  department?: string;
  userType: UserType;
  isActive: boolean;
  enabled?: boolean;
  isLocked: boolean;
  locked?: boolean;
  lockReason?: string;
  lastLogin?: string;
  passwordChangedAt?: string;
  mustChangePassword: boolean;
  roleIds: string[];
  corporateIds?: string[];
  sbuIds: string[];
  branchIds?: string[];
  departmentIds?: string[];
  roles: any[];
  privileges: string[];
  corporates?: Corporate[];
  sbus?: SBU[];
  branches?: Branch[];
  profilePicture?: string;
  createdAt: string;
  createdBy: string;
}

export interface Corporate {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  sbuId: string;
  sbuName?: string;
  isActive: boolean;
}

export enum UserType {
  SYSTEM = 'SYSTEM',
  STAFF = 'STAFF',
  MANAGER = 'MANAGER',
  EXTERNAL = 'EXTERNAL'
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  staffId?: string;
  department?: string;
  userType: UserType;
  roles: string[];
  privileges: string[];
  corporateIds: string[];
  sbuIds: string[];
  branchIds: string[];
  mustChangePassword: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  privilegeIds: string[];
  privileges: string[];
}

export interface Privilege {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystemPrivilege: boolean;
}

export interface SBU {
  id: string;
  code: string;
  name: string;
  description: string;
  corporateId?: string;
  corporateName?: string;
  corporateCode?: string;
  parentId?: string;
  parentName?: string;
  parent?: SBU;
  isRoot: boolean;
  isActive: boolean;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  children?: SBU[];
  branches?: Branch[];
}
