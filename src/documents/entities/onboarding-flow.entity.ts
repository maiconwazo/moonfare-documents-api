import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { FlowStepEntity } from './onboarding-flow-step.entity';
import { InstanceEntity } from './onboarding-instance.entity';

@Entity('flow')
export class FlowEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public name: string;

  @Column()
  public isDefault: boolean;

  @Column()
  public createdAt: Date;

  @Column()
  public updatedAt: Date;

  @OneToMany(() => FlowStepEntity, (step) => step.flow)
  public steps: FlowStepEntity[];

  @OneToMany(() => InstanceEntity, (instance) => instance.flow)
  public instances: InstanceEntity[];
}
