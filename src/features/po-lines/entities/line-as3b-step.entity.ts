import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PoLine } from './po-line.entity';

@Entity('line_as3b_steps')
export class LineAs3bStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PoLine, (l) => l.as3bSteps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'line_id' })
  line: PoLine;

  @Column({ type: 'uuid', name: 'line_id' })
  lineId: string;

  @Column({ type: 'uuid', nullable: true, name: 'stage_id' })
  stageId: string; // FK to stages (nullable — for custom steps)

  @Column({ type: 'varchar', length: 255, name: 'step_name' })
  stepName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 3,
    default: 0,
    name: 'time_per_pc',
  })
  timePerPc: number;

  @Column({ type: 'decimal', precision: 8, scale: 3, default: 0 })
  smv: number;

  @Column({ type: 'int', default: 0, name: 'order_index' })
  orderIndex: number;
}
