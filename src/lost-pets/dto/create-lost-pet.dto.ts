import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateLostPetDto {
  @IsString()
  name: string;

  @IsString()
  species: string;

  @IsString()
  breed: string;

  @IsString()
  color: string;

  @IsString()
  size: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsString()
  owner_name: string;

  @IsEmail()
  owner_email: string;

  @IsString()
  owner_phone: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  address: string;

  @IsDateString()
  lost_date: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
