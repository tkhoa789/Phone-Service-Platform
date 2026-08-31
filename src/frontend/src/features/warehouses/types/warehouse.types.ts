export interface WarehouseDto {
  id: string;
  branchId: string;
  branchName: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface CreateWarehouseCommand {
  branchId: string;
  code: string;
  name: string;
}

export interface UpdateWarehouseCommand {
  id: string;
  name: string;
}

export interface WarehouseListFilterParams {
  keyword?: string;
  page: number;
  pageSize: number;
  branchId?: string;
}
