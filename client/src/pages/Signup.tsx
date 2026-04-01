import { useState } from "react";
import { X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import GoogleSignInButton from "@/components/ui/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";

interface SignupProps {
  onClose: () => void;
  onLogin: () => void;
}

export default function Signup({ onClose, onLogin }: SignupProps) {
  const { signup, googleLogin } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    signup.mutate(
      { name, user_name: email, password },
      {
        onError: (err: any) => {
          setError(err.response?.data?.message || "Signup failed");
        },
      }
    );
  };

  const handleGoogle = (idToken: string) => {
    setError("");
    googleLogin.mutate(idToken, {
      onError: (err: any) => {
        setError(err.response?.data?.message || "Google signup failed");
      },
    });
  };

  const isValid = name && email && password && confirmPassword && password === confirmPassword;

  return (
    <div className="min-h-screen flex flex-col px-6 py-6 animate-slideInRight">
      <button onClick={onClose} className="self-start press-scale">
        <X size={24} className="text-text-dark" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center">
        <Logo size="lg" className="mb-12" />

        {error && (
          <div className="w-full px-4 py-3 bg-danger-soft rounded-xl mb-4">
            <p className="font-dm text-sm text-danger text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          <Button type="submit" loading={signup.isPending} disabled={!isValid} className="mt-2">
            Create Account
          </Button>
        </form>

        <div className="w-full mt-3">
          <GoogleSignInButton onCredential={handleGoogle} text="signup_with" />
        </div>

        <div className="font-dm text-sm text-text-grey mt-6">
          Already have an account?{" "}
          <span onClick={onLogin} className="font-semibold text-text-dark underline cursor-pointer" role="button">
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
}
