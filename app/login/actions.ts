"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { ejecutarAccion } from "@/lib/acciones";
import { ApiError } from "@/lib/api/errores";
import { auth } from "@/lib/auth";

const FORMATO_CORREO = /^\S+@\S+\.\S{2,}$/;
const MENSAJE_INVALIDO = "Correo o contraseña incorrectos.";

type Credenciales = {
  correo: string;
  clave: string;
};

type RolDemo = "admin" | "vendedor";

const PREFIJOS_DEMO: Record<RolDemo, string> = {
  admin: "DEMO_ADMIN",
  vendedor: "DEMO_VENDEDOR",
};

function credencialesInvalidas() {
  return new ApiError(401, "CREDENCIALES_INVALIDAS", MENSAJE_INVALIDO);
}

export async function iniciarSesion({ correo, clave }: Credenciales) {
  return ejecutarAccion(async () => {
    const correoLimpio = typeof correo === "string" ? correo.trim() : "";

    if (
      !FORMATO_CORREO.test(correoLimpio) ||
      typeof clave !== "string" ||
      !clave
    ) {
      throw credencialesInvalidas();
    }

    await ingresar({ correo: correoLimpio, clave });
  });
}

async function ingresar({ correo, clave }: Credenciales) {
  try {
    await auth.api.signInEmail({
      body: { email: correo, password: clave },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      throw credencialesInvalidas();
    }

    throw error;
  }

  redirect("/");
}

function credencialesDemo(rol: RolDemo) {
  const prefijo = PREFIJOS_DEMO[rol];
  const correo = process.env[`${prefijo}_EMAIL`]?.trim();
  const clave = process.env[`${prefijo}_PASSWORD`];

  return correo && clave ? { correo, clave } : null;
}

export async function demoDisponible() {
  return Boolean(credencialesDemo("admin") && credencialesDemo("vendedor"));
}

export async function entrarDemo(rol: RolDemo) {
  return ejecutarAccion(async () => {
    const credenciales = rol in PREFIJOS_DEMO ? credencialesDemo(rol) : null;

    if (!credenciales) {
      throw new ApiError(
        404,
        "NO_ENCONTRADO",
        "El modo demo no está disponible.",
      );
    }

    await ingresar(credenciales);
  });
}
