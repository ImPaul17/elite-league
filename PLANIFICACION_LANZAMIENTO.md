# Hoja de planificación — lanzamiento de Elite League

Actualizada el domingo 6 de septiembre de 2026. Sustituye la planificación anterior.

**Entrega objetivo: lunes 7 de septiembre de 2026 a las 23:00, hora de Madrid (11 pm).**

La entrega incluye la web pública, el login real y las funciones de gestión que no dependen de jugadores. La incorporación de jugadores y sus funciones asociadas queda para una fase posterior. La hora de estreno del tráiler y de los anuncios está pendiente de confirmar; las 23:00 son el plazo de entrega de la web.

## Resultado que queremos entregar

- Web publicada y accesible desde ordenador y móvil.
- Acceso real de administración y presidentes: iniciar sesión, cerrar sesión, recuperar contraseña y conservar la sesión al recargar.
- Permisos por rol y por club; cambios de gestión guardados y visibles para otros visitantes.
- Calendario y fecha de inicio del tercer split confirmados y visibles.
- Noticias completas, anuncio del regreso y tráiler integrados.
- Página de patrocinadores con el material que facilite Pablo.
- Equipos, escudos, histórico, clasificación y partidos revisados, manteniendo el estilo ya acordado.
- Plantillas y estadísticas individuales presentadas como pendientes de incorporación; los formularios que necesitan jugadores no deben invitar a realizar acciones imposibles.

El login y la persistencia son requisitos de esta entrega. Dejarlos como demostración, ocultarlos o aplazarlos no cumpliría el objetivo.

## Punto de partida comprobado

| Área | Estado del proyecto local | Pendiente |
| --- | --- | --- |
| Equipos, clasificación y partidos | Ya implementados, con histórico y diseños propios. | Revisión final y comprobación con datos reales del servidor. |
| Login y cuentas | Supabase conectado; registro abierto y anónimo desactivados; URL final y enlaces de invitación/recuperación configurados. | Crear las cuentas autorizadas y probar correo, acceso, recuperación y permisos por rol. |
| Administración | Hay formularios de resultados, fechas, noticias e invitaciones. | Comprobar que guardan, que respetan permisos y que los cambios llegan a la web pública. |
| Noticias | Listado y detalle básicos; el artículo sigue mostrando texto genérico. | Cuerpo real, portada, vídeo/enlace y gestión editorial útil. |
| Split 3 | 66 partidos cargados; fechas y horas pendientes. | Recibir el calendario definitivo, cargarlo y mostrarlo en todas las vistas. |
| Patrocinadores | No hay una página implementada. | Página, enlaces, logos y orden de aparición. |
| Publicación | Dominio `eliteleague.qd.je` registrado en DigitalPlat y Supabase real preparado. Repositorio público [ImPaul17/elite-league](https://github.com/ImPaul17/elite-league) creado, todavía vacío; variables en configuración. | Confirmar la retirada de la copia remota subida por error, subir el código revisado, terminar variables y Pages, publicar y conectar el dominio. DNS sin cambiar; aplicación pública todavía sin verificar. |

La presencia de código no cuenta como prueba de funcionamiento en producción. Las comprobaciones de cierre están definidas más abajo.

### Avance de infraestructura comprobado el 6 de septiembre

- Supabase: proyecto `ujsexqffgmkxzyvvholp` inicializado con las dos migraciones y el seed corregidos. Se verifican 12 clubes, 11 jornadas, 66 partidos, cero jugadores y cero noticias de muestra.
- RLS y permisos: las consultas anónimas a perfiles, membresías y auditoría no exponen datos; el rol autenticado no puede actualizar `profiles.global_role`.
- La función `invite-president` está desplegada, con `APP_URL` y `ALLOWED_ORIGINS` configurados. Rechaza solicitudes sin sesión o con token inválido (401). La sesión y el rol administrador se validan dentro de la función; no se usa la comprobación de firma heredada del gateway.
- El login local muestra correo y contraseña, sin selector de cuentas demo. No se han creado ni invitado usuarios todavía.
- Corregida la sincronización de sesiones para evitar bloqueos y descartar respuestas privadas antiguas al salir o cambiar de cuenta. Los enlaces de invitación se validan antes de mostrar una sesión previa. La compilación exige variables de conexión reales. Validación final: 20/20 pruebas y build correctos; falta la prueba E2E con cuentas autorizadas.
- El panel de DigitalPlat y su gestor de archivos ya están accesibles. Se subió por error una carpeta completa llamada `Elite League` dentro de `/htdocs`, en lugar del contenido de la compilación preparada. Pablo ha autorizado retirar esa copia remota; la retirada está en curso y todavía no se ha confirmado. No equivale a una publicación correcta de la aplicación y no se deben borrar los originales locales.
- Pablo ha autorizado cambiar al repositorio **público** [ImPaul17/elite-league](https://github.com/ImPaul17/elite-league), para versionar y seguir editando el proyecto, con despliegue mediante GitHub Pages. El repositorio ya está creado y vacío; las variables están en configuración y el código aún no se ha subido. Los DNS de `eliteleague.qd.je` no se han cambiado. El registro del dominio en DigitalPlat se conserva.
- Preparación del código: `.gitignore` excluye todos los `.env.*` salvo `.env.example`, las copias legacy que se conservan localmente, los compilados y los temporales de Supabase. La copia antigua del login contiene credenciales locales obsoletas y no debe entrar en ningún commit. Hay que volver a revisar los archivos preparados antes del primer push público.
- El paquete local `supabase/.temp/elite-league-web-20260906-auth-final.zip` queda como referencia de la compilación anterior, no como destino de la nueva publicación. Contiene 78 archivos generados exclusivamente desde `dist`, sin `.env`, SQL, PSD ni fuentes de código privadas; SHA-256 `11B2FC15AD7D497ACADE43BFEB6B6E0E33339EAB1E2FA0768E01B711655A1F80`. GitHub Actions generará y publicará su propio `dist`; no se suben los ZIP al repositorio.
- Para el primer despliegue hay que configurar las variables de repositorio `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`, seleccionar GitHub Actions como origen de Pages y comprobar la ejecución en `main`. Después se configura primero el dominio personalizado en GitHub y luego el DNS; con este flujo no se necesita un archivo `CNAME`. Falta validar el certificado y activar HTTPS, sin omitir advertencias del navegador.
- Falta configurar SMTP para las invitaciones y recuperaciones de los presidentes. El servicio de correo predeterminado de Supabase no sirve para enviar a usuarios externos del proyecto ([documentación](https://supabase.com/docs/guides/auth/auth-smtp)).
- No dar por completados el login, las invitaciones, la publicación ni el plazo de entrega hasta pasar las pruebas reales indicadas abajo.

## Trabajo por bloques

Todas las filas son necesarias para el alcance descrito, salvo los elementos dependientes de jugadores. Los tiempos son orientativos y se ajustarán al comprobar la conexión y los correos.

| Orden | Bloque | Entregable / criterio de cierre | Responsable propuesto | Dependencia |
| --- | --- | --- | --- | --- |
| 1 | Publicación y base de datos | Repositorio público revisado, despliegue automático en GitHub Pages y dominio con HTTPS; conexión real y datos públicos correctos, conservando los recursos visuales e históricos actuales. Retirada confirmada de la copia remota errónea. | Codex + Pablo para las cuentas | Acceso a GitHub y DNS; Supabase ya preparado. |
| 2 | Login y recuperación | Acceso y salida correctos, sesión persistente, contraseña incorrecta controlada, recuperación por correo y enlaces válidos en el dominio final. | Codex; Pablo comprueba su correo/cuenta | Bloque 1 y correo remitente configurado. |
| 3 | Roles e invitaciones | Administrador operativo; presidente vinculado a su club; invitación y primer acceso probados con una cuenta de prueba autorizada. | Codex + Pablo | Bloque 2 y asignaciones de cuentas. |
| 4 | Panel y datos persistentes | Administrar fechas, horas y resultados, incluidos penaltis y correcciones. Ver los cambios al recargar y desde otra sesión. | Codex | Bloques 1–3. |
| 5 | Noticias | Crear y editar título, resumen, cuerpo y portada; destacar, publicar y retirar una noticia. Incluir el tráiler mediante vídeo o enlace. Sustituir las noticias de ejemplo. | Codex; Pablo aprueba contenido | Texto, portada y URL del tráiler. La programación automática no es necesaria si se publica manualmente. |
| 6 | Calendario e información | Fecha de inicio, jornadas, horas y fases finales coherentes en Inicio, Partidos y fichas de equipo. Reglas y comunicados revisados. | Pablo confirma; Codex integra | Una única lista definitiva de fechas e información. |
| 7 | Tráiler del tercer split | Guion, selección de material, montaje, revisión, exportación, miniatura y vídeo subido con enlace comprobable. | Pablo | Material audiovisual, mensaje principal y fechas aprobadas. |
| 8 | Patrocinadores | Página terminada con nombres, logos, enlaces y jerarquía acordada. | Codex; Pablo facilita material | Lista y recursos de patrocinadores. |
| 9 | Acabado público | Inicio preparado para el regreso; contenido claro; selectores, tamaños, colores y animaciones coherentes. Estados sin jugadores resueltos. | Codex + revisión visual de Pablo | Bloques editoriales anteriores. |
| 10 | Pruebas y entrega | Recorrido completo en móvil y escritorio, acceso real, persistencia, enlaces y versión final comprobados. | Codex + revisión final de Pablo | Todo lo anterior. |

La secuencia técnica más importante es: **publicación de prueba → conexión real → login y permisos → gestión persistente → prueba completa**. El tráiler y los textos pueden avanzar en paralelo.

## Calendario propuesto

Horario de Madrid. Son bloques de trabajo propuestos, no tareas programadas automáticamente ni compromisos de disponibilidad. Las pausas entre bloques quedan libres.

| Día y hora | Web — Codex | Tráiler e información — Pablo | Punto de control |
| --- | --- | --- | --- |
| Domingo 6, 10:00–13:00 | Preparar publicación de prueba y conexión real; revisar datos y acceso existente. | Cerrar el mensaje del regreso, guion del tráiler y lista de fechas pendientes. Facilitar las cuentas de servicio necesarias. | Saber dónde se publica y tener resuelta la conexión antes de avanzar con el panel. |
| Domingo 6, 14:00–18:00 | Login, recuperación, roles e invitaciones; probar permisos y sesión persistente. | Seleccionar recursos y montar la primera versión del tráiler; cerrar calendario con la organización. | Acceso real probado con administrador y presidente de prueba. |
| Domingo 6, 18:00–21:00 | Guardado de horarios/resultados y construcción de Noticias. | Primera revisión del tráiler; preparar comunicado, portada y material de patrocinadores. | Una modificación persiste y la ve otra sesión. Noticia completa en la versión de prueba. |
| Domingo 6, 21:00–21:30 | Revisar bloqueos y ajustar el lunes según resultados reales. | Revisar primer montaje y confirmar qué material falta. | No dejar problemas de conexión o correo para la última hora del lunes. |
| Lunes 7, 09:00–12:00 | Cerrar Noticias, integrar calendario y revisar Competición. | Terminar fechas y textos oficiales; correcciones del tráiler. | Calendario, reglas y contenido editorial confirmados a las 12:00. |
| Lunes 7, 13:00–16:00 | Patrocinadores, Inicio y ajustes para la versión sin jugadores. | Exportar el tráiler, preparar miniatura, subirlo y comprobar audio e imagen. | Versión completa de la web para revisar; vídeo listo o procesándose. |
| Lunes 7, 16:00–19:00 | Pruebas de acceso, recuperación, permisos, noticias, resultados y móvil. Integrar enlace definitivo del vídeo. | Ver el tráiler completo y revisar fechas, textos y marcas en la web. | Tráiler y recursos finales entregados antes de las 18:00; lista concreta de fallos a las 19:00. |
| Lunes 7, 19:00–21:00 | Corregir fallos y comprobar la publicación final. | Dar conformidad al contenido y a la hora de los anuncios. | Cerrar funcionalidades a las 21:00. |
| Lunes 7, 21:00–22:30 | Margen reservado para incidencias y revisión final en la URL pública. | Última comprobación del anuncio, tráiler y enlaces. | Versión aprobada y copia recuperable antes de las 22:30. |
| Lunes 7, 22:30–23:00 | Verificar la versión entregada y registrar cualquier pendiente explícito. | Publicar los anuncios si se ha acordado esa hora. | Web entregada antes de las 23:00. |

## Información y decisiones que desbloquean el trabajo

| Necesitamos | Momento propuesto | Para qué |
| --- | --- | --- |
| Acceso a GitHub y gestión DNS para ejecutar el destino ya autorizado: `ImPaul17/elite-league` público, GitHub Pages y `eliteleague.qd.je` | Domingo, primer bloque | Publicación y dominio; Supabase ya está preparado. Las contraseñas y claves privadas no se comparten por el chat. |
| Identificar al administrador inicial y una cuenta propia de prueba de presidente, con su club | Domingo, antes de probar accesos | Comprobar los dos roles y el correo real. Las invitaciones a presidentes se enviarán cuando Pablo indique destinatarios y momento. |
| Calendario único: jornada, fecha, hora y posibles excepciones por partido; inicio y fases finales | Lunes, 12:00 | Evitar diferencias entre tráiler, noticia, calendario y fichas. |
| Texto del regreso, información de la competición y enlaces sociales | Lunes, 12:00 | Cerrar Inicio, Noticias y Competición. |
| Patrocinadores: nombre, logo, enlace y orden de aparición | Lunes, 12:00 | Terminar esa página con contenido real. |
| Tráiler final, miniatura y URL; confirmar hora de estreno | Lunes, 18:00 | Dejar tiempo para procesar el vídeo y comprobarlo integrado en la web. |

## Qué quiere decir «sin jugadores»

No se cargarán jugadores, fotos, dorsales ni estadísticas individuales. El portal de cada presidente sí debe permitir entrar y consultar su club y calendario. Las plantillas tendrán un mensaje claro de incorporación pendiente; registro de jugadores, alineaciones y eventos individuales quedarán inactivos o fuera de la navegación hasta esa fase.

Los resultados por equipo, penaltis y clasificación sí deben funcionar sin jugadores. Los cruces de play-offs seguirán mostrando **«Por decidir»**, como se pidió, hasta conocer los participantes; revisaremos el formato y las fechas. Tampoco se publicarán resultados de prueba como si fueran partidos reales.

## Pruebas que deben pasar para dar la entrega por terminada

- [ ] Confirmar la retirada de `/htdocs/Elite League` del alojamiento anterior, conservando los originales locales.
- [ ] Revisar el primer commit público: sin variables privadas, credenciales antiguas, copias legacy ni material privado. Confirmar el repositorio remoto y el despliegue de GitHub Actions.
- [ ] Verificar `eliteleague.qd.je` apuntando a la publicación correcta, con certificado válido y HTTPS obligatorio; comprobar que un cambio posterior en `main` puede publicarse mediante el mismo flujo.
- [ ] Entrar con una cuenta real, recargar y mantener la sesión; cerrar sesión y perder el acceso privado.
- [ ] Recibir y completar la recuperación de contraseña desde un enlace válido; tratar correctamente enlaces caducados y credenciales incorrectas.
- [ ] Completar una invitación y abrir el portal del club correcto con la cuenta de prueba.
- [ ] Un visitante no puede escribir; un presidente no puede administrar otro club ni la competición, ni convertirse en administrador modificando su perfil. Verificarlo también en los permisos del servidor.
- [ ] Guardar un horario y comprobarlo desde otra sesión tras recargar.
- [ ] Probar un resultado normal y otro con penaltis en el entorno de prueba; comprobar puntos y corrección del marcador.
- [ ] Revisar que clasificación y resultados públicos usan los datos oficiales, incluidos ajustes de puntos si se aplican.
- [ ] Crear, editar, publicar y retirar una noticia; comprobar cuerpo, portada y vídeo en Inicio, listado y detalle.
- [ ] Comprobar las 11 jornadas y los 66 cruces contra el calendario final, así como las fechas de las fases finales acordadas.
- [ ] Ver el tráiler entero y comprobar que sus fechas coinciden con la web y el comunicado.
- [ ] Revisar todos los patrocinadores y sus enlaces.
- [ ] Verificar navegación, selectores de splits, fichas, visor de escudos, tablas y formularios en móvil y escritorio; mantener el diseño existente.
- [ ] Compilación y pruebas pertinentes correctas; comprobar rutas directas, recarga, imágenes y enlaces en la URL alojada.
- [ ] Producción con login real, sin selector de cuentas demo, noticias de muestra ni cambios de prueba.
- [ ] Versión final y copia recuperable identificadas; revisión final de Pablo completada.

## Si aparece un bloqueo

Si el domingo por la tarde no funciona la conexión, el correo o el acceso real, pasa a ser la primera tarea y se ajusta el tiempo de pulido visual. El login se mantiene dentro del alcance; no se dará por terminado con una demostración.

Si faltan fechas o patrocinadores en sus puntos de control, se terminará la estructura y se registrará qué contenido falta. Esa sección seguirá pendiente, sin inventar datos ni marcarla como entregada. Si el fallo impide cumplir las 23:00, se comunicará en cuanto se detecte para decidir el ajuste de plazo o alcance.

A partir del lunes a las 21:00, el plan reserva el trabajo para correcciones y publicación. Los cambios nuevos de diseño se valorarán aparte para proteger el margen de comprobación.
