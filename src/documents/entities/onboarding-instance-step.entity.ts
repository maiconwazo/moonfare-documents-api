import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FlowStepEntity } from './onboarding-flow-step.entity';
import { InstanceEntity } from './onboarding-instance.entity';

export enum StepStatusEnum {
  started = 'started',
  processing = 'processing',
  failed = 'failed',
  completed = 'completed',
}

@Entity('instanceStep')
export class InstanceStepEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public status: StepStatusEnum;

  @Column()
  public data: string;

  @Column()
  public createdAt: Date;

  @Column()
  public updatedAt: Date;

  @ManyToOne(() => InstanceEntity, (instance) => instance.steps)
  public instance: InstanceEntity;

  @ManyToOne(() => FlowStepEntity, (flowStep) => flowStep.instanceSteps)
  @JoinColumn([
    { name: 'flowId', referencedColumnName: 'flowId' },
    { name: 'flowStepId', referencedColumnName: 'id' },
  ])
  public flowStep: FlowStepEntity;
}
