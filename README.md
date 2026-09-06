# Elite League

Web oficial de **Elite League**, una competición de FC Rush 5v5. Este repositorio reúne el sitio público, la gestión de competición y una base preparada para presidentes de club y administración.

> Estado comprobado el 6 de septiembre de 2026: Supabase está conectado e inicializado, con 12 clubes, 11 jornadas y 66 partidos, sin jugadores ni noticias de muestra. El repositorio público [ImPaul17/elite-league](https://github.com/ImPaul17/elite-league) ya está creado, todavía vacío; se ha autorizado publicar allí el código y alojar la web con GitHub Pages, conservando el dominio `eliteleague.qd.je` registrado en DigitalPlat. La configuración de variables está en curso y los DNS no se han cambiado. La retirada de una carpeta subida por error al alojamiento anterior está en curso, todavía sin confirmar. Subida del código, publicación, HTTPS, SMTP y pruebas con cuentas reales siguen pendientes. Véase `PLANIFICACION_LANZAMIENTO.md` para el estado de entrega.

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
- Portal de presidente de club: plantilla, siguiente partido y constructor de formación de **4 jugadores de campo + 1 portero**.
- Panel de administración para configurar jornadas, horarios y límites 4+1; registrar jugadores, resultados, eventos, noticias e invitaciones de presidentes.
- Fichas institucionales de los 12 clubes con año de fundación, presidencia, colores representativos y palmarés competitivo.
- Diseño responsive, barra de clubes con scroll-snap, tableros editoriales de clasificación y jornada, transiciones sutiles y respeto de `prefers-reduced-motion`.
- Base de datos versionada de Supabase con autenticación, recuperación de contraseña, roles, RLS, alineaciones, resultados, eventos, auditoría y clasificación calculada en servidor.
- Función de servidor para invitar presidentes sin exponer una clave de administración en el frontend.
- Flujo de publicación para GitHub Pages y una tarjeta social de Elite League.

## Principio de funcionamiento

```text
Visitante
  └─ consulta clubes, noticias, jornadas, resultados y clasificación pública

Presidente de club
  └─ gestiona solo la plantilla de su club y presenta la formación 4+1

Administrador
  └─ organiza temporadas, clubes, jugadores, jornadas, resultados, noticias y reglas

React + Vite (GitHub Pages)
  └─ Supabase Auth + PostgreSQL + RLS + Storage + Edge Function de invitaciones
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
3. En **Administración**, configura el estado, fecha, horario y límite de una jornada; registra jugadores de prueba y publica uno o varios resultados.
4. Registra goles, asistencias o MVP de un partido confirmado: las estadísticas se actualizan automáticamente.
5. La clasificación se recalcula en el acto con las reglas oficiales.
6. En **Mi club**, abre la siguiente jornada y selecciona un portero y cuatro jugadores de campo. Puedes guardar un borrador o enviar la formación.
6. Usa **Restaurar datos de demostración** desde administración para volver al estado inicial.

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

El bracket debe ser configurable por temporada. El material histórico de Split 3 incluye un play-in entre 10.º y 11.º, mientras que un reglamento anterior habla de top 10. Por eso no se ha codificado una única fórmula fija: el modelo contiene fases, clubes de fase y reglas JSON para construir cada edición correctamente.

## Supabase: puesta en producción

El proyecto de esta entrega ya está inicializado y la función de invitaciones está desplegada. Los pasos de creación, migraciones y seed siguientes documentan la preparación de un entorno nuevo: no deben repetirse sobre producción sin revisar su estado. Siguen pendientes SMTP, las cuentas autorizadas y las pruebas completas de acceso y permisos.

### 1. Crear el proyecto

Crea un proyecto nuevo en Supabase y usa una región cercana a los jugadores. Activa el proveedor de correo y contraseña, desactiva el registro abierto y configura las URL de redirección para `http://localhost:3000`, tu URL de GitHub Pages y el dominio final. La aplicación utiliza recuperación de contraseña con flujo PKCE, compatible con sus rutas con hash.

### 2. Aplicar esquema y seed

En el SQL Editor de Supabase, ejecuta todas las migraciones en este orden:

```text
supabase/migrations/0001_elite_league.sql
supabase/migrations/0002_club_profiles.sql
```

Después ejecuta:

```text
supabase/seed.sql
```

El seed instala únicamente contenido público: los 12 clubes, Split 3 y la liga regular. No carga jugadores ni noticias de ejemplo. No subas contratos, datos personales, vídeos o recursos de mod privados.

La migración también crea el bucket público `elite-public`. Úsalo solo para escudos, fotos autorizadas, portadas y recursos optimizados; las políticas permiten subir, actualizar o borrar archivos únicamente a administración.

### 3. Desplegar la invitación segura de presidentes

La web incluye `supabase/functions/invite-president/index.ts`. Esta función verifica la sesión contra Supabase Auth y que quien la llama sea administrador, crea la invitación y vincula al presidente con su club. La clave `service_role` se mantiene exclusivamente en Supabase. `supabase/config.toml` desactiva solo el verificador de firma heredada del gateway: la comprobación de sesión y rol dentro de la función es obligatoria.

Configura SMTP antes de invitar a los presidentes: el correo predeterminado de Supabase solo envía a direcciones autorizadas del equipo del proyecto. No se deben desactivar las confirmaciones de correo para eludir esta limitación.

Una vez enlazado el proyecto con la CLI de Supabase, despliega la función y limita los orígenes permitidos:

```bash
supabase functions deploy invite-president
supabase secrets set APP_URL=https://TU-USUARIO.github.io/elite-league/ ALLOWED_ORIGINS=https://TU-USUARIO.github.io,https://tudominio.com
```

`APP_URL` debe ser la URL pública exacta de la web, incluido `/elite-league/` si usas GitHub Pages de proyecto. Después, en **Administración → Invitar presidente de club**, introduce nombre, correo y club. La persona recibirá un enlace seguro para elegir su contraseña.

### 4. Nombrar el primer administrador

Después de crear la cuenta del organizador, localiza su UUID en `Authentication → Users` y ejecuta este SQL sustituyendo los marcadores:

```sql
update public.profiles
set global_role = 'admin', display_name = 'Nombre del administrador'
where id = 'UUID_DEL_ADMIN';

insert into public.club_memberships (club_id, user_id, role)
select c.id, 'UUID_DEL_ADMIN', 'president'
from public.clubs c
where c.slug = 'pico-fc'
on conflict (club_id, user_id) do update set role = excluded.role, is_active = true;
```

Así la misma cuenta tendrá dos permisos independientes: presidente de Pico FC y administrador global. No existe ningún bypass basado en el nombre de un club dentro del frontend.

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

- Formato definitivo de playoffs por cada split.
- Orden final de desempates si la tabla sigue igualada.
- Sanciones por amarillas, tarjeta azul e incomparecencias.
- Quién puede confirmar resultados y cómo se resuelven incidencias.
- Hora límite, visibilidad y reapertura de las alineaciones.

## Publicar con GitHub Pages

El proyecto incluye un flujo de GitHub Actions en `.github/workflows/deploy.yml`. El repositorio público [ImPaul17/elite-league](https://github.com/ImPaul17/elite-league) ya está creado y vacío; la configuración de variables está en curso. La subida del código y el primer despliegue siguen pendientes.

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

El dominio ya está registrado en DigitalPlat y se conserva; cambiar de alojamiento no requiere registrar otro. Su conexión a GitHub Pages está pendiente.

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
