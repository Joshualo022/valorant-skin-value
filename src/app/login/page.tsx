import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Log in</h1>
        <LoginForm />
      </div>
    </div>
  );
}
