# Portal de Incentivos — cómo subirlo a Netlify

## Qué es esto
`portal-incentivos.zip` trae un sitio de dos niveles:

```
portal/
├── index.html         ← portada: elegís la empresa/marca
└── fiat/
    └── index.html      ← el estimador de Peara · Fiat (el que ya vimos)
```

La portada tiene 4 tarjetas — **Peara (Fiat)** ya activa, y **Kiara
(Chevrolet)**, **Ciara (Renault)**, **Chiara (Chery)** marcadas "Próximamente"
hasta que armemos cada una (cada circular tiene su propia lógica, así que las
vamos a ir sumando una por una, cuando quieras).

## 1. Deploy (2 minutos)
1. Descomprimí `portal-incentivos.zip` en tu computadora — te queda una
   carpeta `portal/`.
2. Entrá a https://app.netlify.com/drop
3. Arrastrá la carpeta **portal** completa (no el zip, la carpeta ya
   descomprimida) a esa página.
4. Netlify te da un link, por ejemplo `https://algo.netlify.app` — esa es tu
   portada. `https://algo.netlify.app/fiat/` es directamente el estimador de
   Fiat (y así va a ser con cada marca nueva: `/chevrolet/`, `/renault/`,
   `/chery/`, etc.).
5. (Opcional) En **Site settings → Change site name** le ponés un nombre
   más lindo, ej. `incentivos-peara-group.netlify.app`.

## 2. Actualizaciones más adelante
Cuando quieras subir una versión nueva (por ejemplo, cuando sumemos
Chevrolet), es el mismo paso: volvés a arrastrar la carpeta `portal`
completa a la página de **Deploys** de tu sitio ya creado en Netlify. Pisa
todo lo anterior.

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
- Todo corre en el navegador de quien lo usa — ningún archivo se sube a
  ningún servidor. El único tráfico de red externo son dos librerías (pdf.js
  y SheetJS) cargadas desde cdnjs.cloudflare.com.
- Es una **estimación**, no la liquidación oficial de la terminal — sirve
  para tener un número rápido de referencia.
