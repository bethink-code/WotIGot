import { useState } from "react";
import { X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import GoogleSignInButton from "@/components/ui/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";

interface LoginProps {
  onClose: () => void;
  onSignup: () => void;
}

export default function Login({ onClose, onSignup }: LoginProps) {
  const { login, googleLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate(
      { username, password },
      {
        onError: (err: any) => {
          setError(err.response?.data?.message || "Invalid credentials");
        },
      }
    );
  };

  const handleGoogle = (idToken: string) => {
    setError("");
    googleLogin.mutate(idToken, {
      onError: (err: any) => {
        setError(err.response?.data?.message || "Google login failed");
      },
    });
  };

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
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <Button type="submit" loading={login.isPending} disabled={!username || !password} className="mt-2">
            Sign In
          </Button>
        </form>

        <div className="w-full mt-3">
          <GoogleSignInButton onCredential={handleGoogle} text="signin_with" />
        </div>

        <div className="font-dm text-sm text-text-grey mt-6">
          Don't have an account?{" "}
          <span onClick={onSignup} className="font-semibold text-text-dark underline cursor-pointer" role="button">
            Sign Up
          </span>
        </div>
      </div>
    </div>
  );
}
