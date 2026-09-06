# Activar las cuentas por usuario

Estado: implementado y probado con servicios simulados; pendiente de activar y comprobar con cuentas reales. No depende de SMTP.

## Actualización del proyecto existente

1. Revisar y ejecutar solo `supabase/migrations/0003_username_accounts_and_news_audit.sql`. No repetir 0001, 0002 ni el seed en producción.
2. Desplegar `club-accounts` y la versión desactivada de `invite-president`. La configuración versionada mantiene verificación de identidad dentro de las funciones (`auth.getUser`) y comprueba el rol en `profiles`, nunca en metadatos modificables por el usuario.
3. Mantener `ALLOWED_ORIGINS` limitado a los orígenes de la web y localhost de desarrollo. Las claves `SUPABASE_SERVICE_ROLE_KEY` se utilizan solo en el servidor, nunca en Vite ni GitHub.
4. Después de comprobar el servicio, publicar el frontend en GitHub Pages. No dar por terminado el acceso por ver una compilación correcta.

`node scripts/prepare-launch-update.mjs` genera un ayudante local en `supabase/.temp/launch-update.html` con SQL y código agrupado para el editor del panel. No ejecuta SQL, no despliega ni crea cuentas; la carpeta está excluida de Git.

## Primer administrador

La aplicación no permite crear administradores desde el navegador. Pablo debe elegir el nombre de usuario inicial y establecer la contraseña de forma privada en Supabase. No compartirla por el chat.

Supabase Auth conserva internamente el identificador `usuario@accounts.eliteleague.qd.je`, confirmado al crear la cuenta administrativa. **No es un correo de contacto ni se envían mensajes**. La interfaz pública pide únicamente usuario y contraseña. Los usuarios se normalizan a minúsculas, con 3–32 caracteres ASCII: letras, números, punto, guion o guion bajo.

Una vez creada la cuenta y comprobado su UUID real, el operador del proyecto asigna el perfil usando una consulta acotada a ese UUID:

```sql
update public.profiles
set username = 'USUARIO_NORMALIZADO', display_name = 'Pablo',
    global_role = 'admin', must_change_password = true
where id = 'UUID_VERIFICADO';
```

No ejecutar los marcadores literalmente. Si también va a presidir Pico FC, añadir la membresía correspondiente a ese mismo UUID. La contraseña temporal debe cambiarse desde «Mi cuenta» antes de utilizar administración.

## Presidentes

En Administración → Usuarios de los clubes: introducir nombre, usuario, club y contraseña temporal de 12–128 caracteres. Entregar las credenciales por un canal privado; es preferible una contraseña temporal distinta por persona. No se envía correo ni se guardan contraseñas en tablas o auditoría.

En el primer acceso se exige cambiar la contraseña. «Mi cuenta» solicita la actual y una nueva distinta. Administración puede restablecer el acceso de un presidente, pero no cambiar la contraseña de otro administrador desde este formulario. Si se pierde la cuenta administrativa, la recuperación corresponde al propietario del proyecto en Supabase.

Los errores parciales indican si la cuenta o la contraseña ya han cambiado: no repetir una creación confirmada. Si falla auditoría después de cambiar una contraseña, el servidor devuelve una advertencia sin fingir que el cambio falló.

## Prueba de aceptación pendiente

- Entrar, recargar y salir con una cuenta autorizada.
- Usar contraseña temporal y comprobar que administración/gestión del club queda bloqueada hasta cambiarla.
- Cambiar contraseña; comprobar que la antigua ya no inicia sesión.
- Crear un presidente vinculado al club correcto y restablecer su contraseña desde administración.
- Comprobar que otro presidente y un visitante no pueden invocar acciones administrativas ni modificar `global_role`, `username` o `must_change_password` directamente.
- Guardar un borrador, publicar, editar y retirar una noticia; verificar RLS y auditoría en sesiones diferentes.

No se han creado cuentas de prueba ni datos ficticios en producción durante las pruebas locales.
