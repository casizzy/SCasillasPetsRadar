# 🐾 PetRadar API

API REST desarrollada con **NestJS** + **PostgreSQL/PostGIS** para registrar mascotas perdidas y encontradas, con búsqueda geoespacial y notificaciones por correo electrónico.

## 🚀 Tecnologías

- **NestJS** — Framework de Node.js
- **TypeORM** — ORM para PostgreSQL
- **PostGIS** — Extensión geoespacial para PostgreSQL
- **Nodemailer** — Envío de correos electrónicos
- **Mapbox Static API** — Mapas estáticos en los correos
- **Docker** — Contenedorización

---

## ⚙️ Instalación y configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/petradar.git
cd petradar
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=petradar

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu_correo@gmail.com
MAIL_PASS=tu_app_password
MAIL_FROM=PetRadar <tu_correo@gmail.com>
MAIL_TO=notificaciones@petradar.com

MAPBOX_TOKEN=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJleGFtcGxlIn0.example
```

> **Nota Gmail:** Debes activar la verificación en 2 pasos y generar una [App Password](https://myaccount.google.com/apppasswords).

---

## 🐳 Levantar con Docker Compose

```bash
docker-compose up -d
```

Esto levanta:
- PostgreSQL 15 con PostGIS en el puerto `5432`
- La API en el puerto `3000`

---

## 💻 Levantar en local (sin Docker)

### Prerrequisitos
- PostgreSQL con la extensión PostGIS instalada
- Node.js 18+

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run start:dev

# Producción
npm run build && npm run start:prod
```

---

## 📌 Endpoints

### Mascotas Perdidas

#### `POST /lost-pets` — Registrar mascota perdida
```json
{
  "name": "Max",
  "species": "perro",
  "breed": "Labrador",
  "color": "dorado",
  "size": "grande",
  "description": "Collar azul, muy amigable",
  "owner_name": "Juan Pérez",
  "owner_email": "juan@example.com",
  "owner_phone": "477-123-4567",
  "latitude": 21.1236,
  "longitude": -101.6819,
  "address": "Calle Madero 123, León, Gto.",
  "lost_date": "2026-03-09T10:00:00Z"
}
```

#### `GET /lost-pets` — Listar todas las mascotas perdidas

---

### Mascotas Encontradas

#### `POST /found-pets` — Registrar mascota encontrada ⭐
Al registrar, el sistema **automáticamente**:
1. Busca mascotas perdidas activas en un radio de **500 metros** usando `ST_DWithin` de PostGIS
2. Envía un **correo de notificación** a los dueños con datos de la mascota encontrada y un mapa de Mapbox

```json
{
  "species": "perro",
  "breed": "Labrador",
  "color": "dorado",
  "size": "grande",
  "description": "Perro encontrado cerca del parque, con collar",
  "finder_name": "María García",
  "finder_email": "maria@example.com",
  "finder_phone": "477-987-6543",
  "latitude": 21.1239,
  "longitude": -101.6822,
  "address": "Blvd. Torres Landa 456, León, Gto.",
  "found_date": "2026-03-09T14:30:00Z"
}
```

**Respuesta:**
```json
{
  "message": "Mascota encontrada registrada exitosamente",
  "data": { ... },
  "nearbyMatches": 1,
  "notifications": [
    {
      "pet": "Max",
      "owner": "Juan Pérez",
      "distance": "38m",
      "emailSent": true
    }
  ]
}
```

#### `GET /found-pets` — Listar todas las mascotas encontradas

---

## 🗺️ Búsqueda geoespacial

Se utiliza la función `ST_DWithin` de PostGIS con cast a `::geography` para que la distancia sea calculada en **metros reales**:

```sql
SELECT *,
  ST_Distance(
    location::geography,
    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
  ) AS distance
FROM lost_pets
WHERE is_active = true
  AND ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
    500
  )
ORDER BY distance ASC;
```

---

## 📧 Correo de notificación

El correo incluye:
- Datos de la mascota encontrada (especie, raza, color, descripción)
- Datos de contacto de quien la encontró
- Mapa estático de **Mapbox** mostrando:
  - 🔴 Punto rojo: Donde se perdió la mascota
  - 🟢 Punto verde: Donde fue encontrada

---

## 📁 Estructura del proyecto

```
petradar/
├── src/
│   ├── lost-pets/
│   │   ├── dto/create-lost-pet.dto.ts
│   │   ├── entities/lost-pet.entity.ts
│   │   ├── lost-pets.controller.ts
│   │   ├── lost-pets.service.ts
│   │   └── lost-pets.module.ts
│   ├── found-pets/
│   │   ├── dto/create-found-pet.dto.ts
│   │   ├── entities/found-pet.entity.ts
│   │   ├── found-pets.controller.ts
│   │   ├── found-pets.service.ts
│   │   └── found-pets.module.ts
│   ├── email/
│   │   ├── email.service.ts
│   │   └── email.module.ts
│   ├── app.module.ts
│   └── main.ts
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```
