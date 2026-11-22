import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { Fila, Grilla, Pila, Texto, Titulo } from "@/components/maquetacion";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { FormularioLogin } from "./formulario-login";
import { demoDisponible } from "./actions";

export const metadata: Metadata = {
  title: "Ingresar · Power Up",
};

async function RedirigirSiHaySesion() {
  const sesion = await auth.api.getSession({ headers: await headers() });

  if (sesion) {
    redirect("/");
  }

  return null;
}

export default async function Login() {
  const demo = await demoDisponible();

  return (
    <Grilla className="min-h-screen flex-1 lg:grid-cols-[auto_1fr]">
      <Suspense fallback={null}>
        <RedirigirSiHaySesion />
      </Suspense>
      <Pila
        as="main"
        className="bg-black px-6 py-8 sm:px-12 lg:w-[30rem] lg:pl-16 lg:pr-18 lg:py-12"
      >
        <Logo className="h-8 w-auto self-center text-white lg:hidden" />

        <Fila className="flex-1 py-16">
          <Pila className="w-full gap-10">
            <Pila as="header" className="gap-3">
              <Titulo nivel={1} className="text-7xl">
                Ingresar
              </Titulo>
              <Texto tono="secundario" className="text-[0.9375rem]">
                Entrá con tu cuenta de Power Up.
              </Texto>
            </Pila>

            <FormularioLogin demo={demo} />
          </Pila>
        </Fila>

        <Texto tono="ayuda" className="text-sm">
          ¿No tenés cuenta? Pedísela al administrador.
        </Texto>
      </Pila>

      <Pila
        as="aside"
        aria-hidden="true"
        className="hidden bg-green-950 lg:block relative overflow-hidden"
      >
        <Image
          src="/Jason_and_Lucia_Beach_landscape.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 70vw, 1px"
          className="object-cover object-[70%_center]"
        />
        <Logo className="h-22 absolute left-1/2 top-1/2 -translate-1/2 w-auto self-start text-white bg-black p-2" />
      </Pila>
    </Grilla>
  );
}
