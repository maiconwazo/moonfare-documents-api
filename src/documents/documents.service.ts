import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DocumentStepData } from './contracts/document-step-data';
import { DocumentTypeEnum } from './contracts/document-type.enum';
import { IdentificationStepData } from './contracts/identification-step-data';
import { StepStatusEnum } from './entities/onboarding-instance-step.entity';
import { InstanceEntity } from './entities/onboarding-instance.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @Inject('INSTANCE_REPOSITORY')
    private instanceStepRepository: Repository<InstanceEntity>,
  ) {}

  async validateDocumentAsync(instanceId: string) {
    const instance = await this.instanceStepRepository.findOne({
      where: {
        id: instanceId,
      },
      relations: {
        steps: {
          flowStep: true,
        },
      },
    });

    if (!instance) throw new Error(`InstanceId "${instanceId}" doesn't exist`);

    const documentStep = instance.steps.find(
      (s) => s.flowStep.name == 'document',
    );

    const identificationStep = instance.steps.find(
      (s) => s.flowStep.name == 'identification',
    );

    if (!documentStep.data)
      throw new Error(`Document step is empty for instanceId "${instanceId}"`);
    if (!identificationStep.data)
      throw new Error(
        `Identification step is empty for instanceId "${instanceId}"`,
      );

    const identificationData = JSON.parse(
      identificationStep.data,
    ) as IdentificationStepData;

    const documentData = JSON.parse(documentStep.data) as DocumentStepData;

    let isDocumentOk = false;
    switch (documentData.documentType) {
      case DocumentTypeEnum.id:
        isDocumentOk = await this.isIdentificationDocumentValid();
        break;
      case DocumentTypeEnum.passport:
        isDocumentOk = await this.isPassportValid();
        break;
      case DocumentTypeEnum.driverLicense:
        isDocumentOk = await this.isDriverLicenseValid();
        break;
      default:
        throw new Error(
          `Document type "${documentData.documentType}" is not implemented`,
        );
    }

    if (isDocumentOk) {
      documentStep.status = StepStatusEnum.completed;
      this.instanceStepRepository.save(documentStep);
    }
  }

  async isIdentificationDocumentValid(): Promise<boolean> {
    return true;
  }

  async isPassportValid(): Promise<boolean> {
    return true;
  }

  async isDriverLicenseValid(): Promise<boolean> {
    return true;
  }
}
