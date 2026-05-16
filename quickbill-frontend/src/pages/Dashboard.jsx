import { useEffect, useState } from "react";
import { dashboardApi } from "../api/services";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  Package,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const fmtRs = (n) => `₹${fmt(n)}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-solid)",
        borderRadius: "var(--radius)",
        padding: "0.75rem 1rem",
        fontSize: "0.8rem",
      }}
    >
      <p style={{ color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.name === "Revenue" ? fmtRs(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topProds, setTopProds] = useState([]);
  const [catRev, setCatRev] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, r, t, c] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getRevenue({ days }),
        dashboardApi.getTopProducts({ limit: 5 }),
        dashboardApi.getCategoryRevenue(),
      ]);
      setSummary(s.data.data);
      setRevenue(
        r.data.data.map((row) => ({
          date: row.sale_date?.slice(5),
          Revenue: +row.revenue,
          Orders: +row.orders,
        })),
      );
      setTopProds(t.data.data);
      setCatRev(c.data.data);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
  ];

  const stats = [
    {
      label: "Today's Revenue",
      value: fmtRs(summary?.total_revenue),
      icon: IndianRupee,
      color: "#3b82f6",
      bg: "#3b82f615",
      sub: `${summary?.total_orders} orders`,
    },
    {
      label: "Cash Sales",
      value: summary?.cash_orders,
      icon: ShoppingBag,
      color: "#10b981",
      bg: "#10b98115",
      sub: "CASH payments",
    },
    {
      label: "UPI / Card",
      value: +summary?.upi_orders + +summary?.card_orders,
      icon: TrendingUp,
      color: "#8b5cf6",
      bg: "#8b5cf615",
      sub: "Digital payments",
    },
    {
      label: "Low Stock",
      value: summary?.low_stock_count,
      icon: AlertTriangle,
      color: "#f59e0b",
      bg: "#f59e0b15",
      sub: "Products to restock",
    },
    {
      label: "Total Products",
      value: summary?.total_products,
      icon: Package,
      color: "#06b6d4",
      bg: "#06b6d415",
      sub: "Active products",
    },
    {
      label: "Tax Collected",
      value: fmtRs(summary?.total_tax),
      icon: Tag,
      color: "#f97316",
      bg: "#f9731615",
      sub: "GST today",
    },
  ];

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet([summary || {}]);
    const revenueSheet = XLSX.utils.json_to_sheet(revenue);
    const productSheet = XLSX.utils.json_to_sheet(topProds);
    const categorySheet = XLSX.utils.json_to_sheet(catRev);

    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(wb, revenueSheet, "Revenue");
    XLSX.utils.book_append_sheet(wb, productSheet, "Top Products");
    XLSX.utils.book_append_sheet(wb, categorySheet, "Categories");

    XLSX.writeFile(wb, `dashboard_report_${days}days.xlsx`);
  };

  return (
    <div id="dashboard-export-area">
      <div className="topbar">
        <span className="topbar-title">Dashboard</span>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`btn btn-sm ${days === d ? "btn-primary" : "btn-secondary"}`}
            >
              {d}d
            </button>
          ))}
          <button onClick={exportToExcel} className="btn btn-secondary btn-sm">
            Export Excel
          </button>
        </div>
      </div>

      <div className="page-body flex flex-col gap-6">
        {/* Stat cards */}
        <div
          className="grid-3"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "1rem",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="stat-card"
              style={{ "--accent-c": s.color }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: s.color,
                  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                }}
              />
              <div className="stat-icon" style={{ background: s.bg }}>
                <s.icon size={18} color={s.color} />
              </div>
              <div className="stat-value" style={{ color: s.color }}>
                {s.value ?? 0}
              </div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="card">
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: "1.25rem" }}
          >
            <h3 className="font-semibold">Revenue Trend</h3>
            <span className="text-sm text-muted">Last {days} days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="#3b82f6"
                fill="url(#revGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          {/* Top products */}
          <div className="card">
            <h3 className="font-semibold" style={{ marginBottom: "1rem" }}>
              Top Products
            </h3>
            <div className="flex flex-col gap-3">
              {topProds.length === 0 && (
                <p className="text-sm text-muted">No sales yet</p>
              )}
              {topProds.map((p, i) => (
                <div key={p.product_id} className="flex items-center gap-3">
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: COLORS[i % COLORS.length] + "25",
                      color: COLORS[i % COLORS.length],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="text-sm font-medium truncate">
                      {p.product_name}
                    </div>
                    <div className="text-xs text-muted">
                      {p.total_qty_sold} units sold
                    </div>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--accent-light)" }}
                  >
                    {fmtRs(p.total_revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category revenue */}
          <div className="card">
            <h3 className="font-semibold" style={{ marginBottom: "1rem" }}>
              Category Revenue
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={catRev} layout="vertical" margin={{ left: 0 }}>
                <XAxis
                  type="number"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="total_revenue"
                  name="Revenue"
                  radius={[0, 4, 4, 0]}
                >
                  {catRev.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="card">
          <h3 className="font-semibold" style={{ marginBottom: "1rem" }}>
            Today's Payment Methods
          </h3>
          <div className="flex gap-6">
            {[
              { label: "Cash", value: summary?.cash_orders, color: "#10b981" },
              { label: "UPI", value: summary?.upi_orders, color: "#3b82f6" },
              { label: "Card", value: summary?.card_orders, color: "#8b5cf6" },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: m.color,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div className="text-sm font-semibold">
                    {m.value ?? 0} orders
                  </div>
                  <div className="text-xs text-muted">{m.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
