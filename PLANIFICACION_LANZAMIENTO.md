# Hoja de planificación — lanzamiento de Elite League

Actualizada el domingo 6 de septiembre de 2026. Sustituye la planificación anterior.

**Entrega objetivo: lunes 7 de septiembre de 2026 a las 23:00, hora de Madrid (11 pm).**

La entrega incluye la web pública, el login real y las funciones de gestión que no dependen de jugadores. La incorporación de jugadores y sus funciones asociadas queda para una fase posterior. La hora de estreno del tráiler y de los anuncios está pendiente de confirmar; las 23:00 son el plazo de entrega de la web.

### Decisión actual de acceso — confirmada por Pablo el 6 de septiembre

El acceso será con **nombre de usuario asignado por la organización y contraseña temporal**, no con un correo electrónico. Cada presidente podrá cambiar la contraseña desde su panel. La recuperación de una cuenta se resolverá mediante restablecimiento por administración, sin exigir SMTP ni invitaciones por correo. Las referencias anteriores a SMTP describen la preparación inicial, no una dependencia del nuevo lanzamiento.

Frontend y función segura de cuentas implementados. Migración 0003 aplicada y funciones desplegadas; doce cuentas autorizadas creadas, sin iniciales de apellidos, con formato `nombre.club`. Login y asignación de permisos comprobados con Supabase real para las doce. Solo `pablo.pico` tiene administración. Pablo ya ha cambiado su contraseña y accede a la lista administrativa real; las otras once cuentas siguen pendientes de cambiar su temporal. Faltan las operaciones de escritura de gestión desbloqueadas.

Reorganización posterior acordada: todos acceden por «Mi equipo» y Pablo tiene dentro «Panel de administración». Vista previa de cada presidente en solo lectura, sin suplantar sesiones; ficha privada con información, palmarés, plantilla pendiente y jornadas. Retirados los formularios de crear cuentas y configurar jornadas/plazos. El restablecimiento muestra/copia solo la nueva temporal, nunca la contraseña actual. 71 pruebas y build correctos; QA real de navegación y móvil y comparación aislada de las 60 fichas públicas, sin diferencias. Véase `ACTIVACION_CUENTAS.md` para las pruebas y el requisito de la RPC antes de activar jugadores.

Vista de presidentes ampliada a toda la web: identidad efectiva, escudo y permisos visibles permanecen al navegar, con Mi cuenta y Mi equipo propios. Barra global para cambiar de usuario o regresar a administración; sin cambiar sesiones ni permitir escrituras. La vista administrativa abre directamente el panel, sin pedir cambiar contraseñas ni simular un inicio de sesión. El cambio de contraseña temporal sigue siendo obligatorio para el propietario en su acceso real. Validación de la ampliación inicial: 84 pruebas y compilación correctas, navegación pública/privada y móvil revisados.

Avance en revisión: acceso por usuario, gestión de presidentes, cambio obligatorio de contraseña, editor completo de Noticias, página de Patrocinadores en espera del material, estados sin jugadores y mejoras de accesibilidad. 59 pruebas unitarias y compilación correctas; QA local del borrador → publicación → retirada comprobada sin escribir en producción. Esta actualización de código ya está en `main` (`b10dc01`), con [despliegue de GitHub Pages correcto](https://github.com/ImPaul17/elite-league/actions/runs/34012888966) a las 07:01 de Madrid del 6 de septiembre. Todavía no se ha probado el guardado con una cuenta real desbloqueada. DNS autoritativo y Cloudflare correctos; la caché del router conserva la IP anterior y el certificado HTTPS de GitHub para el dominio aún no es válido. No probar credenciales en el dominio hasta resolver HTTPS.

## Resultado que queremos entregar

- Web publicada y accesible desde ordenador y móvil.
- Acceso real de administración y presidentes con usuario: iniciar sesión, cerrar sesión, cambiar la contraseña temporal y conservar la sesión al recargar. Restablecimiento por administración si se pierde el acceso.
- Permisos por rol y por club; cambios de gestión guardados y visibles para otros visitantes.
- Calendario y fecha de inicio del tercer split confirmados y visibles.
- Noticias completas, anuncio del regreso y tráiler integrados.
- Página de patrocinadores con el material que facilite Pablo.
- Equipos, escudos, histórico, clasificación y partidos revisados, manteniendo el estilo ya acordado.
- Plantillas y estadísticas individuales presentadas como pendientes de incorporación; los formularios que necesitan jugadores no deben invitar a realizar acciones imposibles.

El login y la persistencia son requisitos de esta entrega. Dejarlos como demostración, ocultarlos o aplazarlos no cumpliría el objetivo.

## Punto de partida comprobado

| Área | Estado comprobado | Pendiente |
| --- | --- | --- |
| Equipos, clasificación y partidos | Ya implementados, con histórico y diseños propios. | Revisión final y comprobación con datos reales del servidor. |
| Login y cuentas | Migración y funciones desplegadas; doce cuentas reales creadas y login, club y bloqueo temporal comprobados. | Probar cambio temporal/restablecimiento y sesión persistente desde la interfaz. |
| Administración | Dentro de Mi equipo: resultados, noticias y restablecimientos; vista previa de presidentes. Sin creación de cuentas ni editor de fechas/plazos. | Comprobar escrituras reales autorizadas, permisos y visibilidad pública. Integrar las fechas definitivas cuando se faciliten. |
| Noticias | Editor completo y auditoría editorial desplegada: cuerpo, portada por URL, enlace al tráiler, borradores, edición, publicación, retirada y destacado. | Flujo editorial local comprobado. Probar escrituras reales con administrador desbloqueado e integrar contenido aprobado. |
| Split 3 | 66 partidos cargados; fechas y horas pendientes. | Recibir el calendario definitivo, cargarlo y mostrarlo en todas las vistas. |
| Patrocinadores | Página implementada con estado «Próximamente», sin marcas ficticias. | Incorporar enlaces, logos y orden de aparición confirmados. |
| Publicación | Código en `main` de [ImPaul17/elite-league](https://github.com/ImPaul17/elite-league), variables Supabase guardadas y primer despliegue de Pages correcto. Propiedad del dominio verificada por GitHub; delegación y DNS autoritativos correctos. | Confirmar actualización de cachés DNS, comprobación DNS de Pages y HTTPS; comprobar la aplicación alojada. Completar y confirmar la retirada manual de la copia remota subida por error al alojamiento anterior. |

La presencia de código no cuenta como prueba de funcionamiento en producción. Las comprobaciones de cierre están definidas más abajo.

### Registro inicial de infraestructura del 6 de septiembre

Las entradas siguientes conservan el primer despliegue como referencia histórica. El estado más reciente de cuentas y migraciones figura arriba y en `ACTIVACION_CUENTAS.md`.

- Supabase: proyecto `ujsexqffgmkxzyvvholp` inicializado con las dos migraciones y el seed corregidos. Se verifican 12 clubes, 11 jornadas, 66 partidos, cero jugadores y cero noticias de muestra.
- RLS y permisos: las consultas anónimas a perfiles, membresías y auditoría no exponen datos; el rol autenticado no puede actualizar `profiles.global_role`.
- La función `invite-president` está desplegada, con `APP_URL` y `ALLOWED_ORIGINS` configurados. Rechaza solicitudes sin sesión o con token inválido (401). La sesión y el rol administrador se validan dentro de la función; no se usa la comprobación de firma heredada del gateway.
- El login local muestra usuario y contraseña, sin selector de cuentas demo cuando Supabase está conectado. No se han creado ni invitado usuarios todavía.
- Corregida la sincronización de sesiones para evitar bloqueos y descartar respuestas privadas antiguas al salir o cambiar de cuenta. Los enlaces de invitación se validan antes de mostrar una sesión previa. La compilación exige variables de conexión reales. Validación final: 20/20 pruebas y build correctos; falta la prueba E2E con cuentas autorizadas.
- La carpeta remota `/htdocs/Elite League`, subida por error al alojamiento anterior, **no se ha podido eliminar** con el gestor, tampoco manualmente según Pablo. A petición suya, se han cerrado Filemanager y el panel de alojamiento y se continúa con GitHub. La copia remota sigue pendiente de retirada; cerrar los paneles o cambiar el DNS no la borra. No se han borrado los originales locales ni cancelado la cuenta de alojamiento.
- El repositorio **público** [ImPaul17/elite-league](https://github.com/ImPaul17/elite-league) ya contiene 126 archivos revisados en `main`, commit `f5ac956`. Las dos variables públicas de Supabase están guardadas y Pages usa GitHub Actions. La [ejecución 34008474567](https://github.com/ImPaul17/elite-league/actions/runs/34008474567) terminó correctamente.
- El primer commit excluye variables privadas, copias legacy, compilados y temporales de Supabase. `.env.example` sí está incluido. Las copias históricas se conservan sólo en local; no deben añadirse en cambios futuros. Los ZIP de preparación también siguen excluidos: GitHub Actions genera y publica su propio `dist`.
- `eliteleague.qd.je` está guardado como dominio personalizado en Pages. Se restauró DigitalPlat DNS desde la delegación anterior y se registraron cuatro A en `@` (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, TTL 300), CNAME `www` hacia `impaul17.github.io.` y el TXT de propiedad solicitado por GitHub. El destino CNAME es absoluto, con punto final.
- El reintento de configuración en DigitalPlat resolvió la delegación: los cuatro servidores del padre `qd.je` apuntan a `dns1.digitalplat.org` y `dns2.digitalplat.org`. Ambos nodos autoritativos devuelven los cuatro A, el CNAME de `www` y el TXT correctos. DigitalPlat muestra **Activo**, con la misma serie primaria y secundaria (`2026090606`). GitHub confirma **Successfully verified eliteleague.qd.je / Verified**.
- Siguen pendientes las cachés de los resolutores públicos —la local todavía devuelve la IP anterior—, la comprobación DNS de Pages, el certificado para el dominio y HTTPS obligatorio, y la revisión de la aplicación pública. La comprobación TLS del destino nuevo aún no valida el dominio; HTTPS se mantiene pendiente hasta que el certificado esté disponible. El registro del dominio en DigitalPlat se conserva. La propiedad verificada y un despliegue de Actions correcto no sustituyen estas comprobaciones.
- SMTP no es una dependencia del acceso por usuario acordado. La función antigua se desactiva en la actualización; no se enviarán invitaciones por correo.
- No dar por completados el login, las invitaciones, la publicación ni el plazo de entrega hasta pasar las pruebas reales indicadas abajo.

## Trabajo por bloques

Todas las filas son necesarias para el alcance descrito, salvo los elementos dependientes de jugadores. Los tiempos son orientativos y se ajustarán al comprobar la conexión y las cuentas.

| Orden | Bloque | Entregable / criterio de cierre | Responsable propuesto | Dependencia |
| --- | --- | --- | --- | --- |
| 1 | Publicación y base de datos | Repositorio público revisado, despliegue automático en GitHub Pages y dominio con HTTPS; conexión real y datos públicos correctos, conservando los recursos visuales e históricos actuales. Retirada confirmada de la copia remota errónea. | Codex + Pablo para las cuentas | Acceso a GitHub y DNS; Supabase ya preparado. |
| 2 | Login y contraseña | Acceso por usuario, salida correcta, sesión persistente, contraseña incorrecta controlada y cambio de contraseña desde el panel. | Codex; Pablo prueba su cuenta | Supabase y cuentas autorizadas; HTTPS para la prueba pública. |
| 3 | Roles y cuentas | Doce cuentas ya creadas; Mi equipo, panel anidado y vista previa de cada presidente. Primer acceso y restablecimiento administrativo probados. No añadir más cuentas ahora. | Codex + Pablo | Bloque 2 y asignaciones de cuentas. No requiere correo. |
| 4 | Panel y datos persistentes | Administrar resultados, incluidos penaltis y correcciones. Ver los cambios al recargar y desde otra sesión. Fechas fijas cuando la organización las confirme, sin editor de plazos. | Codex | Bloques 1–3. |
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
| Domingo 6, 14:00–18:00 | Login por usuario, contraseñas, roles y cuentas; probar permisos y sesión persistente. | Seleccionar recursos y montar la primera versión del tráiler; cerrar calendario con la organización. | Acceso real probado con administrador y presidente de prueba. |
| Domingo 6, 18:00–21:00 | Guardado de horarios/resultados y construcción de Noticias. | Primera revisión del tráiler; preparar comunicado, portada y material de patrocinadores. | Una modificación persiste y la ve otra sesión. Noticia completa en la versión de prueba. |
| Domingo 6, 21:00–21:30 | Revisar bloqueos y ajustar el lunes según resultados reales. | Revisar primer montaje y confirmar qué material falta. | No dejar problemas de conexión o acceso para la última hora del lunes. |
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
| Identificar al administrador inicial y una cuenta propia de prueba de presidente, con su club | Domingo, antes de probar accesos | Comprobar los dos roles y el cambio/restablecimiento de contraseña. Crear solo cuentas autorizadas; introducir contraseñas en privado, no en el chat. |
| Calendario único: jornada, fecha, hora y posibles excepciones por partido; inicio y fases finales | Lunes, 12:00 | Evitar diferencias entre tráiler, noticia, calendario y fichas. |
| Texto del regreso, información de la competición y enlaces sociales | Lunes, 12:00 | Cerrar Inicio, Noticias y Competición. |
| Patrocinadores: nombre, logo, enlace y orden de aparición | Lunes, 12:00 | Terminar esa página con contenido real. |
| Tráiler final, miniatura y URL; confirmar hora de estreno | Lunes, 18:00 | Dejar tiempo para procesar el vídeo y comprobarlo integrado en la web. |

## Qué quiere decir «sin jugadores»

No se cargarán jugadores, fotos, dorsales ni estadísticas individuales. El portal de cada presidente sí debe permitir entrar y consultar su club y calendario. Las plantillas tendrán un mensaje claro de incorporación pendiente; registro de jugadores, alineaciones y eventos individuales quedarán inactivos o fuera de la navegación hasta esa fase.

Los resultados por equipo, penaltis y clasificación sí deben funcionar sin jugadores. Los cruces de play-offs seguirán mostrando **«Por decidir»**, como se pidió, hasta conocer los participantes; revisaremos el formato y las fechas. Tampoco se publicarán resultados de prueba como si fueran partidos reales.

## Pruebas que deben pasar para dar la entrega por terminada

- [ ] Confirmar la retirada de `/htdocs/Elite League` del alojamiento anterior, conservando los originales locales.
- [x] Primer commit público revisado (`f5ac956`, 126 archivos): sin variables privadas, credenciales antiguas, copias legacy ni material privado. Repositorio remoto confirmado y primer despliegue de GitHub Actions correcto.
- [x] Delegación y registros autoritativos de `eliteleague.qd.je` comprobados; GitHub confirma la propiedad del dominio como Verified.
- [ ] Verificar `eliteleague.qd.je` apuntando a la publicación correcta, con certificado válido y HTTPS obligatorio; comprobar que un cambio posterior en `main` puede publicarse mediante el mismo flujo.
- [ ] Entrar con una cuenta real, recargar y mantener la sesión; cerrar sesión y perder el acceso privado.
- [ ] Entrar con usuario y contraseña temporal; cambiarla en el panel, comprobar rechazo de la anterior y probar restablecimiento por administración.
- [ ] Crear una cuenta de presidente desde administración y abrir el portal del club correcto con la cuenta de prueba autorizada.
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

Si el domingo por la tarde no funciona la conexión o el acceso real, pasa a ser la primera tarea y se ajusta el tiempo de pulido visual. El login se mantiene dentro del alcance; no se dará por terminado con una demostración.

Si faltan fechas o patrocinadores en sus puntos de control, se terminará la estructura y se registrará qué contenido falta. Esa sección seguirá pendiente, sin inventar datos ni marcarla como entregada. Si el fallo impide cumplir las 23:00, se comunicará en cuanto se detecte para decidir el ajuste de plazo o alcance.

A partir del lunes a las 21:00, el plan reserva el trabajo para correcciones y publicación. Los cambios nuevos de diseño se valorarán aparte para proteger el margen de comprobación.

## Activación de la actualización local

El procedimiento incremental y los pendientes de prueba están en `ACTIVACION_CUENTAS.md`. La migración 0003 cambia permisos de cuentas y auditoría; el ayudante `scripts/prepare-launch-update.mjs` solo prepara código, no ejecuta cambios remotos. Los tests de credenciales usan servicios simulados, sin cuentas de prueba en producción.

### Cierre de esta tanda de desarrollo

- 58/58 tests y compilación de producción correctos en la tanda anterior. Corregidos marcadores vacíos convertidos en cero, penaltis inválidos y doble publicación por clic repetido. El formato final solicitado es `nombre.club`, sin iniciales de apellido, con contraseñas temporales de siete caracteres y definitivas de 12–128.
- Prueba local de Noticias: borrador oculto → publicación → detalle con párrafos/enlaces → retirada y vuelta a oculto. Sin datos ficticios en Supabase.
- Revisión visual a 390 × 844: título de Patrocinadores ajustado; «Mi cuenta» y cierre de sesión accesibles en el menú móvil. Acceso por usuario revisado en escritorio.
- Verificación de solo lectura en Supabase: 12 clubes, 11 jornadas, 66 partidos, cero jugadores/noticias; perfiles, membresías y auditoría protegidos frente a visitantes.
- Rama de preparación subida: `codex/preparacion-lanzamiento`, commit de código `cd0f536`. `main` y el despliegue público no deben actualizarse hasta activar Supabase y pasar la prueba real de acceso.
- SQL incremental y función `club-accounts` preparados en sus editores, **sin ejecutar ni desplegar**. La confirmación previa de cambio de permisos queda pendiente.

### Preparación de los doce accesos

- Usuarios definidos a partir del nombre sin apellidos y abreviaturas actuales; solo `pablo.pico` tendrá administración. Los otros once tendrán su membresía de presidente.
- Credenciales temporales únicas preparadas fuera del proyecto web y del repositorio, marcadas como pendientes de creación. No se han enviado contraseñas a GitHub ni se han creado usuarios todavía.
- Diagnóstico SQL de solo lectura en Supabase: cero usuarios Auth, cero administradores, cero membresías, cero columnas de la migración 0003 y doce clubes activos. La activación remota sigue pendiente.
- Ayudante local regenerado con el nuevo formato. No reutilizar código o SQL antiguo que haya quedado abierto en los editores del navegador.
