import { serviceService } from './serviceService';
import type { IWarrantyService } from './IWarrantyService';
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

export class RealWarrantyService implements IWarrantyService {
  async getWarranties(params?: { pageIndex?: number; pageSize?: number; search?: string }): Promise<{ items: WarrantyTicketDto[]; totalCount: number }> {
    return serviceService.getWarranties(params);
  }

  async getWarrantyById(id: string): Promise<WarrantyTicketDto> {
    return serviceService.getWarrantyById(id);
  }

  async checkWarrantyStatus(imei: string): Promise<WarrantyCheckResultDto> {
    return serviceService.checkWarrantyStatus(imei);
  }

  async createWarrantyTicket(command: CreateWarrantyTicketCommand): Promise<string> {
    return serviceService.createWarrantyTicket(command);
  }

  async updateWarrantyStatus(
    id: string,
    status: string,
    action: string,
    description: string | null,
    newImei: string | null,
    rowVersion: string
  ): Promise<boolean> {
    return serviceService.updateWarrantyStatus(id, status, action, description, newImei, rowVersion);
  }

  async deleteWarrantyTicket(id: string, rowVersion?: string): Promise<boolean> {
    return serviceService.deleteWarrantyTicket(id, rowVersion);
  }

  async rejectWarranty(command: RejectWarrantyCommand): Promise<boolean> {
    return serviceService.rejectWarranty(command);
  }

  async transferToInHouseRepair(command: TransferToInHouseRepairCommand): Promise<string> {
    return serviceService.transferToInHouseRepair(command);
  }

  async replaceWarrantyDevice(command: ReplaceDeviceCommand): Promise<boolean> {
    return serviceService.replaceWarrantyDevice(command);
  }

  async sendWarrantyToVendor(command: SendToVendorCommand): Promise<boolean> {
    return serviceService.sendWarrantyToVendor(command);
  }

  async deliverWarrantyToCustomer(command: DeliverToCustomerCommand): Promise<boolean> {
    return serviceService.deliverWarrantyToCustomer(command);
  }
}

export const realWarrantyService = new RealWarrantyService();
