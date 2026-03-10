import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('found_pets')
export class FoundPet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  species: string;

  @Column({ type: 'varchar', nullable: true })
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
  finder_name: string;

  @Column({ type: 'varchar' })
  finder_email: string;

  @Column({ type: 'varchar' })
  finder_phone: string;

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
  found_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
