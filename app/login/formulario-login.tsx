"use client";

import { AvisoError } from "@/components/aviso-error";
import { useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { entrarDemo, iniciarSesion } from "./actions";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Eye } from "pixelarticons/react/Eye.js";
import { EyeOff } from "pixelarticons/react/EyeOff.js";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

const FORMATO_CORREO = /^\S+@\S+\.\S{2,}$/;
const BLOQUES_CAMPO = 10;
const BLOQUES_TOTAL = BLOQUES_CAMPO * 2;
const LARGO_CLAVE = 8;

type Errores = {
  correo?: string;
  clave?: string;
};

function progresoCorreo(correo: string) {
  const texto = correo.trim();
  const [usuario, dominio] = texto.split("@");

  if (FORMATO_CORREO.test(texto)) {
    return BLOQUES_CAMPO;
  }

  return dominio === undefined
    ? Math.min(usuario.length, 4)
    : Math.min(5 + dominio.length, BLOQUES_CAMPO - 1);
}

function progresoClave(clave: string) {
  return Math.min(
    BLOQUES_CAMPO,
    Math.ceil((clave.length * BLOQUES_CAMPO) / LARGO_CLAVE),
  );
}

function validar({ correo, clave }: { correo: string; clave: string }) {
  const errores: Errores = {};

  if (!correo.trim()) {
    errores.correo = "Ingresá tu correo.";
  } else if (!FORMATO_CORREO.test(correo.trim())) {
    errores.correo = "Revisá el correo: falta el @ o el dominio.";
  }

  if (!clave) {
    errores.clave = "Ingresá tu contraseña.";
  }

  return errores;
}

export function FormularioLogin({ demo }: { demo: boolean }) {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [visible, setVisible] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [pendiente, iniciar] = useTransition();
  const campoCorreo = useRef<HTMLInputElement>(null);
  const campoClave = useRef<HTMLInputElement>(null);

  const llenos = progresoCorreo(correo) + progresoClave(clave);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = validar({ correo, clave });
    setErrores(encontrados);
    setErrorGeneral("");

    if (encontrados.correo) {
      campoCorreo.current?.focus();
    } else if (encontrados.clave) {
      campoClave.current?.focus();
    } else {
      iniciar(async () => {
        const respuesta = await iniciarSesion({ correo, clave });

        if (!respuesta.ok) {
          setErrorGeneral(respuesta.error.message);
        }
      });
    }
  }

  function probarDemo(rol: "admin" | "vendedor") {
    setErrores({});
    setErrorGeneral("");
    iniciar(async () => {
      const respuesta = await entrarDemo(rol);

      if (!respuesta.ok) {
        setErrorGeneral(respuesta.error.message);
      }
    });
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="@container flex flex-col gap-6"
    >
      <div className="grid items-start gap-6 @lg:grid-cols-2 @lg:gap-4">
        <Field>
          <FieldLabel htmlFor="correo" className="text-foreground">
            Correo electrónico
          </FieldLabel>
          <Input
            ref={campoCorreo}
            id="correo"
            name="correo"
            type="email"
            autoComplete="username"
            placeholder="nombre@comercio.com"
            value={correo}
            onChange={(evento) => {
              setCorreo(evento.target.value);
              setErrores({ ...errores, correo: undefined });
            }}
            aria-invalid={errores.correo ? true : undefined}
            aria-describedby={errores.correo ? "error-correo" : undefined}
          />
          {errores.correo ? (
            <FieldError id="error-correo">{errores.correo}</FieldError>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="clave" className="text-foreground">
            Contraseña
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              ref={campoClave}
              id="clave"
              name="clave"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              value={clave}
              onChange={(evento) => {
                setClave(evento.target.value);
                setErrores({ ...errores, clave: undefined });
              }}
              aria-invalid={errores.clave ? true : undefined}
              aria-describedby={errores.clave ? "error-clave" : undefined}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon"
                onClick={() => setVisible(!visible)}
                aria-pressed={visible}
                aria-controls="clave"
                aria-label={
                  visible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {visible ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {errores.clave ? (
            <FieldError id="error-clave">{errores.clave}</FieldError>
          ) : null}
        </Field>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <div aria-hidden="true" className="flex h-1.5 gap-0.5">
          {Array.from({ length: BLOQUES_TOTAL }, (_, indice) => (
            <span
              key={indice}
              className={`flex-1 transition-colors duration-200 ${indice < llenos ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        {errorGeneral ? <AvisoError>{errorGeneral}</AvisoError> : null}
        <Button
          variant="default"
          type="submit"
          disabled={pendiente}
          className="w-full"
        >
          {pendiente ? "Ingresando…" : "Ingresar"}
        </Button>
      </div>

      {demo ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm text-neutral-400">
            O entrá en modo demo, sin cuenta:
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={pendiente}
              onClick={() => probarDemo("admin")}
            >
              Administrador
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={pendiente}
              onClick={() => probarDemo("vendedor")}
            >
              Vendedor
            </Button>
          </div>
        </fieldset>
      ) : null}
    </form>
  );
}
