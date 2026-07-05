import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold">Sign up</h1>
        <SignupForm />
      </div>
    </div>
  );
}
