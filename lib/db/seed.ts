import { and, count, eq, getTableName, inArray, sql } from "drizzle-orm";
import { crearCategoria, listarCategorias } from "../categorias/servicio";
import { esquemaClienteNuevo } from "../clientes/esquemas";
import { crearCliente } from "../clientes/guardar";
import { esquemaPago } from "../cuentas/esquemas";
import { registrarPago } from "../cuentas/pagar";
import { formatearHora } from "../fechas";
import { aCentavos, deCentavos } from "../moneda";
import { esquemaProductoNuevo } from "../productos/esquemas";
import { crearProducto } from "../productos/guardar";
import { ajustarStock } from "../stock/ajustar";
import { esquemaAjusteManual } from "../stock/esquemas";
import { MOTIVO_STOCK_INICIAL, MOTIVOS_SUGERIDOS } from "../stock/etiquetas";
import type { UsuarioServicio } from "../servicio";
import { esquemaUsuarioNuevo } from "../usuarios/esquemas";
import { crearUsuario } from "../usuarios/guardar";
import { anularVenta } from "../ventas/anular";
import { confirmarVenta } from "../ventas/confirmar";
import { esquemaVentaEntrada } from "../ventas/esquemas";
import { MARCAS_TARJETA } from "../ventas/etiquetas";
import { db } from "./index";
import {
  categorias,
  clientes,
  itemsVenta,
  movimientosCuenta,
  movimientosStock,
  productos,
  TIPOS_TARJETA,
  user,
  ventas,
} from "./schema";

// Sección 8 y 10.7: los datos de prueba se cargan con los mismos servicios que usa la aplicación,
// así stock, saldos y numeración cumplen las reglas. Después se mueven las fechas hacia atrás
// para repartir la actividad en los últimos 30 días.

const CONFIGURACION = {
  ventas: 50,
  ventasHoy: 4,
  dias: 30,
  ajustes: 8,
  anulaciones: 2,
  productosPorVenta: { min: 1, max: 3 },
  unidadesPorProducto: { min: 1, max: 2 },
  stockInicial: { min: 15, max: 40 },
  stockBajo: { min: 2, max: 4 },
  stockMinimoBajo: 5,
  productosSinStock: 1,
  productosStockBajo: 3,
  pesosFormaPago: { contado: 4, tarjeta: 3, cuenta_corriente: 3 },
  probabilidadConsumidorFinal: 0.4,
  probabilidadPago: 0.7,
  unidadesPorAjuste: { min: 1, max: 5 },
  probabilidadSalida: 0.5,
};

const FLAG_REINICIAR = "--reiniciar";

// RF-U3: el script de datos iniciales actúa como administrador para crear al primero.
const SISTEMA: UsuarioServicio = {
  id: "",
  nombre: "Datos iniciales",
  esAdministrador: true,
};
const HORA_APERTURA = 10 * 60;
const HORAS_ABIERTO = 10 * 60;
const MINUTOS_POR_DIA = 24 * 60;
const ESCALON_PAGO = 100_000;

const TABLAS_DEMOSTRACION = [
  movimientosCuenta,
  movimientosStock,
  itemsVenta,
  ventas,
  clientes,
  productos,
  categorias,
];

const CATEGORIAS = {
  accion: "Acción y aventura",
  plataformas: "Plataformas",
  party: "Deportes y party",
  simulacion: "Simulación",
  consolas: "Consolas y accesorios",
} as const;

type ClaveCategoria = keyof typeof CATEGORIAS;

type Juego = {
  codigo: string;
  nombre: string;
  precio: string;
  categoria: ClaveCategoria;
  tapa?: string;
  imagen?: string;
};

const BASE_TAPAS = "https://images.igdb.com/igdb/image/upload/t_cover_big";

const JUEGOS: Juego[] = [
  {
    codigo: "GTA-V",
    nombre: "Grand Theft Auto V",
    precio: "29999.00",
    categoria: "accion",
    tapa: "co2lbd",
  },
  {
    codigo: "SIMS-4",
    nombre: "Los Sims 4",
    precio: "24999.00",
    categoria: "simulacion",
    tapa: "co3h3l",
  },
  {
    codigo: "COD-MW3",
    nombre: "Call of Duty: Modern Warfare III",
    precio: "69999.00",
    categoria: "accion",
    tapa: "co1wkn",
  },
  {
    codigo: "FIFA-23",
    nombre: "FIFA 23",
    precio: "39999.00",
    categoria: "party",
    tapa: "co4zw5",
  },
  {
    codigo: "SMB-WONDER",
    nombre: "Super Mario Bros. Wonder",
    precio: "64999.00",
    categoria: "plataformas",
    tapa: "co6nnl",
  },
  {
    codigo: "POKE-ESC",
    nombre: "Pokémon Escarlata",
    precio: "64999.00",
    categoria: "accion",
    tapa: "co5sfi",
  },
  {
    codigo: "ZELDA-TOTK",
    nombre: "The Legend of Zelda: Tears of the Kingdom",
    precio: "69999.00",
    categoria: "accion",
    tapa: "co5vmg",
  },
  {
    codigo: "AC-VAL",
    nombre: "Assassin's Creed Valhalla",
    precio: "34999.00",
    categoria: "accion",
    tapa: "co2ed3",
  },
  {
    codigo: "HALO-INF",
    nombre: "Halo Infinite",
    precio: "39999.00",
    categoria: "accion",
    tapa: "co2dto",
  },
  {
    codigo: "RE-4",
    nombre: "Resident Evil 4",
    precio: "49999.00",
    categoria: "accion",
    tapa: "co2wki",
  },
  {
    codigo: "SONIC-SS",
    nombre: "Sonic Superstars",
    precio: "44999.00",
    categoria: "plataformas",
    tapa: "cobbw4",
  },
  {
    codigo: "METROID-D",
    nombre: "Metroid Dread",
    precio: "59999.00",
    categoria: "plataformas",
    tapa: "coba9g",
  },
  {
    codigo: "SIMS-3",
    nombre: "Los Sims 3",
    precio: "19999.00",
    categoria: "simulacion",
    tapa: "co99qs",
  },
  {
    codigo: "TOMO-LTD",
    nombre: "Tomodachi Life: Living the Dream",
    precio: "69999.00",
    categoria: "simulacion",
    tapa: "cobdqd",
  },
  {
    codigo: "SPLA-3",
    nombre: "Splatoon 3",
    precio: "64999.00",
    categoria: "party",
    tapa: "co59x3",
  },
  {
    codigo: "SPLA-2",
    nombre: "Splatoon 2",
    precio: "54999.00",
    categoria: "party",
    tapa: "cob8r9",
  },
  {
    codigo: "PORTAL-2",
    nombre: "Portal 2",
    precio: "14999.00",
    categoria: "accion",
    tapa: "co1rs4",
  },
  {
    codigo: "PEAK",
    nombre: "Peak",
    precio: "9999.00",
    categoria: "party",
    tapa: "cocokj",
  },
  {
    codigo: "SMO",
    nombre: "Super Mario Odyssey",
    precio: "59999.00",
    categoria: "plataformas",
    tapa: "co1mxf",
  },
  {
    codigo: "SMS",
    nombre: "Super Mario Sunshine",
    precio: "44999.00",
    categoria: "plataformas",
    tapa: "cob8q1",
  },
  {
    codigo: "GTA-IV",
    nombre: "Grand Theft Auto IV",
    precio: "19999.00",
    categoria: "accion",
    tapa: "co2lbv",
  },
  {
    codigo: "DELTARUNE",
    nombre: "Deltarune",
    precio: "24999.00",
    categoria: "accion",
    tapa: "co9m71",
  },
  {
    codigo: "JD-2014",
    nombre: "Just Dance 2014",
    precio: "12999.00",
    categoria: "party",
    tapa: "co1xf3",
  },
  {
    codigo: "JD-4",
    nombre: "Just Dance 4",
    precio: "9999.00",
    categoria: "party",
    tapa: "co1xf6",
  },
  {
    codigo: "CUPHEAD",
    nombre: "Cuphead",
    precio: "19999.00",
    categoria: "plataformas",
    tapa: "co62ao",
  },
  {
    codigo: "NSW-OLED",
    nombre: "Nintendo Switch OLED",
    precio: "649999.00",
    categoria: "consolas",
    imagen:
      "https://spacegamer.com.ar/img/Public/1058/9124-producto-oledmariowonder.jpg",
  },
  {
    codigo: "PS5-SLIM",
    nombre: "PlayStation 5 Slim",
    precio: "899999.00",
    categoria: "consolas",
    imagen:
      "https://puntotekno.com.ar/wp-content/uploads/2026/04/ps5-slim-1.jpg",
  },
  {
    codigo: "JOY-CON",
    nombre: "Joy-Con (par)",
    precio: "129999.00",
    categoria: "consolas",
    imagen:
      "https://http2.mlstatic.com/D_NQ_NP_778468-MLA110790119444_052026-O.webp",
  },
  {
    codigo: "DUALSENSE",
    nombre: "Control DualSense",
    precio: "109999.00",
    categoria: "consolas",
    imagen:
      "https://casadelaudio.com/media/catalog/product/7/5/751-son-644_0.jpg",
  },
  {
    codigo: "XBOX-CTRL",
    nombre: "Control inalámbrico Xbox",
    precio: "89999.00",
    categoria: "consolas",
    imagen:
      "https://target.scene7.com/is/image/Target/GUEST_48bd1596-8d01-426b-89ac-c1b86b9c58bb",
  },
];

const CLIENTES: {
  nombre: string;
  tipoDoc: "DNI" | "CUIT";
  documento: string;
  domicilio: string;
  telefono?: string;
  email?: string;
  cuentaCorriente: boolean;
  limiteCredito?: string;
}[] = [
  {
    nombre: "Martina Gómez",
    tipoDoc: "DNI",
    documento: "28456123",
    domicilio: "Las Heras 455",
    telefono: "1144552210",
    email: "martina.gomez@ejemplo.com",
    cuentaCorriente: true,
    limiteCredito: "400000.00",
  },
  {
    nombre: "Lucas Fernández",
    tipoDoc: "DNI",
    documento: "33120987",
    domicilio: "Av. Belgrano 1220",
    telefono: "1132245567",
    cuentaCorriente: true,
  },
  {
    nombre: "Sofía Ramírez",
    tipoDoc: "DNI",
    documento: "40211876",
    domicilio: "Mitre 88",
    email: "sofia.ramirez@ejemplo.com",
    cuentaCorriente: true,
    limiteCredito: "600000.00",
  },
  {
    nombre: "Tomás Herrera",
    tipoDoc: "DNI",
    documento: "36988123",
    domicilio: "San Martín 1450",
    telefono: "1158894412",
    cuentaCorriente: false,
  },
  {
    nombre: "Valentina López",
    tipoDoc: "DNI",
    documento: "42555019",
    domicilio: "Rivadavia 3021",
    email: "valentina.lopez@ejemplo.com",
    cuentaCorriente: true,
  },
  {
    nombre: "Mateo Díaz",
    tipoDoc: "DNI",
    documento: "31877456",
    domicilio: "Córdoba 742",
    telefono: "1166213390",
    cuentaCorriente: false,
  },
  {
    nombre: "Camila Martínez",
    tipoDoc: "DNI",
    documento: "39456321",
    domicilio: "Laprida 233",
    email: "camila.martinez@ejemplo.com",
    cuentaCorriente: false,
  },
  {
    nombre: "Joaquín Romero",
    tipoDoc: "DNI",
    documento: "29874563",
    domicilio: "Sarmiento 615",
    telefono: "1149873321",
    cuentaCorriente: true,
    limiteCredito: "300000.00",
  },
  {
    nombre: "Game Center SRL",
    tipoDoc: "CUIT",
    documento: "30715489632",
    domicilio: "Av. Corrientes 2450",
    telefono: "1143217788",
    email: "compras@gamecenter.com.ar",
    cuentaCorriente: true,
    limiteCredito: "2000000.00",
  },
  {
    nombre: "Julieta Sosa",
    tipoDoc: "CUIT",
    documento: "27384561239",
    domicilio: "Junín 1102",
    email: "julieta.sosa@ejemplo.com",
    cuentaCorriente: false,
  },
];

type Rango = { min: number; max: number };
type FormaPago = keyof typeof CONFIGURACION.pesosFormaPago;
type Evento = { tipo: "venta"; fecha: Date } | { tipo: "ajuste"; fecha: Date };

function entero({ min, max }: Rango) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function elegir<T>(lista: readonly T[]) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function mezclar<T>(lista: T[]) {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

function elegirFormaPago(): FormaPago {
  const pesos = Object.entries(CONFIGURACION.pesosFormaPago) as [
    FormaPago,
    number,
  ][];
  const total = pesos.reduce((suma, [, peso]) => suma + peso, 0);
  const tirada = Math.random() * total;
  const acumulados = pesos.map(
    ([forma], indice) =>
      [
        forma,
        pesos.slice(0, indice + 1).reduce((suma, [, peso]) => suma + peso, 0),
      ] as const,
  );

  return acumulados.find(([, tope]) => tirada < tope)?.[0] ?? "contado";
}

function leerVariable(nombre: string) {
  const valor = process.env[nombre]?.trim();

  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}.`);
  }

  return valor;
}

function haceMinutos(minutos: number) {
  return new Date(Date.now() - minutos * 60_000);
}

function minutosDesdeMedianoche() {
  const [horas, minutos] = formatearHora(new Date()).split(":").map(Number);

  return Math.max(2, horas * 60 + minutos);
}

// Un momento del día `dia` (0 = hoy) dentro del horario del local; hoy, antes de ahora.
function momentoDelDia(dia: number) {
  const ahora = minutosDesdeMedianoche();

  if (dia === 0) {
    const desde = Math.min(HORA_APERTURA, ahora - 1);

    return haceMinutos(ahora - entero({ min: desde, max: ahora - 1 }));
  }

  const minuto = HORA_APERTURA + entero({ min: 0, max: HORAS_ABIERTO });

  return haceMinutos(ahora + dia * MINUTOS_POR_DIA - minuto);
}

function sortearEventos(): Evento[] {
  const dias = Array.from({ length: CONFIGURACION.ventas }, (_, indice) =>
    indice < CONFIGURACION.ventasHoy
      ? 0
      : entero({ min: 1, max: CONFIGURACION.dias - 1 }),
  );
  const ajustes = Array.from({ length: CONFIGURACION.ajustes }, () =>
    entero({ min: 1, max: CONFIGURACION.dias - 1 }),
  );

  return [
    ...dias.map((dia) => ({
      tipo: "venta" as const,
      fecha: momentoDelDia(dia),
    })),
    ...ajustes.map((dia) => ({
      tipo: "ajuste" as const,
      fecha: momentoDelDia(dia),
    })),
  ].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

async function reiniciarDemostracion() {
  if (!process.argv.includes(FLAG_REINICIAR)) {
    return;
  }

  if (process.env.VERCEL) {
    throw new Error(`${FLAG_REINICIAR} no se puede usar en Vercel.`);
  }

  console.log(
    `Borrando los datos de demostración de ${leerVariable("TURSO_DATABASE_URL")}…`,
  );

  await db.transaction(async (tx) => {
    for (const tabla of TABLAS_DEMOSTRACION) {
      await tx.delete(tabla);
      await tx.run(
        sql`delete from sqlite_sequence where name = ${getTableName(tabla)}`,
      );
    }
  });
}

// RF-U3: el script crea el administrador y el vendedor de prueba y, si se definen, administradores adicionales, con el servicio de usuarios.
const PREFIJOS_ADMIN_EXTRA = ["SEED_ADMIN2", "SEED_ADMIN3"] as const;

async function crearUsuarioSemilla({
  prefijo,
  rol,
  nombrePorDefecto,
}: {
  prefijo:
    "SEED_ADMIN" | (typeof PREFIJOS_ADMIN_EXTRA)[number] | "SEED_VENDEDOR";
  rol: "admin" | "operator";
  nombrePorDefecto: string;
}): Promise<UsuarioServicio> {
  const entrada = esquemaUsuarioNuevo.parse({
    nombre: process.env[`${prefijo}_NAME`]?.trim() || nombrePorDefecto,
    correo: leerVariable(`${prefijo}_EMAIL`),
    contrasena: leerVariable(`${prefijo}_PASSWORD`),
    rol,
  });
  const [existente] = await db
    .select({ id: user.id, nombre: user.name })
    .from(user)
    .where(eq(user.email, entrada.correo));

  if (existente) {
    console.log(`El usuario ${entrada.correo} ya existe; no se modifica.`);

    return {
      id: existente.id,
      nombre: existente.nombre,
      esAdministrador: rol === "admin",
    };
  }

  const resultado = await crearUsuario({ usuario: SISTEMA, entrada });

  if (!resultado.creado) {
    throw new Error(`No se pudo crear ${entrada.correo}.`);
  }

  console.log(`Usuario ${entrada.correo} creado.`);

  return {
    id: resultado.id,
    nombre: entrada.nombre,
    esAdministrador: rol === "admin",
  };
}

async function crearCategorias(administrador: UsuarioServicio) {
  const existentes = await listarCategorias({ incluirInactivas: true });
  const ids = new Map<ClaveCategoria, number>();

  for (const [clave, nombre] of Object.entries(CATEGORIAS) as [
    ClaveCategoria,
    string,
  ][]) {
    const encontrada = existentes.find(
      (categoria) => categoria.nombre === nombre,
    );
    const categoria =
      encontrada ??
      (await crearCategoria({ usuario: administrador, datos: { nombre } }));
    ids.set(clave, categoria.id);
  }

  console.log(`Categorías: ${ids.size}.`);

  return ids;
}

function sortearStock() {
  const codigos = mezclar(JUEGOS.map((juego) => juego.codigo));
  const sinStock = CONFIGURACION.productosSinStock;
  const bajo = sinStock + CONFIGURACION.productosStockBajo;

  return new Map(
    codigos.map((codigo, indice) => [
      codigo,
      indice < sinStock
        ? { stock: 0, minimo: CONFIGURACION.stockMinimoBajo }
        : indice < bajo
          ? {
              stock: entero(CONFIGURACION.stockBajo),
              minimo: CONFIGURACION.stockMinimoBajo,
            }
          : { stock: entero(CONFIGURACION.stockInicial), minimo: 3 },
    ]),
  );
}

async function crearProductos({
  administrador,
  categoriasIds,
}: {
  administrador: UsuarioServicio;
  categoriasIds: Map<ClaveCategoria, number>;
}) {
  const sorteo = sortearStock();
  const creados: number[] = [];

  for (const juego of JUEGOS) {
    const { stock, minimo } = sorteo.get(juego.codigo)!;
    const resultado = await crearProducto({
      entrada: esquemaProductoNuevo.parse({
        codigo: juego.codigo,
        nombre: juego.nombre,
        categoriaId: categoriasIds.get(juego.categoria),
        precio: juego.precio,
        stock,
        stockMinimo: minimo,
        imagenUrl:
          juego.imagen ??
          (juego.tapa ? `${BASE_TAPAS}/${juego.tapa}.webp` : null),
        activo: true,
      }),
      usuario: administrador,
    });

    if (resultado.guardado) {
      creados.push(resultado.productoId);
    }
  }

  if (creados.length > 0) {
    await db
      .update(movimientosStock)
      .set({
        creadoEn: haceMinutos((CONFIGURACION.dias + 1) * MINUTOS_POR_DIA),
      })
      .where(
        and(
          inArray(movimientosStock.productoId, creados),
          eq(movimientosStock.motivo, MOTIVO_STOCK_INICIAL),
        ),
      );
  }

  for (const juego of JUEGOS) {
    await db
      .update(productos)
      .set({ categoriaId: categoriasIds.get(juego.categoria) })
      .where(eq(productos.codigo, juego.codigo));
  }

  console.log(`Productos creados: ${creados.length} de ${JUEGOS.length}.`);
}

async function crearClientes() {
  for (const cliente of CLIENTES) {
    await crearCliente(
      esquemaClienteNuevo.parse({
        ...cliente,
        telefono: cliente.telefono ?? null,
        email: cliente.email ?? null,
        limiteCredito: cliente.limiteCredito ?? null,
      }),
    );
  }

  return db
    .select()
    .from(clientes)
    .where(
      inArray(
        clientes.documento,
        CLIENTES.map((cliente) => cliente.documento),
      ),
    );
}

async function fecharVenta({
  ventaId,
  fecha,
}: {
  ventaId: number;
  fecha: Date;
}) {
  await db
    .update(ventas)
    .set({ creadoEn: fecha })
    .where(eq(ventas.id, ventaId));
  await db
    .update(movimientosStock)
    .set({ creadoEn: fecha })
    .where(eq(movimientosStock.ventaId, ventaId));
  await db
    .update(movimientosCuenta)
    .set({ fecha })
    .where(eq(movimientosCuenta.ventaId, ventaId));
}

async function productosConStock() {
  return db
    .select({
      id: productos.id,
      precio: productos.precio,
      stock: productos.stock,
    })
    .from(productos)
    .where(and(eq(productos.activo, true), sql`${productos.stock} > 0`));
}

function armarEntrada({
  formaPago,
  clienteId,
  items,
}: {
  formaPago: FormaPago;
  clienteId: number | null;
  items: { productoId: number; cantidad: number; precio: string }[];
}) {
  const total = items.reduce(
    (suma, item) => suma + aCentavos(item.precio) * item.cantidad,
    0,
  );
  const redondeo = 1_000_00;
  const recibido = Math.ceil(total / redondeo) * redondeo;

  return esquemaVentaEntrada.parse({
    clienteId,
    formaPago,
    items: items.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
    tarjeta:
      formaPago === "tarjeta"
        ? {
            tipo: elegir(TIPOS_TARJETA),
            marca: elegir(MARCAS_TARJETA),
            ultimos4: String(entero({ min: 0, max: 9999 })).padStart(4, "0"),
          }
        : undefined,
    montoRecibido:
      formaPago === "contado" && Math.random() < 0.5
        ? deCentavos(recibido)
        : undefined,
  });
}

async function venderEn({
  fecha,
  vendedor,
  registrados,
}: {
  fecha: Date;
  vendedor: UsuarioServicio;
  registrados: (typeof clientes.$inferSelect)[];
}) {
  const disponibles = await productosConStock();

  if (disponibles.length === 0) {
    return null;
  }

  const items = mezclar(disponibles)
    .slice(0, entero(CONFIGURACION.productosPorVenta))
    .map((producto) => ({
      productoId: producto.id,
      precio: producto.precio,
      cantidad: Math.min(
        entero(CONFIGURACION.unidadesPorProducto),
        producto.stock,
      ),
    }));
  const sorteada = elegirFormaPago();
  const conCuenta = registrados.filter((cliente) => cliente.cuentaCorriente);
  const cliente =
    sorteada === "cuenta_corriente"
      ? elegir(conCuenta)
      : Math.random() < CONFIGURACION.probabilidadConsumidorFinal
        ? null
        : elegir(registrados);
  const intentos: FormaPago[] =
    sorteada === "cuenta_corriente"
      ? ["cuenta_corriente", "contado"]
      : [sorteada];

  for (const formaPago of intentos) {
    const resultado = await confirmarVenta({
      entrada: armarEntrada({
        formaPago,
        clienteId: cliente?.id ?? null,
        items,
      }),
      usuarioId: vendedor.id,
    });

    if (resultado.confirmada) {
      await fecharVenta({ ventaId: resultado.ventaId, fecha });

      return { ventaId: resultado.ventaId, formaPago, clienteId: cliente?.id };
    }
  }

  return null;
}

async function ajustarEn({
  fecha,
  administrador,
}: {
  fecha: Date;
  administrador: UsuarioServicio;
}) {
  const disponibles = await db
    .select({ id: productos.id, stock: productos.stock })
    .from(productos)
    .where(eq(productos.activo, true));
  const conStock = disponibles.filter((producto) => producto.stock > 0);
  const tipo =
    conStock.length > 0 && Math.random() < CONFIGURACION.probabilidadSalida
      ? "salida"
      : "entrada";
  const producto = elegir(tipo === "salida" ? conStock : disponibles);
  const unidades = entero(CONFIGURACION.unidadesPorAjuste);
  const resultado = await ajustarStock({
    entrada: esquemaAjusteManual.parse({
      productoId: producto.id,
      tipo,
      cantidad:
        tipo === "salida" ? Math.min(unidades, producto.stock) : unidades,
      motivo: elegir(MOTIVOS_SUGERIDOS[tipo]),
    }),
    usuario: administrador,
  });

  if (resultado.ajustado) {
    await db
      .update(movimientosStock)
      .set({ creadoEn: fecha })
      .where(eq(movimientosStock.id, resultado.movimientoId));
  }

  return resultado.ajustado;
}

// RF-C5: pagos parciales de clientes con deuda, en orden de fecha para que los recibos queden correlativos.
async function crearPagos({
  deudas,
  vendedores,
}: {
  deudas: Map<number, Date>;
  vendedores: UsuarioServicio[];
}) {
  const pagos = [...deudas]
    .filter(() => Math.random() < CONFIGURACION.probabilidadPago)
    .map(([clienteId, ultimaVenta]) => ({
      clienteId,
      fecha: new Date(
        ultimaVenta.getTime() +
          Math.random() * (Date.now() - ultimaVenta.getTime()),
      ),
    }))
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  let registrados = 0;

  for (const { clienteId, fecha } of pagos) {
    const [{ saldo }] = await db
      .select({
        saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'venta' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`,
      })
      .from(movimientosCuenta)
      .where(eq(movimientosCuenta.clienteId, clienteId));
    const centavos =
      Math.floor((saldo * entero({ min: 30, max: 80 })) / 100 / ESCALON_PAGO) *
      ESCALON_PAGO;

    if (centavos <= 0) {
      continue;
    }

    const resultado = await registrarPago({
      entrada: esquemaPago.parse({
        clienteId,
        importe: deCentavos(centavos),
        medio: elegir(["efectivo", "transferencia", "tarjeta_debito"] as const),
        observacion: "Pago parcial",
      }),
      usuarioId: elegir(vendedores).id,
    });

    if (resultado.registrado) {
      await db
        .update(movimientosCuenta)
        .set({ fecha })
        .where(eq(movimientosCuenta.id, resultado.pagoId));
      registrados++;
    }
  }

  return registrados;
}

async function crearMovimientos({
  administrador,
  vendedor,
}: {
  administrador: UsuarioServicio;
  vendedor: UsuarioServicio;
}) {
  const [{ cantidad }] = await db.select({ cantidad: count() }).from(ventas);

  if (cantidad > 0) {
    console.log("Ya hay ventas cargadas; no se agregan.");
    return;
  }

  const registrados = await crearClientes();
  const vendedores = [administrador, vendedor];
  const deudas = new Map<number, Date>();
  const contado: number[] = [];
  let ventasCreadas = 0;
  let ajustes = 0;

  for (const evento of sortearEventos()) {
    if (evento.tipo === "ajuste") {
      ajustes += (await ajustarEn({ fecha: evento.fecha, administrador }))
        ? 1
        : 0;
      continue;
    }

    const venta = await venderEn({
      fecha: evento.fecha,
      vendedor: elegir(vendedores),
      registrados,
    });

    if (!venta) {
      continue;
    }

    ventasCreadas++;

    if (venta.formaPago === "cuenta_corriente" && venta.clienteId) {
      deudas.set(venta.clienteId, evento.fecha);
    }

    if (venta.formaPago === "contado") {
      contado.push(venta.ventaId);
    }
  }

  const pagos = await crearPagos({ deudas, vendedores });
  const anuladas = mezclar(contado).slice(0, CONFIGURACION.anulaciones);

  for (const ventaId of anuladas) {
    await anularVenta({
      ventaId,
      motivo: "Error en la carga de cantidades",
      usuario: administrador,
    });
  }

  console.log(
    `Clientes: ${registrados.length}. Ventas: ${ventasCreadas} (${anuladas.length} anuladas). Pagos: ${pagos}. Ajustes de stock: ${ajustes}.`,
  );
}

async function sembrar() {
  const administrador = await crearUsuarioSemilla({
    prefijo: "SEED_ADMIN",
    rol: "admin",
    nombrePorDefecto: "Administrador",
  });
  const vendedor = await crearUsuarioSemilla({
    prefijo: "SEED_VENDEDOR",
    rol: "operator",
    nombrePorDefecto: "Vendedor",
  });

  for (const prefijo of PREFIJOS_ADMIN_EXTRA) {
    if (process.env[`${prefijo}_EMAIL`]?.trim()) {
      await crearUsuarioSemilla({
        prefijo,
        rol: "admin",
        nombrePorDefecto: "Administrador",
      });
    }
  }

  await reiniciarDemostracion();
  const categoriasIds = await crearCategorias(administrador);
  await crearProductos({ administrador, categoriasIds });
  await crearMovimientos({ administrador, vendedor });
}

sembrar()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
