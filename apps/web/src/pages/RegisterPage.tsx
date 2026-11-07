import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await authClient.signUp.email({
      name,
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message ?? "Unable to register");
      return;
    }
    navigate("/app/character/new");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="panel rounded-xl p-8">
        <h1 className="font-display text-3xl text-forest">Create account</h1>
        <p className="mt-2 text-steel">Your campaign starts with a name.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label" htmlFor="name">
              Display name
            </label>
            <input
              id="name"
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-crimson">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-steel">
          Already adventuring?{" "}
          <Link className="font-semibold text-forest" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
