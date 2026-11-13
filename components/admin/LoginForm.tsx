"use client";
import { useFormState } from "react-dom";
import { loginAction, type FormState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

const initial: FormState = {};

export default function LoginForm() {
  const [state, action] = useFormState(loginAction, initial);
  return (
    <form action={action} className="card grid gap-4 p-6">
      <label className="text-sm font-bold">البريد الإلكتروني
        <input name="email" type="email" required autoComplete="username" dir="ltr" className="input mt-2" />
      </label>
      <label className="text-sm font-bold">كلمة المرور
        <input name="password" type="password" required autoComplete="current-password" dir="ltr" className="input mt-2" />
      </label>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton>دخول</SubmitButton>
    </form>
  );
}
