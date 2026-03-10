import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FoundPet } from './entities/found-pet.entity';
import { CreateFoundPetDto } from './dto/create-found-pet.dto';
import { LostPetsService } from '../lost-pets/lost-pets.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class FoundPetsService {
  private readonly logger = new Logger(FoundPetsService.name);

  constructor(
    @InjectRepository(FoundPet)
    private readonly foundPetRepository: Repository<FoundPet>,
    private readonly dataSource: DataSource,
    private readonly lostPetsService: LostPetsService,
    private readonly emailService: EmailService,
  ) {}

  async create(createFoundPetDto: CreateFoundPetDto): Promise<any> {
    const { latitude, longitude, ...petData } = createFoundPetDto;

    const result = await this.dataSource.query(
      `INSERT INTO found_pets
        (species, breed, color, size, description, photo_url,
         finder_name, finder_email, finder_phone,
         location, address, found_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,
               ST_SetSRID(ST_MakePoint($10, $11), 4326),
               $12, $13)
       RETURNING id, species, breed, color, size, description, photo_url,
                 finder_name, finder_email, finder_phone,
                 address, found_date, created_at, updated_at,
                 ST_X(location::geometry) AS longitude,
                 ST_Y(location::geometry) AS latitude`,
      [
        petData.species,
        petData.breed || null,
        petData.color,
        petData.size,
        petData.description,
        petData.photo_url || null,
        petData.finder_name,
        petData.finder_email,
        petData.finder_phone,
        longitude,
        latitude,
        petData.address,
        petData.found_date,
      ],
    );

    const foundPet = result[0];

    this.logger.log(
      `Buscando mascotas perdidas en radio de 500m desde (${latitude}, ${longitude})`,
    );

    const nearbyLostPets = await this.lostPetsService.findNearby(
      latitude,
      longitude,
      500,
    );

    this.logger.log(`Encontradas ${nearbyLostPets.length} mascotas perdidas cercanas`);

    const notifications: Array<{ pet: string; owner: string; distance: string; emailSent: boolean }> = [];

    for (const lostPet of nearbyLostPets) {
      try {
        await this.emailService.sendFoundPetNotification(
          lostPet.owner_email,
          lostPet.owner_name,
          lostPet,
          { ...foundPet, latitude, longitude },
        );
        this.logger.log(
          `Correo enviado a ${lostPet.owner_email} por mascota: ${lostPet.name}`,
        );
        notifications.push({
          pet: lostPet.name,
          owner: lostPet.owner_name,
          distance: `${Math.round(lostPet.distance)}m`,
          emailSent: true,
        });
      } catch (error) {
        this.logger.error(
          `Error enviando correo a ${lostPet.owner_email}: ${error.message}`,
        );
        notifications.push({
          pet: lostPet.name,
          owner: lostPet.owner_name,
          distance: `${Math.round(lostPet.distance)}m`,
          emailSent: false,
        });
      }
    }

    return {
      foundPet,
      nearbyMatches: nearbyLostPets.length,
      notifications,
    };
  }

  async findAll(): Promise<any[]> {
    return this.dataSource.query(
      `SELECT id, species, breed, color, size, description, photo_url,
              finder_name, finder_email, finder_phone,
              address, found_date, created_at, updated_at,
              ST_X(location::geometry) AS longitude,
              ST_Y(location::geometry) AS latitude
       FROM found_pets
       ORDER BY created_at DESC`,
    );
  }
}
