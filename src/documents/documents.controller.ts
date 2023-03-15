import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class DocumentsController {
  @MessagePattern('validate_document')
  async validateDocument(@Payload() instanceId: string) {}
}
