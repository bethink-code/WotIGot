import { useEffect, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { publicApi, setTokens } from "@/lib/api";

export default function GoogleCallback() {
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");

    if (!idToken) {
      setError("No token received from Google");
      return;
    }

    publicApi
      .post("/auth/google", { id_token: idToken })
      .then((res) => {
        setTokens(res.data);
        // Full page reload to reset all auth state cleanly
        window.location.href = "/";
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Google login failed");
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="px-4 py-3 bg-danger-soft rounded-xl mb-4">
          <p className="font-dm text-sm text-danger text-center">{error}</p>
        </div>
        <a href="/" className="font-dm text-sm text-text-dark underline">
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}
