"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"

import { signIn } from "@/lib/auth-client"
import { Button } from "@viral-scout/ui/components/button"
import { Input } from "@viral-scout/ui/components/input"
import {
  Field,
  FieldSet,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription
} from "@viral-scout/ui/components/field"

import { loginSchema, type LoginFormValues } from "../schemas"

export const LoginForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/trending"

  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)

    const result = await signIn.email({
      email: values.email,
      password: values.password
    })

    if (result.error) {
      setServerError("Invalid email or password")
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldSet>
        <FieldGroup>
          {/* Email field */}
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError errors={errors.email ? [errors.email] : []} />
          </Field>

          {/* Password field */}
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError errors={errors.password ? [errors.password] : []} />
          </Field>
        </FieldGroup>

        {/* Server error */}
        {serverError && (
          <FieldDescription className="text-destructive text-center">
            {serverError}
          </FieldDescription>
        )}

        <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              {/* <Loader2 className="mr-2 h-4 w-4 animate-spin" /> */}
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </FieldSet>
    </form>
  )
}
