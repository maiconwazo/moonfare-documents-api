import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OneToMany } from 'typeorm/decorator/relations/OneToMany';
import { FlowEntity } from './onboarding-flow.entity';
import { InstanceStepEntity } from './onboarding-instance-step.entity';

@Entity('flowStep')
export class FlowStepEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @PrimaryGeneratedColumn('uuid')
  public flowId: string;

  @Column()
  public name: string;

  @Column()
  public order: number;

  @Column()
  public createdAt: Date;

  @Column()
  public updatedAt: Date;

  @ManyToOne(() => FlowEntity, (flow) => flow.steps)
  public flow: FlowEntity;

  @OneToMany(() => InstanceStepEntity, (instanceStep) => instanceStep.flowStep)
  public instanceSteps: InstanceStepEntity[];
}
