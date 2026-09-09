<div align="center">

  # 🛰️ Radar 360° Mobile

  <p align="center">
    <img src="https://img.shields.io/badge/Status-En%20Producci%C3%B3n-success?style=for-the-badge&logo=appveyor" alt="Status" />
    <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-blue?style=for-the-badge&logo=expo" alt="Platform" />
    <img src="https://img.shields.io/badge/React%20Native-Expo-61DAFB?style=for-the-badge&logo=react" alt="React Native" />
    <img src="https://img.shields.io/badge/CI%2FCD-EAS%20Updates-orange?style=for-the-badge&logo=expo" alt="EAS" />
  </p>

  <p align="center">
    <b>Torre de control móvil de alto rendimiento para el monitoreo, rutas y auditoría de asesores en campo.</b>
  </p>

</div>

---

#  Radar 360° Mobile

> Aplicación móvil de alto rendimiento desarrollada en **React Native (Expo)** para la gestión, control operativo y monitoreo en tiempo real de asesores en campo. Diseñada para ofrecer una experiencia fluida, robusta y conectada al ecosistema cloud de **Radar 360°**.

---

##  Arquitectura y Stack Tecnológico
- **Framework:** React Native con Expo (Optimizado para Android e iOS).
- **Capa de Red Resiliente:** Cliente HTTP adaptado con manejo inteligente de *timeouts*, interceptación automática de tokens y control de metadatos corporativos (`x-client-platform: mobile` y control de sedes).
- **Seguridad de Datos:** Almacenamiento cifrado de credenciales y tokens JWT mediante `expo-secure-store`.
- **Despliegue Continuo (CI/CD):** Integración nativa con **EAS (Expo Application Services)** para distribución de binarios y actualizaciones en caliente (OTA).

---

##  Características Principales
- **Rutas y Gestión Inteligente:** Permite a los asesores visualizar su recorrido diario, filtrar estados de visitas (*Gestionado, Reprogramado, No encontrado, Cancelado*) y registrar operaciones con precisión.
- **Auditoría y Evidencias en Campo:** Captura de coordenadas GPS exactas, fotografías y notas de respaldo directamente desde el dispositivo móvil.
- **Actualizaciones Silenciosas (OTA):** Capacidad de empujar parches de código y mejoras visuales a toda la flota en segundos sin requerir nuevas instalaciones de APKs.
- **Sincronización Multiplataforma:** Validación exitosa en entornos Android e iOS con tiempos de respuesta óptimos y comunicación directa con el backend centralizado en Render.

---

## ⚙️ Configuración del Entorno de Desarrollo

1. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
Duplica el archivo .env.example y renómbralo a .env:

Fragmento de código
EXPO_PUBLIC_API_URL=[https://afacop-backend.onrender.com](https://afacop-backend.onrender.com)
Inicia el servidor de desarrollo según tu plataforma:

Emulador Android: Asegúrate de usar EXPO_PUBLIC_API_URL=http://10.0.2.2:4001.

Dispositivo Físico: Reemplaza 10.0.2.2 por la IP LAN del equipo que aloja el backend.

Ejecuta la aplicación:

Bash
npx expo start
 Despliegue y Actualizaciones (EAS)
El proyecto cuenta con eas.json configurado para optimizar los ciclos de entrega continua:

 Enviar una actualización en caliente (Recomendado para el día a día)
Para sincronizar el último commit directamente con los celulares en campo sin pasar por procesos de compilación:

PowerShell
eas update --branch preview --message "Sincronizando última versión en campo"
 Compilación de Binarios (EAS Build)
Para generar paquetes de distribución de prueba (Preview):

PowerShell
npx eas-cli login
npx eas-cli build --platform android --profile preview
(Nota: Las compilaciones locales requieren JDK 17 y Android SDK configurados en el entorno local).

 Seguridad y Estándares
Tokens Protegidos: Las sesiones de usuario nunca se exponen en almacenamiento plano; se gestionan mediante contenedores seguros del dispositivo.

Control de Acceso: Compatible con flujos de autenticación robustos y revocación remota de sesiones ante inactividad o cambios de estado del colaborador.
