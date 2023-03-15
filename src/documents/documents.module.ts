import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { documentProviders } from './documents.providers';
import { DatabaseModule } from 'src/database.module';

@Module({
  providers: [...documentProviders, DocumentsService],
  controllers: [DocumentsController],
  imports: [DatabaseModule],
})
export class DocumentsModule {}
