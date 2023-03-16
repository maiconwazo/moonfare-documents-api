import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './configs/datasource.config';

export const databaseProviders = [
  {
    provide: getDataSourceToken(),
    useFactory: async () => {
      const dataSource = new DataSource(dataSourceOptions);
      await dataSource.initialize();

      return dataSource;
    },
  },
];
