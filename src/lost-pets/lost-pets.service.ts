import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LostPet } from './entities/lost-pet.entity';
import { CreateLostPetDto } from './dto/create-lost-pet.dto';

@Injectable()
export class LostPetsService {
  constructor(
    @InjectRepository(LostPet)
    private readonly lostPetRepository: Repository<LostPet>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createLostPetDto: CreateLostPetDto): Promise<LostPet> {
    const { latitude, longitude, ...petData } = createLostPetDto;

    const result = await this.dataSource.query(
      `INSERT INTO lost_pets 
        (name, species, breed, color, size, description, photo_url,
         owner_name, owner_email, owner_phone, location, address,
         lost_date, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
               ST_SetSRID(ST_MakePoint($11, $12), 4326),
               $13,$14,$15, NOW(), NOW())
       RETURNING id, name, species, breed, color, size, description,
                 photo_url, owner_name, owner_email, owner_phone,
                 address, lost_date, is_active, created_at, updated_at,
                 ST_X(location::geometry) AS longitude,
                 ST_Y(location::geometry) AS latitude`,
      [
        petData.name,
        petData.species,
        petData.breed,
        petData.color,
        petData.size,
        petData.description,
        petData.photo_url || null,
        petData.owner_name,
        petData.owner_email,
        petData.owner_phone,
        longitude,
        latitude,
        petData.address,
        petData.lost_date,
        petData.is_active !== undefined ? petData.is_active : true,
      ],
    );

    return result[0];
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number = 500,
  ): Promise<any[]> {
    const results = await this.dataSource.query(
      `SELECT 
        id, name, species, breed, color, size, description, photo_url,
        owner_name, owner_email, owner_phone, address, lost_date, is_active,
        created_at, updated_at,
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) AS distance
       FROM lost_pets
       WHERE is_active = true
         AND ST_DWithin(
           location::geography,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           $3
         )
       ORDER BY distance ASC`,
      [longitude, latitude, radiusMeters],
    );
    return results;
  }

  async findAll(): Promise<any[]> {
    return this.dataSource.query(
      `SELECT id, name, species, breed, color, size, description, photo_url,
              owner_name, owner_email, owner_phone, address, lost_date,
              is_active, created_at, updated_at,
              ST_X(location::geometry) AS longitude,
              ST_Y(location::geometry) AS latitude
       FROM lost_pets
       ORDER BY created_at DESC`,
    );
  }
}
