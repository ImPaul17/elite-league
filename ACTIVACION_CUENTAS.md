# Activar las cuentas por usuario

Estado comprobado el 6 de septiembre de 2026: migración 0003 aplicada, `club-accounts` desplegado, invitaciones antiguas desactivadas y doce cuentas reales creadas y vinculadas. Login, aislamiento de perfiles y clubes, y bloqueo de gestión con contraseña temporal verificados para las doce cuentas. Solo `pablo.pico` tiene administración. No depende de SMTP. Falta la prueba completa del primer cambio de contraseña por el titular y las operaciones de gestión con una sesión ya desbloqueada.

## Actualización del proyecto existente

1. Revisar y ejecutar solo `supabase/migrations/0003_username_accounts_and_news_audit.sql`. No repetir 0001, 0002 ni el seed en producción.
2. Desplegar `club-accounts` y la versión desactivada de `invite-president`. La configuración versionada mantiene verificación de identidad dentro de las funciones (`auth.getUser`) y comprueba el rol en `profiles`, nunca en metadatos modificables por el usuario.
   - Atención al editor del Dashboard: una función nueva se crea con `verify_jwt: true`, aunque el archivo local diga lo contrario. La opción recomendada para este código con validación propia es **Verify JWT with legacy secret: OFF**; ese ajuste manual corresponde al propietario. Estado real comprobado: sigue ON y las sesiones actuales son aceptadas por el gateway; `list` llega al bloqueo por contraseña temporal (403) y `change-password` llega al validador (400 ante contraseña vacía). No existe un bloqueo `Invalid JWT` en estas pruebas. Si cambia la firma de las sesiones, revisar la compatibilidad antes de publicarla. No cambiar claves de firma ni otros ajustes automáticamente. Los redespliegues desde Code conservan el ajuste. [Código oficial del editor](https://github.com/supabase/supabase/blob/master/apps/studio/pages/project/%5Bref%5D/functions/new.tsx).
3. Mantener `ALLOWED_ORIGINS` limitado a los orígenes de la web y localhost de desarrollo. Las claves `SUPABASE_SERVICE_ROLE_KEY` se utilizan solo en el servidor, nunca en Vite ni GitHub.
4. Después de comprobar el servicio, publicar el frontend en GitHub Pages. No dar por terminado el acceso por ver una compilación correcta.

`node scripts/prepare-launch-update.mjs` genera un ayudante local en `supabase/.temp/launch-update.html` con SQL y código agrupado para el editor del panel. No ejecuta SQL, no despliega ni crea cuentas; la carpeta está excluida de Git.

## Primer administrador

La aplicación no permite crear administradores desde el navegador. La primera cuenta será `pablo.pico`. Se crea desde Authentication → Users → Add user → Create new user del proyecto Supabase, con confirmación automática y una contraseña temporal privada. No usar Invite ni insertar filas manualmente en `auth.users` o `auth.identities`.

Supabase Auth conserva internamente el identificador `nombre--club@accounts.eliteleague.qd.je`: para Pablo, `pablo--pico@accounts.eliteleague.qd.je`. **No es un correo de contacto ni se envían mensajes**. La interfaz pública pide únicamente usuario y contraseña. El formato visible es `nombre.clubabreviado`, con letras ASCII minúsculas o números, sin apellidos, tildes ni espacios: 1–24 caracteres antes del único punto y 1–20 después. Se normalizan mayúsculas y espacios exteriores; no se admiten guiones, barras o espacios interiores. La sustitución del único punto por `--` es inequívoca.

Una vez creada la cuenta y comprobado su UUID real, el operador del proyecto asigna el perfil usando una consulta acotada a ese UUID:

```sql
update public.profiles
set username = 'USUARIO_NORMALIZADO', display_name = 'Pablo',
    global_role = 'admin', must_change_password = true
where id = 'UUID_VERIFICADO';
```

No ejecutar los marcadores literalmente. Si también va a presidir Pico FC, añadir la membresía correspondiente a ese mismo UUID. La contraseña temporal debe cambiarse desde «Mi cuenta» antes de utilizar administración.

## Presidentes

En Administración → Usuarios de los clubes: introducir nombre, usuario, club y contraseña temporal de exactamente seis dígitos más una letra o símbolo final (`! @ # $ % & ?`): siete caracteres en total. Antes de aprovisionar, comprobar que la política de Supabase permite estas temporales; no debilitar los ajustes del proveedor automáticamente. Son contraseñas cortas para el primer acceso, no definitivas: entregar cada una en privado y cambiarla cuanto antes por una distinta de 12–128 caracteres. Cada persona tendrá una temporal diferente. No se envía correo ni se guardan contraseñas en tablas o auditoría.

`node scripts/prepare-president-credentials.mjs RUTA_ABSOLUTA_FUERA_DEL_PROYECTO` prepara un archivo privado con credenciales aleatorias para los doce clubes activos. No crea cuentas ni conecta con Supabase; el archivo indica expresamente que está pendiente de activar. No subirlo a GitHub ni servirlo desde la web. No sobrescribe credenciales ya preparadas.

Usuarios creados y comprobados: `pablo.pico`, `alvaro.coca`, `juan.urss`, `bea.bee`, `dani.mugiwaras`, `alfonso.impuestos`, `maki.maki`, `adrian.lego`, `alvaro.rayo`, `pedro.estaross`, `isaac.karasuno` y `dani.caudillo`. Solo Pablo tiene administración; las otras once cuentas tienen acceso a su club. Las credenciales temporales se conservan únicamente en un documento privado fuera del proyecto. No repetir su creación.

En el primer acceso se exige cambiar la contraseña. «Mi cuenta» solicita la actual y una nueva distinta. Administración puede restablecer el acceso de un presidente, pero no cambiar la contraseña de otro administrador desde este formulario. Si se pierde la cuenta administrativa, la recuperación corresponde al propietario del proyecto en Supabase.

Los errores parciales indican si la cuenta o la contraseña ya han cambiado: no repetir una creación confirmada. Si falla auditoría después de cambiar una contraseña, el servidor devuelve una advertencia sin fingir que el cambio falló.

## Prueba de aceptación pendiente

Ya comprobado con Supabase real: doce inicios de sesión y cierres de las sesiones de prueba; un único perfil y una membresía propia visibles por cuenta; `is_admin` y `can_manage_club` bloqueados mientras la contraseña sea temporal; `club-accounts` e `invite-president` rechazan la gestión con esa sesión. El validador del cambio de contraseña recibe la sesión sin modificar ninguna contraseña en estas pruebas. No se han escrito noticias ni resultados de prueba en producción.

- Entrar, recargar y salir con una cuenta autorizada.
- Usar contraseña temporal y comprobar que administración/gestión del club queda bloqueada hasta cambiarla.
- Cambiar contraseña; comprobar que la antigua ya no inicia sesión.
- Crear un presidente vinculado al club correcto y restablecer su contraseña desde administración.
- Comprobar que otro presidente y un visitante no pueden invocar acciones administrativas ni modificar `global_role`, `username` o `must_change_password` directamente.
- Guardar un borrador, publicar, editar y retirar una noticia; verificar RLS y auditoría en sesiones diferentes.

No se han creado cuentas de prueba ni datos ficticios en producción durante las pruebas locales.
