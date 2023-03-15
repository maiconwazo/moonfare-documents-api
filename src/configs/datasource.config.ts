import { DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { InstanceStepEntity } from 'src/documents/entities/onboarding-instance-step.entity';
import { InstanceEntity } from 'src/documents/entities/onboarding-instance.entity';
import { FlowEntity } from 'src/documents/entities/onboarding-flow.entity';
import { FlowStepEntity } from 'src/documents/entities/onboarding-flow-step.entity';

config();

export const dataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  entities: [InstanceStepEntity, InstanceEntity, FlowEntity, FlowStepEntity],
  migrationsRun: false,
} as DataSourceOptions;
