import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LostPetsModule } from './lost-pets/lost-pets.module';
import { FoundPetsModule } from './found-pets/found-pets.module';
import { EmailModule } from './email/email.module';
import { LostPet } from './lost-pets/entities/lost-pet.entity';
import { FoundPet } from './found-pets/entities/found-pet.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'petradar'),
        entities: [LostPet, FoundPet],
        synchronize: true, // Solo para desarrollo
        logging: false,
      }),
      inject: [ConfigService],
    }),
    LostPetsModule,
    FoundPetsModule,
    EmailModule,
  ],
})
export class AppModule {}
