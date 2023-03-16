import { getDataSourceToken } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm/dist';
import { DataSource } from 'typeorm';
import { InstanceEntity } from './entities/onboarding-instance.entity';

export const documentProviders = [
  {
    provide: getRepositoryToken(InstanceEntity),
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(InstanceEntity),
    inject: [getDataSourceToken()],
  },
];
