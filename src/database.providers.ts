import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './configs/datasource.config';

config();

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async () => {
      const dataSource = new DataSource(dataSourceOptions);
      await dataSource.initialize();

      return dataSource;
    },
  },
];
