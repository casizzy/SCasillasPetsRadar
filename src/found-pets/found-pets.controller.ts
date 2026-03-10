import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { FoundPetsService } from './found-pets.service';
import { CreateFoundPetDto } from './dto/create-found-pet.dto';

@Controller('found-pets')
export class FoundPetsController {
  constructor(private readonly foundPetsService: FoundPetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFoundPetDto: CreateFoundPetDto) {
    const result = await this.foundPetsService.create(createFoundPetDto);
    return {
      message: 'Mascota encontrada registrada exitosamente',
      data: result.foundPet,
      nearbyMatches: result.nearbyMatches,
      notifications: result.notifications,
    };
  }

  @Get()
  async findAll() {
    const pets = await this.foundPetsService.findAll();
    return {
      message: 'Mascotas encontradas registradas',
      count: pets.length,
      data: pets,
    };
  }
}
