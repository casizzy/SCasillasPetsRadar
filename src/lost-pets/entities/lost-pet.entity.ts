import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('lost_pets')
export class LostPet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  species: string;

  @Column({ type: 'varchar' })
  breed: string;

  @Column({ type: 'varchar' })
  color: string;

  @Column({ type: 'varchar' })
  size: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  photo_url: string;

  @Column({ type: 'varchar' })
  owner_name: string;

  @Column({ type: 'varchar' })
  owner_email: string;

  @Column({ type: 'varchar' })
  owner_phone: string;

  // Stored as geometry but accessed via raw queries
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: any;

  @Column({ type: 'varchar' })
  address: string;

  @Column({ type: 'timestamp' })
  lost_date: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
