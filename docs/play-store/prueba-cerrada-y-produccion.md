# De la prueba cerrada a producción: todo lo necesario

Guía para dejar Radar 360° abierta a todo el público en Google Play. Complementa la [ficha de la tienda](ficha-play-store.md).

## 1. La regla de Google (por qué hay que esperar)

Tu cuenta de Play Console es personal y se creó después del 13 de noviembre de 2023. Para ese tipo de cuenta, Google exige:

- Una **prueba cerrada** con **al menos 12 testers** que se mantengan inscritos **14 días seguidos**. Quien se sale y vuelve a entrar debe completar 14 días seguidos desde cero.
- Solo después, desde el Panel, se pulsa **«Solicitar acceso a producción»**. Google responde por correo, normalmente en 7 días o menos.
- Hasta esa aprobación, **Producción y las Pruebas abiertas están bloqueadas**. Las pruebas internas no cuentan.
- La prueba cerrada solo exige tener la configuración de la app completa (ficha y contenido de la app). No necesita aprobación previa.

Si tu cuenta fuera de tipo organización, nada de esto aplicaría y podrías ir directo a producción.

## 2. Línea de tiempo

| Paso | Quién | Tiempo |
|---|---|---|
| 1. Completar los datos legales y publicar la política de privacidad | Tú pasas los datos; se publica | Hoy |
| 2. Completar la ficha de la tienda y el contenido de la app | Tú, con `ficha-play-store.md` | 1 a 2 horas |
| 3. Compilar la versión 8 y subirla a **Pruebas cerradas** | Se compila; tú la subes | Revisión de Google: de horas a pocos días |
| 4. Reclutar e inscribir a los testers (mínimo 12) | Tú y los testers | El mismo día en que se aprueba |
| 5. Mantenerlos inscritos y usando la app | Testers | 14 días seguidos |
| 6. Pulsar «Solicitar acceso a producción» | Tú | 10 minutos |
| 7. Respuesta de Google | Google | 7 días o menos, normalmente |
| 8. Publicar en Producción (con su revisión) | Tú | 1 a 3 días |

En total son unas **3 a 4 semanas** desde que haya 12 testers instalados. Mientras tanto tus asesores ya pueden usar la app desde la prueba cerrada, sin esperar a producción.

## 3. Antes de subir a Pruebas cerradas

- [ ] Política de privacidad publicada en una URL pública, con los marcadores amarillos completos. Debe ser la misma dirección que está dentro de la app (`src/shared/utils/legal.ts`).
- [ ] Ficha principal completa: textos, ícono, gráfico de funciones y al menos 2 capturas de teléfono.
- [ ] «Contenido de la app» completo, según las secciones 4 y 5 de la ficha.
- [ ] Versión 8 compilada: trae el enlace a la política en el login y en Perfil, y el aviso de datos junto a la firma.
- [ ] Usuario demo para Google con rol ASESOR y una ruta con los clientes PRUEBA001 a PRUEBA004. **Debe estar exento de MFA**: el servidor pide el código del autenticador si el usuario tiene MFA activo o requerido, o si `REQUIRE_MFA=true` en Render, salvo que el usuario tenga `mfa_exento` o esté en `MFA_EXEMPT_USERNAMES`. Si el revisor se topa con esa pantalla, no podrá entrar y rechazarán la app.
- [ ] El servidor responde rápido (sin suspenderse por inactividad) mientras dure la revisión.

## 4. Crear la prueba cerrada en Play Console

1. **Pruebas y lanzamiento → Pruebas cerradas**. Crea una pista (por ejemplo «Asesores») o usa la que ya existe.
2. Pestaña **Testers → Crear lista de correos**. Pega los Gmail de los testers, uno por línea. Pon **15 a 20**, para tener margen si alguien se sale. Guarda y marca la lista en la pista.
3. Elige los países: Perú.
4. Pestaña **Lanzamientos → Crear versión nueva**. Sube el AAB de la versión 8, escribe las notas y avanza hasta **Iniciar lanzamiento**. Eso la envía a revisión de Google.
5. Cuando se apruebe, en la pestaña **Testers** copia el **enlace para unirse** y envíalo a los testers.

Los correos deben estar en la lista **antes** de que la persona abra el enlace. Cada uno debe abrirlo con la misma cuenta de Gmail que usa en la Play Store de su celular.

## 5. Reclutar a los testers

Quiénes sirven: asesores reales (son los que prueban todas las funciones), supervisores, colegas y familiares con celular Android 7 o superior. Usa personas reales: Google mira la participación, no solo el número.

Cada tester necesita Gmail, Google Play y un usuario de la app. Los asesores usan el suyo. Para el resto, crea usuarios demo con rol ASESOR (exentos de MFA) y rutas con clientes PRUEBA.

**Mensaje para enviar por WhatsApp:**

```
Hola, necesito tu ayuda 2 minutos. Estamos publicando la app «Radar 360°» (de InformaPerú) en Google Play y Google exige que 12 personas la prueben durante 14 días.

1) Abre este enlace desde tu celular Android, con tu cuenta de Gmail:
[ENLACE DE INVITACIÓN]
2) Toca «Convertirse en tester» y luego «Descargar en Google Play». Instala la app.
3) Entra con este usuario: [USUARIO] / [CONTRASEÑA] (si ya eres asesor, con el tuyo).
4) Ábrela de vez en cuando estos 14 días y prueba registrar una gestión (2 fotos y firma).

Importante: no la desinstales ni te salgas de la prueba durante 14 días, porque entonces no cuenta. Si algo falla, mándame una captura. ¡Gracias!
```

**Seguimiento** (cópialo a una hoja):

| Tester | Gmail | Rol | Aceptó y instaló | Fecha de ingreso | Registró una gestión completa | Comentarios |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## 6. Durante los 14 días

- Revisa a diario en **Pruebas cerradas → Testers** que sigan inscritos 12 o más.
- Mira el **informe previo al lanzamiento** y las métricas de fallos (Android vitals).
- Anota los comentarios y los cambios que hagas: los necesitarás para la solicitud.
- Si corriges algo, sube una versión nueva (versionCode 9, 10…) a la misma pista. Los testers no se pierden.

## 7. Solicitar acceso a producción (día 14 en adelante)

En el **Panel**, pulsa **«Solicitar acceso a producción»**. Tiene tres secciones. Estos son borradores para adaptar con tus datos reales (lo que está entre corchetes lo completas tú):

**Sobre tu prueba cerrada**

- ¿Qué tan fácil fue reclutar testers?
  > [Fácil / Moderado]. Convocamos a [N] personas: [N] asesores de campo y [N] colaboradores, con un enlace de invitación enviado por WhatsApp.
- ¿Los testers usaron todas las funciones?
  > Sí. Durante los 14 días usaron inicio de sesión, ruta del día, mapa, navegación al domicilio, registro de gestión con dos fotografías y firma del cliente, confirmación de la ubicación del domicilio y envío sin conexión con sincronización automática.
- ¿El uso coincidió con el de producción? ¿Qué diferencias hubo?
  > En lo esencial sí: es una app de uso interno de asesores autorizados y la usaron en visitas reales o simuladas. Diferencias: [se usaron clientes de prueba / hubo menos visitas por día que en producción].
- Resumen de los comentarios y cómo los recopilaron
  > Recopilamos comentarios por WhatsApp y llamadas con cada tester. Lo principal: [1 a 3 puntos]. Reportes de fallos: [N], todos atendidos.

**Sobre tu app**

- Público objetivo
  > Asesores de cobranza en campo, supervisores y administradores de entidades financieras y empresas de cobranza en Perú. Uso profesional, mayores de 18 años, con cuenta entregada por su empresa.
- Propuesta de valor
  > Reduce el tiempo de gestión en campo: ruta del día, navegación al domicilio, evidencia verificable (dos fotos, firma y ubicación) enviada por un canal seguro y funcionamiento sin conexión.
- Instalaciones estimadas el primer año
  > [Un rango acorde a tu cantidad de asesores, por ejemplo 100 a 500].

**Sobre la preparación para producción**

- Cambios hechos con lo aprendido
  > [Lista los cambios reales, por ejemplo: enlace a la política de privacidad dentro de la app, aviso de tratamiento de datos al firmar, correcciones de ubicación de domicilios].
- Cómo determinaron que estaba lista
  > Tras 14 días sin fallos críticos en Android vitals, con [N] testers activos, probada en [N] modelos y versiones de Android, con la política de privacidad publicada y los permisos revisados.

Si Google no aprueba, sigue con la prueba cerrada, corrige lo que indique el correo y vuelve a solicitar.

## 8. Después de la aprobación

1. **Producción → Crear versión** (o promover la que probaron en la pista cerrada). Elige países: Perú.
2. Usa lanzamiento por etapas (20 % y luego 100 %) para frenar a tiempo si aparece un fallo.
3. Revisa Android vitals y las reseñas los primeros días.
4. Mantén el versionCode siempre creciente. Los cambios solo de pantallas y textos se pueden enviar por OTA (`eas update --branch production`) sin pasar por Play, mientras la versión siga siendo 1.0.5.

## Fuentes oficiales

- [Requisitos de pruebas para cuentas personales nuevas](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Todo sobre el requisito de 12 testers](https://support.google.com/googleplay/android-developer/community-guide/255621488/everything-about-the-12-testers-requirement?hl=en)
- [Configurar una prueba abierta, cerrada o interna](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en)

Google cambia estas reglas de vez en cuando: confirma los números en la página oficial antes de empezar.
