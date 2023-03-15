import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { documentProviders } from './documents.providers';

@Module({
  providers: [DocumentsService, , ...documentProviders],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
