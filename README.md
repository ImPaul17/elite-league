# Elite League

Web oficial de **Elite League**, una competición de FC Rush 5v5. Este repositorio reúne el sitio público, la gestión de competición y una base preparada para presidentes de club y administración.

> Estado comprobado el 6 de septiembre de 2026: el código está en [ImPaul17/elite-league](https://github.com/ImPaul17/elite-league) y el primer despliegue de GitHub Pages ha terminado correctamente. Supabase está conectado con 12 clubes, 11 jornadas y 66 partidos, sin jugadores ni noticias de muestra. GitHub ha verificado la propiedad de `eliteleague.qd.je`; la delegación y los registros DNS autoritativos son correctos. Siguen pendientes la actualización de cachés DNS, la comprobación DNS de Pages, HTTPS y la revisión pública de la web. La nueva versión de acceso por usuario, el editor de Noticias y Patrocinadores están implementados localmente; siguen pendientes su activación y las pruebas con cuentas reales, además de la retirada de una copia remota errónea. Véase `PLANIFICACION_LANZAMIENTO.md` para el estado de entrega.

![Tarjeta de Elite League](public/og.png)

## Qué incluye

- Inicio editorial con clasificación, jornada actual, noticias y espacio de estadísticas.
- Tabla calculada automáticamente con el sistema **3 / 2 / 1 / 0**: victoria, victoria por penaltis, derrota por penaltis y derrota.
- Calendario completo del Split 3: 11 jornadas y 66 partidos de los 12 clubes actuales.
- Directorio de clubes con archivo por edición: Split 1, Split 2, Elite Cup por grupos y Split 3 actual.
- Fichas históricas con escudo, color, grupo y estado de cada participación, incluyendo los clubes inactivos.
- Archivo de resultados de Split 1, Split 2 y Elite Cup: clasificación calculada, partidos de fase regular o grupos y eliminatorias por club.
- Calendario de Partidos con selector por edición: Split 3 actual, Split 1, Split 2 y Elite Cup, incluidos filtros de grupos y play-offs históricos.
- Páginas de estadísticas, noticias, formato de competición y reglamento operativo.
- Portal de presidente: calendario, resultados y clasificación de su club. Jugadores y alineaciones quedan inactivos para este lanzamiento.
- Panel de administración para jornadas, horarios, resultados, Noticias y usuarios de presidentes; «Mi cuenta» para cambiar contraseña.
- Fichas institucionales de los 12 clubes con año de fundación, presidencia, colores representativos y palmarés competitivo.
- Diseño responsive, barra de clubes con scroll-snap, tableros editoriales de clasificación y jornada, transiciones sutiles y respeto de `prefers-reduced-motion`.
- Base de datos versionada de Supabase con autenticación, recuperación de contraseña, roles, RLS, alineaciones, resultados, eventos, auditoría y clasificación calculada en servidor.
- Función segura de cuentas por usuario, contraseña temporal obligatoria y restablecimiento administrativo. No requiere correo ni SMTP.
- Flujo de publicación para GitHub Pages y una tarjeta social de Elite League.

## Principio de funcionamiento

```text
Visitante
  └─ consulta clubes, noticias, jornadas, resultados y clasificación pública

Presidente de club
  └─ consulta su club y calendario; cambia su contraseña desde Mi cuenta

Administrador
  └─ organiza temporadas, clubes, jugadores, jornadas, resultados, noticias y reglas

React + Vite (GitHub Pages)
  └─ Supabase Auth + PostgreSQL + RLS + Storage + Edge Function de cuentas
```

La arquitectura de publicación elegida es GitHub Pages para el frontend estático y Supabase para las cuentas, la seguridad, los datos y las operaciones que no pueden vivir de forma segura en el navegador. GitHub conserva el código y su historial; el proyecto local se puede seguir editando y sincronizando mediante Git.

## Estructura del proyecto

```text
.
├─ public/                       # Escudos optimizados, logo y tarjeta social
├─ src/
│  ├─ app/                       # Router hash
│  ├─ components/                # Componentes reutilizables, competición y operaciones
│  ├─ context/                   # Estado de demostración y puente de producción
│  ├─ data/                      # Seed visible, Split 3, archivo de ediciones y noticias
│  ├─ lib/                       # Reglas, pruebas, Supabase y repositorio de datos
│  ├─ pages/                     # Páginas públicas, club y administración
│  ├─ App.jsx                    # Aplicación y rutas
│  └─ styles.css                 # Sistema visual responsive
├─ supabase/
│  ├─ functions/                 # Lógica de servidor para operaciones sensibles
│  ├─ migrations/                # Esquema SQL, RLS y funciones de negocio
│  └─ seed.sql                   # Clubes, Split 3, 11 jornadas y 66 partidos
├─ .github/workflows/            # Validación y despliegue en GitHub Pages
├─ .env.example                  # Variables públicas necesarias para Supabase
└─ vite.config.js                # Base configurable para Pages o dominio propio
```

Las copias históricas `src/App.legacy.jsx`, `src/styles.legacy.css` y `src/app/legacy/` se conservan únicamente en el equipo local y están excluidas del repositorio mediante `.gitignore`. No están importadas por la aplicación vigente. La copia antigua del login contiene credenciales locales obsoletas y no debe publicarse ni incorporarse al historial de Git.

## Arranque local

Requisitos: Node.js 20 o superior y npm.

```bash
npm ci
npm run dev
```

La web se abre en `http://localhost:3000`. Sin variables de Supabase se inicia en **modo de demostración**; no escribe cuentas, resultados ni jugadores en ningún servicio externo.

Para validar antes de publicar:

```bash
npm run validate
```

Este comando ejecuta las pruebas de reglas de clasificación y forma la compilación final.

## Recorrido de demostración

1. Abre **Acceso clubes** en la cabecera.
2. Elige `Administrador · Pico FC` para entrar como organizador y presidente de Pico FC. No hay contraseña de ejemplo porque no se debe entrenar a los usuarios a usar credenciales visibles.
3. En **Administración**, prueba resultados, penaltis, horarios y el editor de Noticias.
4. Guarda un borrador, publícalo, abre su detalle y retíralo. Estos cambios no llegan a Supabase.
5. En **Mi club**, consulta el calendario; las funciones de jugadores están pendientes.
6. Recarga para descartar todos los cambios de la demostración.

Los cambios de demostración viven solo en memoria. Su objetivo es probar los flujos de producto sin confundirlos con un backend real.

## Datos de competición y reglas

### Split 3 actual

- 12 clubes: Pico FC, CA Coca Jrs, URSS FC, BEE FC, Los Mugiwaras FC, Impuestos FC, Maki FC, Lego FC, Rayo Zeta, Estaross FC, Karasuno Falcons y El Caudillo FC.
- 11 jornadas de liga regular, una vuelta completa.
- 66 partidos cargados en `src/data/split3.js` y también en `supabase/seed.sql`.
- La fuente vigente de jornadas es el calendario final de Split 3, no los borradores históricos que todavía nombran a Los Pikas FC.

### Archivo de ediciones

La sección **Equipos** conserva una vista por competición sin mezclar el historial con los datos operativos actuales:

- **Split 1** y **Split 2** muestran la participación de cada club con el escudo y el color que utilizó en esa edición.
- **Elite Cup** separa los participantes en Grupo A y Grupo B.
- Los clubes que ya no están activos —Playmobil FC, Cegatos FC y Los Pikas FC— mantienen tarjetas y fichas históricas propias, marcadas como inactivas.
- La barra de escudos de la cabecera, las clasificaciones, los partidos y los accesos privados continúan mostrando solo los clubes activos de Split 3.

Las participaciones históricas viven en `src/data/history.js`. Más adelante pueden migrarse a `phase_clubs` y a una presentación específica por fase en Supabase, sin alterar los clubes actuales ni sus flujos de gestión.

Los marcadores ya confirmados de Split 1, Split 2 y Elite Cup viven en `src/data/historyResults.js`. Las fichas históricas calculan su clasificación con los resultados de la liga regular; en Elite Cup se calcula de forma independiente para cada grupo. Cada club muestra sus partidos y los play-offs que disputó.

### Clasificación

La tabla no se introduce manualmente. Los resultados oficiales son la fuente de verdad:

| Resultado | Puntos |
| --- | ---: |
| Victoria | 3 |
| Victoria por penaltis | 2 |
| Derrota por penaltis | 1 |
| Derrota | 0 |

El orden actual de desempate es: puntos, diferencia de goles, goles a favor, victorias y nombre de club. Si se aprueba un reglamento distinto, se cambia en la configuración de la fase y en la función de clasificación del servidor, nunca solo en la interfaz.

### Alineaciones 4+1

Una alineación es una instantánea del partido, no una referencia mutable a la plantilla:

- 5 jugadores distintos.
- 1 portero y 4 jugadores de campo.
- Todos activos, inscritos en ese club y en ese split.
- Solo el club participante puede enviarla.
- Después de la hora límite se bloquea; administración puede reabrirla si procede.
- La alineación rival no se hace pública antes de la ventana de publicación.

### Playoffs

Formato de Split 3 confirmado por la organización: los once primeros acceden a la fase final. El 1.º pasa directamente a semifinales, del 2.º al 4.º a cuartos y del 5.º al 9.º a octavos. El 10.º y el 11.º disputan entre sí la última plaza de octavos; el 12.º queda eliminado. Se juegan un partido de acceso, tres octavos, tres cuartos, dos semifinales y la final. Esta confirmación sustituye al top 10 del reglamento antiguo. Los destinos por posición y las rondas se conservan en `src/data/split3Playoffs.js`; los equipos de los cruces siguen «Por decidir».

## Supabase: puesta en producción

El proyecto existente ya tiene las migraciones 0001 y 0002 y el seed público. **No repetir la instalación inicial sobre producción.** La activación incremental del nuevo acceso se documenta en [ACTIVACION_CUENTAS.md](ACTIVACION_CUENTAS.md).

### 1. Entorno nuevo

Solo para una base nueva: aplicar 0001, 0002, el seed y después 0003. Mantener desactivado el registro abierto. Las cuentas se crean desde administración; no hay registro público.

### 2. Actualizar el entorno existente

Aplicar `supabase/migrations/0003_username_accounts_and_news_audit.sql`: añade el usuario, el requisito de cambio de contraseña y auditoría de noticias. No modifica resultados, fechas ni miembros existentes.

### 3. Desplegar el servicio de cuentas

Con la CLI autenticada en el proyecto correcto:

```bash
supabase functions deploy club-accounts
supabase functions deploy invite-president
```

La segunda función queda desactivada para impedir que se sigan usando las invitaciones antiguas. `club-accounts` valida la sesión en Auth y el rol en perfiles protegidos. El servicio soporta crear/listar presidentes, restablecer su contraseña y cambiar la propia tras verificar la contraseña actual.

Configurar `ALLOWED_ORIGINS` con los orígenes autorizados. Las claves privadas pertenecen exclusivamente al servidor. Los identificadores internos de Auth no son correos de contacto; no requiere SMTP.

### 4. Primer administrador y prueba real

El propietario del proyecto crea la primera cuenta y asigna su rol por UUID verificado. Ver el procedimiento de [activación](ACTIVACION_CUENTAS.md); no publicar credenciales ni UUID ficticios. Después se crean los presidentes desde el panel.

Antes de darlo por terminado, probar inicio/cierre, recarga, cambio obligatorio, contraseña antigua rechazada, restablecimiento y permisos desde cuentas autorizadas distintas.

### 5. Variables del frontend

Copia `.env.example` a `.env.local` y completa:

```bash
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA_O_ANON
```

La clave pública puede estar en la web; la protección está en las políticas RLS. **Nunca** copies `service_role`, claves privadas, exports de base de datos ni archivos de contratos a Vite, GitHub Pages o el repositorio.

### 6. Qué garantiza la base

| Rol | Capacidades |
| --- | --- |
| Público | Consulta contenido publicado, resultados, tabla, clubes y noticias. |
| Presidente | Gestiona únicamente su club, sus jugadores inscritos y sus alineaciones. |
| Staff | Puede gestionar el club al que se le ha asignado. |
| Árbitro | Consulta operativa; no puede enviar alineaciones ni resultados en nombre de un club. |
| Administrador | Gestiona toda la competición, resultados oficiales, jugadores, contenido y permisos. |

La migración incluye RLS para cada tabla pública y privada. Las operaciones críticas (`submit_lineup`, `confirm_match_result`, `configure_matchday`, `configure_match_schedule` y `get_phase_standings`) viven en PostgreSQL para que la autorización no dependa de botones ocultos en el navegador. En producción, la tabla visible usa la clasificación calculada por el servidor, incluidas las sanciones o ajustes de puntos.

## Añadir jugadores y estadísticas

El archivo histórico de jugadores es una fuente de referencia, no se publica automáticamente. Antes de importar, prepara un CSV revisado por ti:

```csv
public_name,club_slug,position_group,shirt_number
Jugador ejemplo,pico-fc,FIELD,10
Portero ejemplo,pico-fc,GK,1
```

La importación definitiva debe crear:

1. Un registro en `players` con identidad pública y assets permitidos.
2. Una inscripción en `club_player_registrations` para el club y fase correctos.
3. Opcionalmente, atributos FC, historial, estadísticas y foto en `profile` o tablas especializadas posteriores.

No uses fotos, nombres completos, contratos, edad exacta u otros datos personales sin confirmar que los jugadores han autorizado su uso público.

Después de confirmar cada partido, administración puede añadir `match_events` (goles, asistencias, tarjetas y MVP) desde el panel. De ahí se alimentan los líderes individuales y las estadísticas por club sin editar la tabla a mano.

## Operación de jornadas

El flujo recomendado es:

1. Administración crea o publica la jornada, fija fecha/hora y establece el límite de alineaciones por partido.
2. Cada presidente completa el 4+1 en su área privada.
3. El sistema bloquea las alineaciones al llegar la hora límite.
4. Los clubes pueden proponer marcador y aportar evidencia si se habilita ese flujo.
5. Administración confirma el resultado oficial.
6. La función de clasificación actualiza puntos, GF, GC, DG y posiciones.
7. La web muestra el nuevo estado al público y conserva una entrada de auditoría.

Quedan como decisiones de reglamento antes de activar el flujo en una competición real:

- Emparejamientos y fechas definitivos de playoffs; el acceso por posición del Split 3 ya está confirmado arriba.
- Orden final de desempates si la tabla sigue igualada.
- Sanciones por amarillas, tarjeta azul e incomparecencias.
- Quién puede confirmar resultados y cómo se resuelven incidencias.
- Hora límite, visibilidad y reapertura de las alineaciones.

## Publicar con GitHub Pages

El proyecto incluye un flujo de GitHub Actions en `.github/workflows/deploy.yml`. El repositorio público [ImPaul17/elite-league](https://github.com/ImPaul17/elite-league) contiene los 126 archivos revisados del commit `f5ac956`, subido a `main`. Las dos variables públicas de Supabase están guardadas, Pages usa GitHub Actions y el [primer despliegue](https://github.com/ImPaul17/elite-league/actions/runs/34008474567) ha terminado correctamente. La comprobación pública del dominio y HTTPS sigue pendiente. Este es el procedimiento para mantener o reproducir la configuración:

1. Usa el repositorio público ya creado, sin añadir archivos iniciales que entren en conflicto con el proyecto local. Revisa los archivos que se van a versionar: no incluyas `.env`, `.env.*` salvo `.env.example`, `node_modules`, `dist`, `supabase/.temp`, copias legacy ni material privado. No uses `git add -f` para eludir estas exclusiones.
2. En `Settings → Secrets and variables → Actions → Variables`, configura las variables de repositorio `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con la URL y la clave pública del proyecto Supabase. Nunca uses una clave `service_role` o secreta. La compilación se bloquea si falta cualquiera de estas dos variables.
3. En `Settings → Pages`, selecciona **GitHub Actions** como origen de publicación cuando el repositorio lo permita. Conecta el repositorio local al remoto correcto y haz push a la rama `main`.
4. Comprueba la ejecución en `Actions`. El flujo instala dependencias, ejecuta las pruebas, compila y publica únicamente `dist`. Si el primer push se ejecutó antes de configurar las variables o Pages, vuelve a ejecutar el flujo una vez completada la configuración.
5. Abre la URL publicada y verifica rutas, recargas, imágenes, datos de Supabase y acceso. Un push correcto por sí solo no demuestra que la web esté desplegada.

Sin dominio personalizado, la URL de proyecto prevista será:

```text
https://ImPaul17.github.io/elite-league/
```

La aplicación utiliza rutas con hash (`#/equipos/pico-fc`) para que los enlaces internos funcionen también al recargar una página en GitHub Pages.

### Dominio propio: `eliteleague.qd.je`

El dominio está registrado en DigitalPlat y guardado como dominio personalizado de GitHub Pages. Tras reintentar la configuración, los cuatro servidores del dominio padre `qd.je` confirman la delegación a `dns1.digitalplat.org` y `dns2.digitalplat.org`; ambos servidores autoritativos responden con los cuatro A de Pages, el CNAME de `www` hacia `impaul17.github.io.` y el TXT correctos. DigitalPlat muestra DNS **Activo** y GitHub confirma la propiedad del dominio como **Verified**. Siguen pendientes la actualización de las cachés DNS, la comprobación DNS específica de Pages, el certificado HTTPS y el recorrido público de la web; la verificación de propiedad no sustituye esas comprobaciones.

1. Comprueba quién gestiona actualmente los DNS y conserva los registros necesarios. En GitHub, verifica la propiedad del dominio cuando sea posible y añade `eliteleague.qd.je` en `Settings → Pages → Custom domain` **antes** de apuntar los DNS al nuevo alojamiento.
2. Configura en el proveedor DNS los registros que correspondan según las [instrucciones oficiales de GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). No crees registros comodín. No elimines el registro del dominio ni cambies registros ajenos a esta publicación.
3. Espera a que GitHub valide los DNS y emita el certificado. Activa `Enforce HTTPS` cuando esté disponible y comprueba el dominio sin omitir advertencias de seguridad. La propagación y la disponibilidad de HTTPS pueden tardar hasta 24 horas.
4. Vuelve a desplegar si el cambio de dominio modifica la ruta base. `configure-pages` proporciona automáticamente `VITE_BASE_PATH` al flujo: `/elite-league` para la URL de proyecto o una base vacía para el dominio propio, que Vite resuelve como `/`.
5. Comprueba que `Site URL`, los enlaces autorizados de invitación y recuperación, `APP_URL` y `ALLOWED_ORIGINS` en Supabase coinciden con la URL final. El dominio final ya está configurado en Supabase; falta comprobar el recorrido completo en la web alojada. No habilites el acceso en una URL provisional sin configurar también sus redirecciones y origen.

Con el flujo personalizado de GitHub Actions, un archivo `CNAME` no es necesario y GitHub lo ignora: el dominio se gestiona en la configuración de Pages. No es necesario cambiar el código de negocio al pasar de `github.io` a un dominio propio.

## Calidad, accesibilidad y diseño

- Los tableros oficiales de escritorio recuperan la composición editorial del diseño original, pero reciben clasificación, resultados y penaltis en tiempo real; en móvil cambian a tabla y tarjetas legibles.
- Tablas y roles de tabla semánticos, navegación por teclado, enlace para saltar al contenido y foco visible.
- Estados acompañados de texto, no solo color.
- Cabecera móvil compacta y rail de escudos horizontal, en lugar de una parrilla que ocupe toda la pantalla.
- Tabla móvil con club y posición fijados, y scroll horizontal explícito para las estadísticas secundarias.
- Animaciones cortas, scroll-snap para elementos horizontales y respeto de `prefers-reduced-motion`.
- El diseño PSD se conserva como referencia creativa, pero los datos se muestran con componentes responsivos y accesibles.

## Material histórico y privacidad

El archivo histórico privado de la organización no es una carpeta para subir entera al repositorio. Antes de publicar, excluye especialmente:

- Contratos, documentos privados y datos de contacto.
- Modificaciones de FIFA/FC, squads, DDS, ZIP, proyectos de juego y archivos de vídeo.
- PSD de gran tamaño y artes de producción que no sean necesarios para la web.
- Fotos o recursos de jugadores sin autorización de publicación.

Los escudos optimizados, el logotipo y la tipografía incluida son los únicos activos históricos que el frontend necesita ahora.

## Próximas iteraciones recomendadas

1. Completar GitHub Pages y el dominio con HTTPS; configurar SMTP y probar las cuentas e invitaciones reales de Supabase.
2. Importar plantillas reales tras revisar consentimiento y datos.
3. Añadir formularios de resultado por presidente, incidencias y evidencias.
4. Construir el editor visual de playoffs a partir del formato que apruebes.
5. Añadir pruebas E2E por rol y monitorización antes de la primera jornada real.

---

Elite League se ha preparado para que el contenido y la competición puedan crecer sin volver a rehacer la web: el calendario, las reglas, los jugadores, los presidentes y los playoffs pasan a ser datos administrables, no elementos fijos en el código.
