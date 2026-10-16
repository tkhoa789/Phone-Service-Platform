import type {
  WarrantyTicketDto,
  CreateWarrantyTicketCommand,
  WarrantyCheckResultDto,
  RejectWarrantyCommand,
  TransferToInHouseRepairCommand,
  ReplaceDeviceCommand,
  SendToVendorCommand,
  DeliverToCustomerCommand
} from '../types/api.types';

export interface IWarrantyService {
  getWarranties(params?: { pageIndex?: number; pageSize?: number; search?: string }): Promise<{ items: WarrantyTicketDto[]; totalCount: number }>;
  getWarrantyById(id: string): Promise<WarrantyTicketDto>;
  checkWarrantyStatus(imei: string): Promise<WarrantyCheckResultDto>;
  createWarrantyTicket(command: CreateWarrantyTicketCommand): Promise<string>;
  updateWarrantyStatus(id: string, status: string, action: string, description: string | null, newImei: string | null, rowVersion: string): Promise<boolean>;
  deleteWarrantyTicket(id: string, rowVersion?: string): Promise<boolean>;
  rejectWarranty(command: RejectWarrantyCommand): Promise<boolean>;
  transferToInHouseRepair(command: TransferToInHouseRepairCommand): Promise<string>;
  replaceWarrantyDevice(command: ReplaceDeviceCommand): Promise<boolean>;
  sendWarrantyToVendor(command: SendToVendorCommand): Promise<boolean>;
  deliverWarrantyToCustomer(command: DeliverToCustomerCommand): Promise<boolean>;
}
