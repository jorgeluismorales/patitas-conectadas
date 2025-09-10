# 🐾 Patitas Conectadas

Una plataforma colaborativa desarrollada completamente con **inteligencia artificial** para ayudar a reunir mascotas perdidas con sus familias. Esta aplicación web permite a los usuarios publicar información sobre mascotas perdidas o encontradas, facilitando la conexión entre quienes buscan y quienes encuentran.

> 🤖 **Proyecto 100% desarrollado con IA** - Este proyecto fue creado íntegramente utilizando herramientas de inteligencia artificial, específicamente **v0.dev** y **GitHub Copilot** mediante la metodología **vibecoding**.

## 🌟 Características

- **Publicaciones de mascotas perdidas y encontradas**
- **Sistema de búsqueda y filtros avanzados**
- **Autenticación segura de usuarios**
- **Panel de administración**
- **Interfaz responsive y moderna**

## 🚀 Demo

🔗 **[Ver Demo en Vivo](https://patitasconectadas.vercel.app)** *(Actualiza este enlace con tu URL de producción)*

## 🛠️ Stack Tecnológico

### Frontend
- **[Next.js 14](https://nextjs.org/)** - Framework de React con App Router
- **[React 18](https://reactjs.org/)** - Biblioteca de interfaz de usuario
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework de CSS utilitario
- **[Radix UI](https://www.radix-ui.com/)** - Componentes de interfaz primitivos
- **[Lucide React](https://lucide.dev/)** - Iconos modernos
- **[React Hook Form](https://react-hook-form.com/)** - Gestión de formularios
- **[Zod](https://zod.dev/)** - Validación de esquemas
- **[next-intl](https://next-intl-docs.vercel.app/)** - Internacionalización

### Backend & Base de Datos
- **[Supabase](https://supabase.com/)** - Backend as a Service (PostgreSQL)
  - Autenticación
  - Base de datos en tiempo real
  - Almacenamiento de archivos
  - APIs automáticas

### Herramientas de Desarrollo
- **[pnpm](https://pnpm.io/)** - Gestor de paquetes
- **[ESLint](https://eslint.org/)** - Linting de código
- **[PostCSS](https://postcss.org/)** - Procesamiento de CSS

### Deployment & Analytics
- **[Vercel](https://vercel.com/)** - Plataforma de deployment
- **[Vercel Analytics](https://vercel.com/analytics)** - Analíticas web

## 🤖 Desarrollo con Inteligencia Artificial

### Metodología: Vibecoding
Este proyecto fue desarrollado utilizando la metodología **vibecoding**, donde se aprovechan las capacidades de la IA para generar código funcional y completo sin intervención humana tradicional.

### Herramientas de IA Utilizadas

#### 🎨 **v0.dev by Vercel**
- **Generación de componentes UI** completos con Tailwind CSS y Radix UI
- **Diseño responsive** automático
- **Código TypeScript** optimizado
- **Integración perfecta** con el ecosistema Next.js

#### 💻 **GitHub Copilot**
- **Autocompletado inteligente** de funciones y lógica de negocio
- **Generación de hooks** personalizados
- **Implementación de servicios** de Supabase
- **Optimización de rendimiento** automática

### Proceso de Desarrollo AI-First

1. **Conceptualización**: Definición del proyecto mediante prompts descriptivos
2. **Diseño UI**: Generación de interfaces con v0.dev
3. **Implementación**: Desarrollo de lógica con GitHub Copilot
4. **Integración**: Conexión automática de componentes y servicios
5. **Optimización**: Refinamiento continuo mediante IA

## 📦 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- pnpm (recomendado) o npm
- Cuenta en Supabase

### 1. Clonar el repositorio

```bash
git clone https://github.com/jorgeluismorales/patitas-conectadas.git
cd patitas-conectadas
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configuración de variables de entorno

El proyecto incluye un archivo `.env.example` con todas las variables necesarias. Para configurar tu entorno:

```bash
# Copia el archivo de ejemplo
cp .env.example .env.local
```

Luego completa los valores en `.env.local`:

```env
# URL de redirección para confirmación/email (opcional en producción)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Variables principales de Supabase (las más importantes)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
SUPABASE_JWT_SECRET=tu_jwt_secret_aqui

# Variables de PostgreSQL (generadas automáticamente por Supabase)
POSTGRES_URL=postgresql://postgres:[TU-PASSWORD]@db.[TU-REF].supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:[TU-PASSWORD]@db.[TU-REF].supabase.co:5432/postgres?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://postgres:[TU-PASSWORD]@db.[TU-REF].supabase.co:5432/postgres
POSTGRES_PASSWORD=tu_password_de_bd
POSTGRES_DATABASE=postgres
POSTGRES_HOST=db.[TU-REF].supabase.co
POSTGRES_USER=postgres
```

> 💡 **Tip**: Puedes obtener todas estas variables desde el dashboard de tu proyecto en Supabase → Settings → API

### 4. Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ejecuta las migraciones SQL necesarias para crear las tablas:
   - `profiles` (perfiles de usuario)
   - `publications` (publicaciones de mascotas)
   - Configurar policies de RLS (Row Level Security)
3. Configura el almacenamiento para imágenes
4. Habilita la autenticación por email

### 5. Ejecutar en desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Scripts Disponibles

```bash
# Desarrollo
pnpm dev

# Construcción para producción
pnpm build

# Iniciar servidor de producción
pnpm start

# Linting
pnpm lint
```

## 📁 Arquitectura del Proyecto

```
patitas-conectadas/
├── app/                          # App Router de Next.js
│   ├── [locale]/                # Rutas internacionalizadas
│   │   ├── admin/              # Panel de administración
│   │   ├── auth/               # Autenticación
│   │   ├── publicar/           # Crear publicaciones
│   │   └── publicacion/        # Ver publicaciones
│   ├── globals.css             # Estilos globales
│   ├── layout.tsx              # Layout principal
│   └── page.tsx                # Página de inicio
├── components/                   # Componentes reutilizables
│   ├── ui/                     # Componentes de UI base (generados con v0)
│   ├── admin/                  # Componentes del admin
│   ├── auth-provider.tsx       # Proveedor de autenticación
│   ├── pet-card.tsx           # Tarjeta de mascota
│   └── search-filters.tsx      # Filtros de búsqueda
├── lib/                         # Utilidades y servicios
│   ├── supabase/              # Configuración de Supabase
│   ├── admin-service.ts       # Servicios de administración
│   └── utils.ts               # Utilidades generales
├── hooks/                       # Hooks personalizados
├── messages/                    # Archivos de internacionalización
└── public/                      # Archivos estáticos
```

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio con Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push a main

```bash
# O usando Vercel CLI
vercel --prod
```

## 🔐 Configuración de Seguridad

- **Row Level Security (RLS)** habilitado en Supabase
- **Validación de formularios** con Zod
- **Sanitización de inputs** del usuario
- **HTTPS** obligatorio en producción
- **Variables de entorno** para datos sensibles