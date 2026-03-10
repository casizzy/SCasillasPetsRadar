import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  private buildMapboxUrl(
    lostLat: number,
    lostLng: number,
    foundLat: number,
    foundLng: number,
  ): string {
    const token = this.configService.get('MAPBOX_TOKEN', '');
    if (!token) return '';


    const lostMarker = `pin-s-l+FF0000(${lostLng},${lostLat})`;
    const foundMarker = `pin-s-l+00AA00(${foundLng},${foundLat})`;

    const centerLng = (lostLng + foundLng) / 2;
    const centerLat = (lostLat + foundLat) / 2;

    return (
      `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/` +
      `${lostMarker},${foundMarker}/` +
      `${centerLng},${centerLat},14,0/` +
      `600x400` +
      `?access_token=${token}`
    );
  }

  async sendFoundPetNotification(
    ownerEmail: string,
    ownerName: string,
    lostPet: any,
    foundPet: any,
  ): Promise<void> {
    const mapUrl = this.buildMapboxUrl(
      parseFloat(lostPet.latitude),
      parseFloat(lostPet.longitude),
      parseFloat(foundPet.latitude),
      parseFloat(foundPet.longitude),
    );

    this.logger.log(`Mapbox URL: ${mapUrl}`);

    const mailTo =
      this.configService.get('MAIL_TO') ||
      ownerEmail;

    const mapSection = mapUrl
      ? `<div style="margin-top:16px;">
           <h3 style="color:#333;">📍 Mapa de ubicaciones</h3>
           <p style="color:#666; font-size:13px;">
             🔴 Rojo = Donde se perdió &nbsp;|&nbsp; 🟢 Verde = Donde fue encontrada
           </p>
           <img src="${mapUrl}" alt="Mapa de ubicaciones" 
                style="width:100%; max-width:600px; border-radius:8px; border:1px solid #ddd;" />
         </div>`
      : `<p><strong>Coordenadas donde se encontró:</strong> 
           Lat: ${foundPet.latitude}, Lng: ${foundPet.longitude}</p>
         <p><strong>Coordenadas donde se perdió:</strong> 
           Lat: ${lostPet.latitude}, Lng: ${lostPet.longitude}</p>`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin:0; padding:0; }
          .container { max-width:640px; margin:24px auto; background:#fff; 
                       border-radius:12px; overflow:hidden; 
                       box-shadow:0 2px 8px rgba(0,0,0,0.1); }
          .header { background:#4CAF50; color:#fff; padding:24px; text-align:center; }
          .header h1 { margin:0; font-size:26px; }
          .header p { margin:6px 0 0; font-size:14px; opacity:0.9; }
          .body { padding:24px; }
          .section { background:#f9f9f9; border-left:4px solid #4CAF50; 
                     padding:14px; border-radius:4px; margin-bottom:16px; }
          .section h2 { margin:0 0 10px; color:#333; font-size:16px; }
          .section p { margin:4px 0; color:#555; font-size:14px; }
          .contact-box { background:#e8f5e9; border:1px solid #a5d6a7; 
                         border-radius:8px; padding:14px; margin-top:16px; }
          .footer { background:#f0f0f0; text-align:center; padding:14px; 
                    font-size:12px; color:#888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐾 PetRadar — ¡Posible coincidencia!</h1>
            <p>Se encontró una mascota cerca de donde se perdió la tuya</p>
          </div>
          <div class="body">
            <p>Hola <strong>${ownerName}</strong>,</p>
            <p>Alguien reportó una mascota encontrada a <strong>menos de 500 metros</strong> 
               del lugar donde se perdió <strong>${lostPet.name}</strong>. 
               ¡Podría ser tu mascota!</p>

            <div class="section">
              <h2>🐶 Mascota encontrada</h2>
              <p><strong>Especie:</strong> ${foundPet.species}</p>
              <p><strong>Raza:</strong> ${foundPet.breed || 'No identificada'}</p>
              <p><strong>Color:</strong> ${foundPet.color}</p>
              <p><strong>Tamaño:</strong> ${foundPet.size}</p>
              <p><strong>Descripción:</strong> ${foundPet.description}</p>
              <p><strong>Dirección:</strong> ${foundPet.address}</p>
              <p><strong>Fecha encontrada:</strong> ${new Date(foundPet.found_date).toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>
              ${foundPet.photo_url ? `<p><strong>Foto:</strong> <a href="${foundPet.photo_url}">Ver foto</a></p>` : ''}
            </div>

            <div class="contact-box">
              <h2 style="margin:0 0 10px; color:#2e7d32;">📞 Contactar a quien la encontró</h2>
              <p><strong>Nombre:</strong> ${foundPet.finder_name}</p>
              <p><strong>Correo:</strong> <a href="mailto:${foundPet.finder_email}">${foundPet.finder_email}</a></p>
              <p><strong>Teléfono:</strong> <a href="tel:${foundPet.finder_phone}">${foundPet.finder_phone}</a></p>
            </div>

            ${mapSection}
          </div>
          <div class="footer">
            Este correo fue generado automáticamente por PetRadar 🐾<br/>
            Si ya encontraste a tu mascota, actualiza su estado en el sistema.
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM', 'PetRadar <noreply@petradar.com>'),
      to: mailTo,
      subject: `🐾 PetRadar: Posible avistamiento de ${lostPet.name} cerca de ti`,
      html,
    });
  }
}