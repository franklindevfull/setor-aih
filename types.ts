
export interface Patient {
  id: string;
  name: string;
  phone: string;
  cadSus: string; 
  updatedAt: number;
  lastProcedimento?: string;
  isItabuna?: boolean;
  isMPactuado?: boolean;
}

export interface DocumentConfig {
  procedimento: string;
  isItabuna: boolean;
  isMPactuado: boolean;
  deliveryDate: string;
  returnDate: string;
  printTime: string;
}

export type PatientFormData = Omit<Patient, 'id' | 'updatedAt'>;

export interface Procedimento {
  id?: string;
  code: string;
  description: string;
  created_at?: string;
}

export type ProcedimentoFormData = Omit<Procedimento, 'id' | 'created_at'>;
