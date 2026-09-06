# Primera ficha de jugador

La ficha de prueba de Pol Guillem está en `/jugadores/pol-guillem` y en la plantilla de Pico FC del Split 3, tanto pública como en Mi equipo. Es un catálogo de presentación independiente: no crea inscripciones en Supabase, no añade estadísticas de partidos y no habilita todavía las alineaciones. El resto de jugadores no se ha importado.

## Datos importados

Fuente facilitada por la organización: `279982 - Pol Guillem.player`, versión 25. Se seleccionan únicamente identidad deportiva y 34 atributos. Se omiten potencial, apariencia, contratos y los campos internos no necesarios. La lista pública permitida está en `src/data/playerProfiles.js` y se comprueba en `src/lib/playerProfile.test.js`.

El nombre principal da prioridad a `commonName` cuando existe; en caso contrario utiliza nombre y apellido. Este archivo contiene **Pol Guillem**, sin apodo y con **P. Guillem** para la camiseta. La ficha respeta esos valores.

## Conversión y trazabilidad

- `birthdate=151078` corresponde al **3 de junio de 1996**, usando el algoritmo de [FC25 Live Editor](https://github.com/xAranaktu/FC-25-Live-Editor/blob/main/lua/libs/v2/imports/core/date.lua).
- `preferredfoot=1` significa derecha, `weakfootabilitytypecode=2` son dos estrellas y `skillmoves=0` equivale a una estrella. Referencia: [código del tracker FC24/25](https://github.com/VeejaLiu/FCT-Frontend/blob/master/src/pages/PlayerDetailPage/BasicInfoComponent.tsx).
- La posición `0` es portero; los tres valores `-1` se descartan. Referencia: [mapa de posiciones](https://github.com/VeejaLiu/FCT-Frontend/blob/master/src/constant/player.ts).
- Nacionalidad `45`: España. Referencia: [catálogo extraído de la base del juego](https://github.com/mhirst1992/fc26-save-parser/blob/main/data/nations.json).

## Resumen del portero

Estirada 88, parada 85, chute 87, reflejos 88 y posición 84 proceden directamente de los atributos de portería. Los campos CARD guardados en este archivo no coinciden con esos atributos actualizados y no se utilizan.

No se ha verificado una fórmula específica de FC25 para recalcular la velocidad global. Por ello se muestran **aceleración 66 / sprint 67**, identificados, sin presentar una media estimada como dato oficial. Los jugadores de campo disponen del formato ritmo, tiro, pase, regate, defensa y físico; sus resúmenes deberán aportarse o verificarse al importar cada ficha.

## Alcance de la prueba

Mantener `PLAYER_FEATURES_ENABLED=false` hasta preparar las plantillas y sus inscripciones. Las fichas no deben incorporarse automáticamente a las estadísticas competitivas ni a los históricos de otros splits. Antes de importar más jugadores, revisar nombres, fechas, posiciones y consistencia de sus atributos del mismo modo.
