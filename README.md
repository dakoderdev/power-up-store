# Power Up

Sistema de ventas y gestión comercial: ventas con comprobante, productos y stock, clientes, cuentas corrientes y pagos, y usuarios con roles. Moneda única: pesos argentinos.

Stack: Next.js (App Router), Tailwind, Drizzle ORM sobre Turso (libSQL/SQLite), Better Auth, Zod con drizzle-zod, API REST con Route Handlers, deploy en Vercel.

## Nota sobre shadcn/ui y Chart.js

La consigna final del parcial (29/10/2026) lista shadcn/ui y Chart.js (`react-chartjs-2`) como tecnologías obligatorias. En el material "segundo-parcial-enunciado-y-mockup.html", Chart.js figuraba como opcional y shadcn/ui no se mencionaba, y el proyecto arrancó con esa lectura: la interfaz se construyó con componentes propios sobre Tailwind (`components/`, valores en `DESIGN.md`) y sin gráficos.

- **Chart.js**, con `react-chartjs-2`, ya muestra en el inicio las ventas diarias y las del mes por forma de pago (RF-T2, IN-06).
- **shadcn/ui** se incorpora componente por componente, adaptado al diseño propio: cada pieza entra con la estructura de shadcn (`components/ui/`, `cva`, `cn` de `lib/utils.ts`, `asChild`) y tematizada con los tokens de `app/globals.css` (paleta de `DESIGN.md`) en lugar del tema por defecto. Ya están en `components/ui/` el botón, los campos de formulario, badges, tablas, estados vacío y de carga, popover, tooltip y paginación (detalle en `specs/sistema.md`, Decisiones).
- **Rama `estilo-custom`:** esta rama conserva la estética propia original (fuente pixel, bordes rectos, paleta de `DESIGN.md`). `main` y la versión publicada usan la estética por defecto de shadcn/ui; las funciones son las mismas.

El estado de cada requerimiento está en [`specs/sistema.md`](specs/sistema.md); lo que falta está marcado `[pendiente]`.

Las reglas de negocio están en [`specs/sistema.md`](specs/sistema.md). El diseño visual está en [`DESIGN.md`](DESIGN.md). El enunciado completo del parcial está en [`docs/consigna.md`](docs/consigna.md).

## Integrantes

- David Konevky
- Maria Victoria Peralta

## URL pública

[https://power-up-store.vercel.app](https://power-up-store.vercel.app), publicada en Vercel y conectada a la base de Turso con el seed cargado.

## Usuarios de prueba

| Rol           | Correo                 | Contraseña     |
| ------------- | ---------------------- | -------------- |
| Administrador | `admin@ejemplo.com`    | `PowerUp2026!` |
| Vendedor      | `vendedor@ejemplo.com` | `PowerUp2026!` |

En el login también están los botones **Administrador** y **Vendedor** del modo demo, que entran con estas mismas cuentas sin escribir nada (variables `DEMO_*`).

Los crea `pnpm run db:seed` con las variables `SEED_ADMIN_*` y `SEED_VENDEDOR_*` de `.env.example`. Son credenciales de demostración de un proyecto de evaluación; no se usan en ningún entorno real.

## Requisitos

- Node.js 24.7 o superior (las contraseñas se hashean con argon2id de `node:crypto`)
- pnpm (`npm install -g pnpm` o `corepack enable`)
- Una base en Turso (plan gratuito). En desarrollo también sirve un archivo local: `TURSO_DATABASE_URL=file:local.db`, sin token

## Puesta en marcha

```bash
pnpm install
cp .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

`.env.example` ya trae valores de desarrollo (`file:local.db` y los usuarios de prueba), así que estos cinco comandos alcanzan, sin pasos manuales. Abrir [http://localhost:3000](http://localhost:3000) e iniciar sesión con un usuario de prueba. En producción, cambiar `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET` y `BETTER_AUTH_URL`.

## Variables de entorno

Las credenciales y claves van solo en variables de entorno (`.env`, ignorado por git). Nunca en el código.

| Variable                 | Descripción                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `TURSO_DATABASE_URL`     | URL de la base en Turso (`libsql://...`) o `file:local.db`                                |
| `TURSO_AUTH_TOKEN`       | Token de la base en Turso (no hace falta con un archivo local)                            |
| `AUTH_SECRET`            | Secreto de Better Auth para firmar sesiones                                               |
| `BETTER_AUTH_URL`        | URL base del sistema (`http://localhost:3000` en desarrollo; en Vercel, la URL pública)   |
| `SEED_ADMIN_EMAIL`       | Correo del administrador que crea el seed                                                 |
| `SEED_ADMIN_PASSWORD`    | Contraseña del administrador (mínimo 8 caracteres)                                        |
| `SEED_ADMIN_NAME`        | Nombre del administrador (opcional, por defecto `Administrador`)                          |
| `SEED_VENDEDOR_EMAIL`    | Correo del vendedor de prueba que crea el seed                                            |
| `SEED_VENDEDOR_PASSWORD` | Contraseña del vendedor de prueba (mínimo 8 caracteres)                                   |
| `SEED_VENDEDOR_NAME`     | Nombre del vendedor (opcional, por defecto `Vendedor`)                                    |
| `SEED_ADMIN2_EMAIL`      | Opcional: correo de un segundo administrador; si está vacío, el seed no lo crea           |
| `SEED_ADMIN2_PASSWORD`   | Contraseña del segundo administrador (mínimo 8 caracteres)                                |
| `SEED_ADMIN2_NAME`       | Nombre del segundo administrador (opcional, por defecto `Administrador`)                  |
| `DEMO_ADMIN_EMAIL`       | Cuenta con la que entra el botón demo Administrador del login (con `DEMO_ADMIN_PASSWORD`) |
| `DEMO_VENDEDOR_EMAIL`    | Cuenta con la que entra el botón demo Vendedor (con `DEMO_VENDEDOR_PASSWORD`)             |
| `SEED_ADMIN3_*`          | Opcional: un tercer administrador, con las mismas tres variables que `SEED_ADMIN2_*`      |
| `IGDB_CLIENT_ID`         | Opcional: cuenta de IGDB para cargar juegos en bloque con el asistente (la app no la lee) |
| `IGDB_CLIENT_SECRET`     | Opcional: secreto de la cuenta de IGDB (ídem)                                             |

Para que el seed cree el usuario de evaluación, usar estos valores:

```
SEED_ADMIN_EMAIL=admin@ejemplo.com
SEED_ADMIN_PASSWORD=PowerUp2026!
```

## Seed

`pnpm run db:seed` hace lo siguiente:

- Crea el administrador y el vendedor de prueba con las variables `SEED_ADMIN_*` y `SEED_VENDEDOR_*` (y administradores adicionales con `SEED_ADMIN2_*` y `SEED_ADMIN3_*`, si se definen). El administrador y el vendedor de prueba son los de la tabla de usuarios de prueba, con credenciales públicas; las cuentas personales van en los adicionales. Si el correo ya existe, no lo modifica: si se cambia la contraseña en el `.env`, hay que cambiarla también en la base.
- Crea 5 categorías y 30 productos con stock al azar (siempre uno sin stock y algunos bajo el mínimo).
- Crea 10 clientes (algunos con cuenta corriente y límite de crédito) y 50 facturas repartidas en los últimos 30 días, con las tres formas de pago y los dos vendedores, más pagos parciales, ajustes manuales de stock y 2 anulaciones.
- Todo pasa por los mismos servicios que la aplicación (`crearProducto`, `confirmarVenta`, `registrarPago`, `ajustarStock`, `anularVenta`…), como pide la sección 10.7; después se corren las fechas hacia atrás. Las cantidades se ajustan en `CONFIGURACION`, al principio de `lib/db/seed.ts`.
- Es seguro volver a correrlo: no duplica productos, y si ya hay ventas no agrega más.
- `pnpm run db:seed --reiniciar` borra categorías, productos, clientes, ventas, pagos y movimientos (no los usuarios) y los vuelve a generar. Muestra a qué base apunta antes de borrar y no corre en Vercel. Usalo solo contra una base de desarrollo.

## Uso de inteligencia artificial

El sistema se desarrolló con [Claude Code](https://claude.com/claude-code) como agente, en todas las capas: esquema y migraciones, casos de uso, pantallas, seed y documentación.

El método de trabajo se armó a partir del artículo ["Probabilistic isn’t a dirty word…"](https://www.designsystemscollective.com/probabilistic-isnt-a-dirty-word-37fa836bedd8), de Cassie Groos. No es una copia directa del método, sino una adaptación a la escala de este proyecto.

Método de trabajo:

- [`AGENTS.md`](AGENTS.md) fija las reglas que el agente sigue en cada tarea: stack, estilo de código, dónde va cada cosa y qué no construir.
- [`specs/sistema.md`](specs/sistema.md) es la fuente de verdad de las reglas de negocio. Si un pedido la contradice, el agente frena y pregunta; las dudas quedan como `[abierto]` y lo resuelto, en Decisiones, con fecha y motivo.
- [`DESIGN.md`](DESIGN.md) fija los valores visuales que el agente puede usar.
- Los cambios grandes se planifican antes de tocar código, y el agente los prueba (migración, seed, chequeo de tipos, lint, build y el sistema levantado) antes de entregarlos. Cada cambio se revisa antes del commit.

Errores del agente que se detectaron y corrigieron:

- Al pasar la base de Postgres a Turso, la búsqueda sin acentos se armó con una cadena de `replace()` anidados que SQLite no pudo procesar (`parser stack overflow`). Se reemplazó por un patrón `GLOB` armado en el servidor (`lib/db/busqueda.ts`).
- En la misma migración, la detección de códigos y documentos duplicados quedó con el código de error de Postgres (`23505`), así que un duplicado salía como error genérico. Se corrigió para reconocer el error de SQLite (`lib/db/errores.ts`).
- La migración que generó `drizzle-kit` para sumar la anulación y el límite de crédito copiaba columnas nuevas desde las tablas viejas, y habría fallado sobre una base con datos. Se corrigió a mano y se probó sobre una base con datos del seed (`drizzle/0001_anulacion_credito_numeracion.sql`).

## Roles

| Rol           | Valor interno | Alcance                                                                                                      |
| ------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| Administrador | `admin`       | Todo: además anula ventas, da de alta y edita productos, registra ajustes de stock y administra usuarios     |
| Vendedor      | `operator`    | El "vendedor" de la consigna: emite y consulta ventas, consulta productos y stock, gestiona clientes y pagos |

El rol y el estado activo se verifican en el servidor en cada pedido. Un usuario inactivo no puede iniciar sesión.

## API REST

Las operaciones están expuestas bajo `/api` según la sección 11 de la consigna (31 rutas en `app/api/**/route.ts`). Importes en centavos enteros, fechas ISO 8601 en UTC, errores con la forma `{ "error": { "code", "message", "details" } }`.

Cada ruta es un adaptador fino sobre los mismos servicios de `lib/` que usan las pantallas:

- `lib/api/ruta.ts`: envoltorio común (sesión, rol, lectura de JSON y traducción de errores).
- `lib/api/esquemas.ts`: esquemas de entrada estrictos, encadenados a los esquemas Zod compartidos.
- `lib/api/errores.ts`: `ApiError` y los códigos de la sección 11.8.
- `lib/api/formato.ts`: forma pública de cada recurso.

Para probarla, iniciar sesión con `POST /api/auth/login` y reusar la cookie que devuelve:

```bash
curl -c cookie.txt -H "Content-Type: application/json" -d '{"email":"admin@ejemplo.com","password":"PowerUp2026!"}' http://localhost:3000/api/auth/login
curl -b cookie.txt http://localhost:3000/api/tablero
```

Están las 31 rutas de la sección 11.2. En la API el rol del vendedor se llama `vendedor` (en la base se guarda como `operator`), y los identificadores de usuario son texto porque los genera Better Auth; el resto son enteros.

## Scripts

| Comando                | Qué hace                                    |
| ---------------------- | ------------------------------------------- |
| `pnpm run dev`         | Servidor de desarrollo                      |
| `pnpm run build`       | Build de producción                         |
| `pnpm run start`       | Sirve el build de producción                |
| `pnpm run lint`        | ESLint                                      |
| `pnpm run db:generate` | Genera una migración desde el esquema       |
| `pnpm run db:migrate`  | Aplica las migraciones                      |
| `pnpm run db:seed`     | Carga administrador y datos de demostración |
| `pnpm run db:demo-hoy` | Mueve las ventas de demostración a hoy      |
| `pnpm run typecheck`   | Chequeo de tipos de TypeScript              |
