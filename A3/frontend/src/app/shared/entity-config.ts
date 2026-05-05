export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'time';
  options?: string[];
  required?: boolean;
  readonlyOnEdit?: boolean;
  min?: number;
  placeholder?: string;
}

export interface ColDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'badge';
  badgeColor?: (val: any) => string;
}

export interface EntityConfig {
  title: string;
  icon: string;
  apiEntity: string;
  columns: ColDef[];
  fields: FieldDef[];
  pkKeys: string[];         // primary key field(s)
  deleteId: (row: any) => string;   // builds URL segment after entity path
  updateId?: (row: any) => string;  // if different from deleteId
  canEdit?: boolean;        // false for join-only tables
}
