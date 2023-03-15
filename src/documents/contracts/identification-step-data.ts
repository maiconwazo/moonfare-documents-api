import { DocumentTypeEnum } from './document-type.enum';

export interface IdentificationStepData {
  firstName: string;
  familyName: string;
  birthdate: string;
  address: string;
  country: string;
  securityNumber: string;
  documentNumber: string;
  documentType: DocumentTypeEnum;
}
