import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { DocumentStepData } from './contracts/document-step-data';
import { DocumentTypeEnum } from './contracts/document-type.enum';
import { IdentificationStepData } from './contracts/identification-step-data';
import { StepStatusEnum } from './entities/onboarding-instance-step.entity';
import { InstanceEntity } from './entities/onboarding-instance.entity';
import { v4 } from 'uuid';
import { spawn } from 'child_process';
import { format, parse, parseISO } from 'date-fns';
import { InjectRepository } from '@nestjs/typeorm/dist';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(InstanceEntity)
    private instanceStepRepository: Repository<InstanceEntity>,
  ) {}

  public async validateDocumentAsync(instanceId: string) {
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
    const response = await fetch(documentData.documentUrl).then((res) => res);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempFolder = './temp';
    if (!existsSync(tempFolder)) mkdirSync(tempFolder);

    const documentPath = join(tempFolder, v4());

    writeFileSync(documentPath, buffer);
    let isDocumentOk = false;
    try {
      switch (identificationData.documentType) {
        case DocumentTypeEnum.id:
          isDocumentOk = await this.isDocumentValid(
            'ocr_id',
            (outputOCR, identificationStepData) =>
              this.validateId(outputOCR, identificationStepData),
            identificationData,
            documentPath,
          );
          break;
        case DocumentTypeEnum.passport:
          isDocumentOk = await this.isDocumentValid(
            'ocr_passport',
            (outputOCR, identificationStepData) =>
              this.validatePassport(outputOCR, identificationStepData),
            identificationData,
            documentPath,
          );
          break;
        case DocumentTypeEnum.driverLicense:
          isDocumentOk = await this.isDocumentValid(
            'ocr_driver_license',
            (outputOCR, identificationStepData) =>
              this.validateDriverLicense(outputOCR, identificationStepData),
            identificationData,
            documentPath,
          );
          break;
        default:
          throw new Error(
            `Document type "${identificationData.documentType}" is not implemented`,
          );
      }
    } catch {
      isDocumentOk = false;
    } finally {
      unlinkSync(documentPath);
    }

    documentStep.updatedAt = new Date();
    documentStep.status = isDocumentOk
      ? StepStatusEnum.completed
      : StepStatusEnum.failed;

    this.instanceStepRepository.save(instance);
  }

  private async isDocumentValid(
    scriptName: string,
    validationMethod: (
      outputOCR: string,
      identificationData: IdentificationStepData,
    ) => boolean,
    identificationStepData: IdentificationStepData,
    documentPath: string,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const scriptPath = join('assets', 'scripts', scriptName, 'main.py');
        const proc = spawn(process.env.PYTHON, [
          scriptPath,
          `-i ${documentPath}`,
        ]);

        let result = '';
        proc.stdout.on('data', (data) => {
          result += data;
        });

        proc.stdout.on('error', (err) => {
          reject(err);
        });

        proc.stdout.on('end', () => {
          if (!result) resolve(false);
          else resolve(validationMethod(result.trim(), identificationStepData));
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private validateId(
    outputOCR: string,
    identificationStepData: IdentificationStepData,
  ) {
    return true;
  }

  private validatePassport(
    outputOCR: string,
    identificationStepData: IdentificationStepData,
  ) {
    const lines = outputOCR.split('\n');

    const firstLine = lines[0];
    const ind = firstLine.slice(0, 1); // P, indicating a passport

    if (ind.toUpperCase() != 'P') return false;
    const type = firstLine.slice(1, 2); // Type (for countries that distinguish between different types of passports)
    const country = firstLine.slice(2, 5); // Issuing country or organization (ISO 3166-1 alpha-3 code with modifications)
    const fullName = firstLine.slice(5, 43).replace(/</g, ' ').trim(); // Surname, followed by two filler characters, followed by given names. Given names are separated by single filler characters. Note that some countries does not differentiate between surname and given name

    // console.log(firstLine);
    // console.log(ind);
    // console.log(type);
    // console.log(country);
    // console.log(fullName);

    const secondLine = lines[1];
    const passportNumber = secondLine.slice(0, 8); // Passport number
    const firstCheckDigit = secondLine.slice(9, 10); // Check digit over digits 1–9
    const nationality = secondLine.slice(10, 13); // Nationality (ISO 3166-1 alpha-3 code with modifications)
    const birthdate = secondLine.slice(13, 19); // Date of birth (YYMMDD)
    const secondCheckDigit = secondLine.slice(19, 20); // Check digit over digits 14–19
    const sex = secondLine.slice(20, 21); // Sex (M, F or < for male, female or unspecified)
    const expirationDate = secondLine.slice(21, 27); // Expiration date of passport (YYMMDD)
    const thirdCheckDigit = secondLine.slice(27, 28); // Check digit over digits 22–27
    const personalNumber = secondLine.slice(28, 43); // Personal number (may be used by the issuing country as it desires)
    const fourthCheckDigit = secondLine.slice(43, 44); // Check digit over digits 29–42 (may be < if all characters are <)
    const fifthCheckDigit = secondLine.slice(44, 45); // Check digit over digits 1–10, 14–20, and 22–43

    // console.log(secondLine);
    // console.log(passportNumber);
    // console.log(firstCheckDigit);
    // console.log(nationality);
    // console.log(birthdate);
    // console.log(secondCheckDigit);
    // console.log(sex);
    // console.log(expirationDate);
    // console.log(thirdCheckDigit);
    // console.log(personalNumber);
    // console.log(fourthCheckDigit);
    // console.log(fifthCheckDigit);

    const parsedDate = parseISO(identificationStepData.birthdate);
    if (
      fullName
        .toUpperCase()
        .indexOf(identificationStepData.firstName.toUpperCase()) < 0
    )
      return false;
    if (
      fullName
        .toUpperCase()
        .indexOf(identificationStepData.familyName.toUpperCase()) < 0
    )
      return false;
    if (format(parsedDate, 'yyMMdd') != birthdate) return false;
    if (identificationStepData.documentNumber != passportNumber) return false;

    return true;
  }

  private validateDriverLicense(
    outputOCR: string,
    identificationStepData: IdentificationStepData,
  ) {
    const infosFromDocument = outputOCR
      .split('\n')
      .filter((x) => x.trim())
      .map((x) => x.trim());

    let isOk = true;
    const entries = Object.entries(identificationStepData);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      switch (entry[0]) {
        case 'familyName':
          const familyName = entry[1].trim();
          isOk = this.isCompatible(familyName, infosFromDocument, '1.', '1');
          break;
        case 'firstName':
          const firstName = entry[1].trim();
          isOk = this.isCompatible(firstName, infosFromDocument, '2.', '2');
          break;
        case 'birthdate':
          const parsedDate = parse(entry[1], 'dd/MM/yyyy', new Date());
          const formatedDate = format(parsedDate, 'dd.MM.yy');

          isOk = this.isCompatible(formatedDate, infosFromDocument, '3.', '3');
          break;
        case 'documentNumber':
          isOk = this.isCompatible(entry[1], infosFromDocument, '5.', '5');
          break;
      }

      if (!isOk) break;
    }

    return isOk;
  }

  private isCompatible(
    value: any,
    infosFromDocument: string[],
    firstPattern: string,
    secondPattern: string,
  ) {
    if (!value) return false;

    const perfectMatch = infosFromDocument.find((x) =>
      x.startsWith(firstPattern),
    );

    if (perfectMatch) {
      return perfectMatch.indexOf(value) > 0;
    }

    const possibleMatch = infosFromDocument.find((x) =>
      x.startsWith(secondPattern),
    );

    if (possibleMatch) {
      if (possibleMatch.indexOf(value) > 0) return true;
    }

    return infosFromDocument.some((x) => x.indexOf(value) > -1);
  }
}
