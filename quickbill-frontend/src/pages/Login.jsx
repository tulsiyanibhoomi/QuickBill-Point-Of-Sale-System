import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/services";
import toast from "react-hot-toast";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password)
      return toast.error("Fill in all fields");
    setLoading(true);
    try {
      const res = await authApi.login(form);
      login(res.data.data.token, res.data.data.user);
      toast.success(`Welcome, ${res.data.data.user.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: "1rem",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 400,
          background: "radial-gradient(ellipse, #3b82f615 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 420 }} className="fade-in">
        {/* Logo */}
        <div
          className="flex flex-col items-center gap-3"
          style={{ marginBottom: "2.5rem" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
              borderRadius: 16,
              padding: "14px 16px",
              display: "flex",
              boxShadow: "0 0 40px #3b82f640",
            }}
          >
            <Zap size={28} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                background: "linear-gradient(135deg,#f1f5f9,#94a3b8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              QuickBill
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginTop: "0.2rem",
              }}
            >
              Retail POS & Billing System
            </p>
          </div>
        </div>

        <div
          className="card"
          style={{
            border: "1px solid var(--border-solid)",
            boxShadow: "0 20px 60px #00000060",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              marginBottom: "0.35rem",
            }}
          >
            Sign In
          </h2>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: "1.5rem",
            }}
          >
            Enter your credentials to continue
          </p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                id="username"
                type="text"
                placeholder="username"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  style={{ paddingRight: "2.5rem" }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ justifyContent: "center", marginTop: "0.5rem" }}
            >
              {loading ? <span className="spinner" /> : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
