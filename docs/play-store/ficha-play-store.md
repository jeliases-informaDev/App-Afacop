# Ficha de Radar 360° para Google Play

Todo lo que necesitas copiar o responder en Play Console, en el orden en que lo pide. Lo que está entre corchetes `[ASÍ]` lo debes completar tú.

## 1. Datos básicos de la app

| Campo | Valor |
|---|---|
| Nombre de la app (máx. 30) | `Radar 360°` (si Play rechaza el símbolo «°», usa `Radar 360`) |
| Idioma predeterminado | Español (Latinoamérica) – es-419 |
| Tipo | Aplicación (no juego) |
| Precio | Gratuita |
| Categoría | Negocios |
| Correo de contacto (público) | [CORREO DE SOPORTE] |
| Sitio web (opcional) | [SITIO WEB DE INFORMAPERÚ] |
| Política de privacidad | [URL PÚBLICA DE LA POLÍTICA] (ver sección 7) |
| Paquete (applicationId) | `pe.informaperu.radar360` (no se puede cambiar después) |

## 2. Textos de la ficha

**Descripción breve (máx. 80 caracteres):**

```
Rutas, visitas y evidencias de cobranza en campo para asesores autorizados.
```

**Descripción completa (máx. 4000 caracteres):**

```
Radar 360° es la herramienta de campo para asesores de cobranza: organiza tu ruta del día, te guía hasta cada domicilio y registra la evidencia de cada visita, incluso sin internet.

IMPORTANTE: es una aplicación de uso profesional. Necesitas una cuenta creada por tu empresa; no hay registro público.

QUÉ PUEDES HACER
• Ver tu ruta del día y los clientes que tienes asignados.
• Usar el mapa operativo con tus clientes y tu posición.
• Llegar al domicilio con un toque: se abre tu aplicación de mapas con la dirección o con la ubicación ya confirmada.
• Registrar cada visita con dos fotografías, la firma del cliente, el resultado de la gestión y tus observaciones.
• Confirmar en el lugar la ubicación exacta de un domicilio para que la próxima visita sea más fácil.
• Trabajar sin conexión: las gestiones se guardan en tu teléfono y se envían solas cuando vuelve la señal.

SEGURIDAD Y PRIVACIDAD
• Las fotografías y firmas se guardan en un almacenamiento privado, sin enlaces públicos.
• Cada usuario ve solo lo que su rol permite; un asesor ve únicamente los clientes de su ruta.
• Los accesos y las consultas de evidencias quedan registrados.
• La cámara y la ubicación se usan solo cuando registras una visita o abres el mapa, con la aplicación abierta. No hay seguimiento en segundo plano.

REQUISITOS
• Android 7.0 o superior, con cámara trasera y GPS.
• Una cuenta de asesor entregada por tu empresa.

¿Dudas o soporte? Escríbenos a [CORREO DE SOPORTE].
```

No menciones nombres ni logos de entidades financieras (Caja Huancayo, Caja Arequipa, BanBif, etc.) en la ficha ni en las capturas, salvo que tengas su autorización escrita: Google lo trata como suplantación de marca.

## 3. Gráficos

| Recurso | Requisito de Play | Estado |
|---|---|---|
| Ícono | PNG de 32 bits, 512 × 512 px, máx. 1 MB | Listo: `icono-512.png` |
| Gráfico de funciones | PNG o JPEG, 1024 × 500 px, sin transparencia | Listo: `grafico-funciones-1024x500.png` |
| Capturas de teléfono | Mínimo 2, recomendado 4 a 6. PNG o JPEG sin transparencia, lados entre 320 y 3840 px, relación máx. 2:1 (por ejemplo 1080 × 1920) | Falta: tómalas de la app instalada |
| Capturas de tablet (7" y 10") | Opcionales, pero recomendadas para aparecer bien en tablets | Falta |

Pantallas sugeridas para las capturas: inicio de sesión, «Hoy», «Mi ruta», registro de gestión con la cámara, firma del cliente y «Mapa».

Las capturas son públicas. Usa solo los clientes de prueba (PRUEBA001 a PRUEBA004) y cambia por una dirección ficticia la dirección real que tengan, antes de capturar.

## 4. Contenido de la app (Play Console → Política → Contenido de la app)

| Sección | Qué responder |
|---|---|
| Política de privacidad | La URL pública de la sección 7 |
| Anuncios | No contiene anuncios |
| Acceso a la app | Hay funciones restringidas por inicio de sesión → agregar las instrucciones de abajo |
| Clasificación del contenido | Categoría «Utilidad, productividad, comunicación u otra». Responder «No» a violencia, contenido sexual, lenguaje soez, sustancias, apuestas, compras digitales, interacción entre usuarios y acceso web sin restricción. Resultado esperado: apto para todo público |
| Público objetivo | Solo «18 años o más». No está dirigida a niños |
| Aplicación de noticias / salud / gobierno / COVID | No |
| ID de publicidad | No lo usa (no hay SDK de publicidad ni permiso AD_ID) |
| Seguridad de los datos | Ver sección 5 |
| Funciones financieras | Ver la nota debajo de esta tabla |

**Instrucciones de acceso para los revisores de Google** (campo «Acceso a la app»):

```
La app requiere iniciar sesión con una cuenta de asesor.
Usuario: [USUARIO DEMO]
Contraseña: [CONTRASEÑA DEMO]
No pide códigos por SMS ni verificación adicional.

Pasos: 1) Inicia sesión. 2) En la pestaña «Mi ruta» verás los clientes asignados; abre uno.
3) Toca «Registrar gestión»: toma las dos fotografías con «Tomar fotografía», pide la firma
en el recuadro y toca «Guardar y sincronizar».
4) En la pestaña «Mapa» verás los puntos de la ruta; «Cartera» lista todos los clientes.
La cámara y la ubicación se piden solo al usarlas.
```

Crea un asesor demo cuya ruta tenga solo los clientes PRUEBA001 a PRUEBA004, para que el revisor no vea datos reales. Márcalo como exento de MFA: si el servidor le pide el código del autenticador, el revisor no podrá entrar. Antes de enviar a revisión, confirma que el servidor responde rápido: si el plan de Render se suspende por inactividad, la primera carga puede tardar y el revisor vería un error de conexión.

**Funciones financieras:** Radar 360° no otorga préstamos ni procesa pagos o transferencias; es una herramienta interna de gestión de cobranza. Si el formulario permite «No ofrece funciones financieras», elígelo. Si te obliga a elegir una opción, usa «Otras funciones financieras» y explica: «Herramienta interna para asesores de cobranza; no otorga préstamos ni procesa pagos». El formulario cambia seguido, así que lee las opciones vigentes antes de contestar.

No necesitas declaraciones especiales de permisos: la app no usa ubicación en segundo plano, ni galería, ni SMS, ni micrófono.

## 5. Seguridad de los datos (formulario «Data safety»)

Respuestas generales:

- ¿Recopila o comparte datos del usuario? **Sí**.
- ¿Los datos se cifran en tránsito? **Sí** (HTTPS).
- ¿Pueden los usuarios pedir la eliminación de sus datos? **Sí**, escribiendo a [CORREO DE PRIVACIDAD] (la política lo explica).
- Cumple la política de familias: **No aplica** (público de 18 años o más).

Datos que declarar (todos: obligatorios, no opcionales; no se procesan de forma efímera):

| Categoría de Play | Tipo de dato | Recopilado | Compartido | Finalidad |
|---|---|---|---|---|
| Ubicación | Ubicación precisa | Sí | No | Funcionalidad de la app |
| Ubicación | Ubicación aproximada | Sí | No | Funcionalidad de la app |
| Información personal | Nombre | Sí | No | Funcionalidad de la app; administración de cuentas |
| Información personal | ID de usuario (usuario y número de documento) | Sí | No | Funcionalidad de la app; administración de cuentas; seguridad |
| Información personal | Dirección | Sí | No | Funcionalidad de la app |
| Información personal | Número de teléfono (datos de contacto de clientes) | Sí | No | Funcionalidad de la app |
| Información financiera | Otra información financiera (saldo e historial de la deuda) | Sí | No | Funcionalidad de la app |
| Fotos y videos | Fotos (fotografías y firma) | Sí | No | Funcionalidad de la app |
| Identificadores | Otros identificadores (dirección IP y tipo de dispositivo en los registros de seguridad) | Sí | No | Seguridad y prevención de fraude |

No declares: contactos, mensajes, audio, historial web, salud, rendimiento ni diagnósticos (la app no usa herramientas de analítica ni de reporte de fallos). Si las cuentas de tus asesores incluyen correo electrónico, agrégalo en «Información personal → Dirección de correo».

Sobre «Compartido: No»: Google no considera «compartir» el envío de datos a proveedores que los tratan por tu cuenta (Render, Backblaze, Expo). Si tu asesor legal prefiere declarar también la entrega de las evidencias a la entidad contratante, cambia «Compartido» a «Sí» con la finalidad «Funcionalidad de la app». Declarar de más es más seguro que declarar de menos.

## 6. Compatibilidad con dispositivos

| Aspecto | Cómo está la app |
|---|---|
| Versión de Android | Desde Android 7.0 (API 24) en adelante, hasta Android 16 (target API 36, que Google exige desde el 31 de agosto de 2026) |
| Procesadores | arm64-v8a, armeabi-v7a, x86 y x86_64: teléfonos, tablets, Chromebooks y emuladores |
| Descarga | Se publica como AAB: Google entrega a cada equipo solo lo que necesita |
| Cámara y GPS | Por los permisos de cámara y ubicación precisa, Google solo mostrará la app en equipos con cámara trasera y GPS. Es intencional: la visita exige foto y ubicación |
| Pantallas grandes | Android 16 ignora el bloqueo en vertical en pantallas de 600 dp o más (tablets y plegables): la app puede girar. Pruébala en tablet y en pantalla dividida antes de producción |
| Permisos del manifiesto | Cámara, ubicación precisa y aproximada, internet y vibración. Además, almacenamiento heredado solo hasta Android 12L (la app no lo solicita) |
| Bloqueados | Micrófono y «mostrar sobre otras apps» |

Cómo comprobarlo antes de publicar:

1. Al subir el AAB, abre «Catálogo de dispositivos» en Play Console: muestra cuántos equipos son compatibles y cuáles quedan fuera.
2. Activa el informe de pruebas previas al lanzamiento: Google prueba la app automáticamente en equipos reales de varias marcas y tamaños. Para que pueda iniciar sesión, carga las credenciales demo en «Acceso a la app».
3. Prueba tú mismo en al menos un Samsung y un Xiaomi o Motorola (los más comunes en Perú), un equipo de gama baja (2 a 3 GB de RAM) y una tablet.

## 7. Política de privacidad: dónde publicarla

Google exige una URL pública, activa, sin inicio de sesión y que no sea un PDF.

1. Completa los marcadores amarillos de `politica-privacidad.html` (razón social, RUC, domicilio, correo de privacidad, plazo de conservación y código RNPDP si aplica).
2. Publica el archivo en tu sitio, por ejemplo `https://[TU-DOMINIO]/privacidad/radar360`.
3. Pega esa URL en Play Console (Contenido de la app → Política de privacidad) y en la ficha de la tienda.
4. Que un abogado la revise, sobre todo los roles de responsable y encargado y el plazo de conservación.

## 8. Camino hasta producción

Detalle completo, plantillas y textos de la solicitud: [prueba-cerrada-y-produccion.md](prueba-cerrada-y-produccion.md).

1. Crear la app en Play Console y completar las secciones 1 a 5 de esta ficha.
2. Subir un AAB a **Pruebas internas** (hasta 100 testers, disponible al instante) y probar en equipos reales. Las pruebas internas no cuentan para el requisito de Google.
3. Subir la versión con el enlace a la política y el aviso al firmar (versionCode 8) a **Pruebas cerradas**, con 12 testers o más durante 14 días seguidos (cuentas personales creadas después del 13 de noviembre de 2023; si la cuenta es de organización, no aplica).
4. Pulsar «Solicitar acceso a producción» en el Panel y, cuando Google lo apruebe, publicar en **Producción**.

Con Play App Signing, Google vuelve a firmar la app: si un asesor tiene instalado el APK de pruebas, debe desinstalarlo antes de instalar la versión de Play.

## 9. Nota para el modelo SaaS (varias entidades)

- Una sola ficha en Play con el nombre neutro «Radar 360°». La identidad de cada entidad (logo, colores y nombre mostrado) la puede entregar el servidor al iniciar sesión, así que no hace falta una app ni una revisión de Google por cada cliente.
- La política de privacidad ya contempla que la app se muestre con la identidad de la entidad contratante. Cuando el servicio sea multi-entidad de verdad, actualízala (roles por entidad) y revisa «Data safety» si cambia el tratamiento de datos.
- Si una entidad exige su propia app con su marca, sería otro paquete (`applicationId`) y otra ficha, con el mismo código y una variante de compilación.
- Hoy el sistema es de una sola organización: separar los datos por entidad (aislamiento por cliente, carpetas y claves de almacenamiento por entidad) es trabajo de arquitectura previo a ese lanzamiento.

## 10. Pendientes antes de enviar a revisión

- [ ] Completar y publicar la política de privacidad.
- [ ] Confirmar en qué región están Render y Backblaze y, si quieres, precisarlo en la sección 8 de la política (hoy dice «fuera del Perú»).
- [ ] Definir el plazo de conservación de evidencias.
- [ ] Crear el asesor demo con los clientes PRUEBA y poner sus credenciales en «Acceso a la app».
- [ ] Tomar las capturas (teléfono y, si puedes, tablet).
- [ ] Revisar el formulario de «Funciones financieras» tal como aparezca en ese momento.
- [ ] Confirmar que el servidor no se suspende durante la revisión.
