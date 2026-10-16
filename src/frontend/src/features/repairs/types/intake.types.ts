export interface IntakeCheckpoint {
  checkPointName: string;
  isPassed: boolean;
  issueDescription?: string;
}

export interface CustomQcItem {
  id: string;
  name: string;
  isPassed: boolean;
  notes?: string;
}

export interface IntakeState {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;

  deviceVariantId?: string;
  deviceModel?: string;
  customModel?: string;
  isCustomModel?: boolean;
  imei?: string;

  technicianId?: string;
  technicianName?: string;

  problemDescription?: string;
  cosmeticCondition?: string;
  isPowerOff?: boolean;
  checkpoints?: IntakeCheckpoint[];

  // Advanced QC notes & customization
  isQcCustomNotesActive?: boolean;
  qcCustomNotes?: string;
  qcBatteryHealth?: string;
  qcWaterResistance?: string;
  qcSealCondition?: string;
  qcIncludedAccessories?: string;
  qcCustomItems?: CustomQcItem[];

  estimatedCost?: number;
  isQuoteLater?: boolean;

  depositAmount?: number;
  depositTransactionCode?: string;
  paymentMethodId?: string;

  ticketId?: string;
  ticketCode?: string;
}
