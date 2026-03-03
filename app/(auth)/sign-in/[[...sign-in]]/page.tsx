import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-50/60 p-4">
      <SignIn />
    </div>
  );
}
