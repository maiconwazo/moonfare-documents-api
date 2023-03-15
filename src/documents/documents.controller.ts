import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DocumentsService } from './documents.service';

@Controller()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @MessagePattern('validate_document')
  async validateDocument(@Payload() instanceId: string) {
    await this.documentsService.validateDocumentAsync(instanceId);
  }
}
