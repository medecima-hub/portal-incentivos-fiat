# Portal de Incentivos — cómo funciona

## Qué es esto
Este repo es el sitio completo:

```
/
├── index.html            ← portada: elegís la empresa/marca
├── netlify.toml           ← config de Netlify (dónde están las funciones)
├── netlify/functions/     ← guardar.js, cargar.js, listar.js (persistencia)
└── fiat/
    └── index.html         ← el estimador de Peara · Fiat
```

La portada tiene 4 tarjetas — **Peara (Fiat)** ya activa, y **Kiara
(Chevrolet)**, **Ciara (Renault)**, **Chiara (Chery)** marcadas "Próximamente"
hasta que armemos cada una (cada circular tiene su propia lógica, así que las
vamos a ir sumando una por una, cuando quieras).

## 1. Deploy — ahora es automático (Git)
El sitio está conectado a este repo de GitHub
(`medecima-hub/portal-incentivos-fiat`). Cada vez que se sube un cambio a la
rama `main`, Netlify lo despliega solo en unos segundos — no hace falta
volver a arrastrar ninguna carpeta a Netlify Drop.

Para subir un cambio: en GitHub, entrá a la carpeta/archivo que querés
cambiar y usá "Edit" (lápiz) o "Add file → Upload files" para reemplazarlo,
y confirmá el commit. Netlify arranca el deploy solo.

El sitio público es siempre el mismo link:
`https://zippy-mandazi-b7bdf7.netlify.app/` (portada) y
`https://zippy-mandazi-b7bdf7.netlify.app/fiat/` (estimador Fiat).

## 2. Guardado mensual (persistencia)
Al final del estimador (Paso 6) hay un botón **"Guardar en el portal"**.
Guarda la carga completa del mes (circular + lista de precios + patentamientos
+ ajustes) en un almacenamiento del propio sitio (Netlify Blobs), bajo el
período que pusiste en el Paso 1.

- Quien entre después al mismo link (`/fiat/`) ve automáticamente la última
  carga guardada, sin tener que volver a subir los 3 archivos.
- Para ver o corregir un mes anterior, en el Paso 6 hay un listado de
  períodos guardados — se puede volver a abrir y volver a guardar con
  correcciones.
- Cada mes nuevo: se sube la circular/lista/patentamientos de ese mes como
  siempre, y al terminar se guarda con el período nuevo (ej. `2026-10`); el
  mes anterior queda guardado en el repositorio de períodos.

## 3. Cómo se usa el estimador de cada marca
Ver el detalle en el propio sitio (Paso 1 a 6), o pedime que te lo repita.
En resumen: subís la circular (PDF), la lista de precios y la base de
patentamientos del mes — el sistema hace una primera lectura automática y
vos la revisás/corregís antes de que calcule el cuadro final.

## 4. Cómo sigue esto
Vamos a ir agregando una carpeta por marca (`/chevrolet/`, `/renault/`,
`/chery/`), cada una con su propia lógica de circular, tabla de bonus, y
reglas de matching — como pediste, de a una por vez. Cuando quieras arrancar
con la siguiente, pasame:
- Un ejemplo de circular de esa marca (PDF)
- Un ejemplo de lista de precios
- Un ejemplo de base de patentamientos

Y armamos esa sección igual que hicimos con Fiat.

## 5. Notas técnicas
- La lectura de la circular/lista de precios/patentamientos corre en el
  navegador de quien lo usa (pdf.js y SheetJS, cargados desde
  cdnjs.cloudflare.com); no se manda ningún archivo a ningún servidor.
- Lo único que se guarda en el servidor (Netlify Blobs) es lo que arma el
  botón "Guardar en el portal": los datos ya procesados de ese mes (no los
  PDF/Excel originales).
- Es una **estimación**, no la liquidación oficial de la terminal — sirve
  para tener un número rápido de referencia.
- El repo de GitHub es público (lo necesita el plan gratuito de Netlify para
  poder desplegar sin restricciones); no tiene datos comerciales ni
  contraseñas, solo el código de la aplicación.
