import { useState, useEffect, useRef, useCallback } from "react";
import { productsApi, ordersApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ChevronRight,
  Tag,
  CreditCard,
} from "lucide-react";
import { Package } from "lucide-react";

const fmtRs = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function POS() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCat] = useState("");
  const [cart, setCart] = useState([]);
  const [loadingP, setLoadingP] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showCheckout, setCheckout] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customer_name: "",
    customer_phone: "",
    discount_amount: 0,
    payment_method: "CASH",
    notes: "",
  });

  useEffect(() => {
    loadProducts();
  }, [search, catFilter]);
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const loadProducts = useCallback(async () => {
    setLoadingP(true);
    try {
      const res = await productsApi.getAll({ search, limit: 60 });
      setProducts(res.data.data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoadingP(false);
    }
  }, [search, catFilter]);

  const addToCart = (product) => {
    if (product.quantity_in_stock < 1) return toast.error("Out of stock");
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity_in_stock) {
          toast.error("Max stock reached");
          return prev;
        }
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          selling_price: product.selling_price,
          tax_rate: product.tax_rate,
          quantity: 1,
          max_qty: product.quantity_in_stock,
        },
      ];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? {
              ...i,
              quantity: Math.max(1, Math.min(i.quantity + delta, i.max_qty)),
            }
          : i,
      ),
    );
  };

  const removeFromCart = (productId) =>
    setCart((prev) => prev.filter((i) => i.product_id !== productId));

  const cartTotals = cart.reduce(
    (acc, item) => {
      const taxAmt =
        ((Number(item.selling_price) * Number(item.tax_rate)) / 100) *
        Number(item.quantity);
      const lineTotal =
        (Number(item.selling_price) +
          (Number(item.selling_price) * Number(item.tax_rate)) / 100) *
        Number(item.quantity);
      acc.subtotal += Number(item.selling_price) * Number(item.quantity);
      acc.tax += taxAmt;
      acc.total += lineTotal;
      return acc;
    },
    { subtotal: 0, tax: 0, total: 0 },
  );

  const discount = parseFloat(orderForm.discount_amount || 0);
  const grandTotal = Math.max(0, cartTotals.total - discount);

  const placeOrder = async () => {
    if (!cart.length) return toast.error("Cart is empty");
    setPlacing(true);
    try {
      const res = await ordersApi.create({
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        customer_name: orderForm.customer_name || undefined,
        customer_phone: orderForm.customer_phone || undefined,
        discount_amount: discount || undefined,
        payment_method: orderForm.payment_method,
        notes: orderForm.notes || undefined,
      });
      toast.success("Order placed! Invoice generated.");
      const invoiceId = res.data.data.id;
      setCart([]);
      setCheckout(false);
      setOrderForm({
        customer_name: "",
        customer_phone: "",
        discount_amount: 0,
        payment_method: "CASH",
        notes: "",
      });
      navigate(`/invoices/${invoiceId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  // Categories from product list
  const cats = [
    ...new Set(products.map((p) => p.category_name).filter(Boolean)),
  ];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="topbar">
        <span className="topbar-title">🛒 POS — Billing Counter</span>
        <span className="text-sm text-muted">
          Cashier:{" "}
          <strong style={{ color: "var(--text-primary)" }}>{user?.name}</strong>
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 370px",
          overflow: "hidden",
        }}
      >
        {/* LEFT: Products */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "1rem",
            gap: "0.75rem",
            overflow: "hidden",
          }}
        >
          {/* Search & filter */}
          <div className="flex gap-2">
            <div className="search-wrap" style={{ flex: 1 }}>
              <Search size={15} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, SKU, barcode…"
              />
            </div>
            {search && (
              <button className="btn-icon" onClick={() => setSearch("")}>
                <X size={15} />
              </button>
            )}
          </div>

          {cats.length > 0 && (
            <div
              className="flex gap-2"
              style={{ overflowX: "auto", paddingBottom: "4px", flexShrink: 0 }}
            >
              <button
                onClick={() => setCat("")}
                className={`btn btn-sm ${catFilter === "" ? "btn-primary" : "btn-secondary"}`}
              >
                All
              </button>
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c === catFilter ? "" : c)}
                  className={`btn btn-sm ${catFilter === c ? "btn-primary" : "btn-secondary"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Product grid */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingP ? (
              <div className="page-loader">
                <div className="spinner" />
              </div>
            ) : (
              <div className="product-grid">
                {products
                  .filter((p) => !catFilter || p.category_name === catFilter)
                  .map((p) => (
                    <div
                      key={p.id}
                      className={`product-card${p.quantity_in_stock < 1 ? " out-of-stock" : ""}`}
                      onClick={() => addToCart(p)}
                    >
                      <div className="p-name">{p.name}</div>
                      {p.sku && (
                        <div className="text-xs text-muted mono">{p.sku}</div>
                      )}
                      <div className="p-price">{fmtRs(p.selling_price)}</div>
                      <div
                        className={`p-stock ${p.quantity_in_stock < 1 ? "text-red" : p.quantity_in_stock <= 5 ? "text-yellow" : "text-muted"}`}
                      >
                        {p.quantity_in_stock < 1
                          ? "⚠ Out of stock"
                          : `${p.quantity_in_stock} in stock`}
                      </div>
                      {p.category_name && (
                        <span
                          className="badge badge-blue"
                          style={{ marginTop: "0.2rem", fontSize: "0.65rem" }}
                        >
                          <Tag size={9} />
                          {p.category_name}
                        </span>
                      )}
                    </div>
                  ))}
                {!loadingP &&
                  products.filter(
                    (p) => !catFilter || p.category_name === catFilter,
                  ).length === 0 && (
                    <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                      <Package
                        size={40}
                        style={{ opacity: 0.2, marginBottom: "0.5rem" }}
                      />
                      <h3>No products found</h3>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="pos-right">
          <div className="cart-header">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2">
                <ShoppingCart size={16} /> Cart
              </span>
              <span className="badge badge-blue">{cart.length} items</span>
            </div>
          </div>

          <div className="cart-items">
            {cart.length === 0 && (
              <div className="empty-state">
                <ShoppingCart
                  size={36}
                  style={{ opacity: 0.15, margin: "1rem auto 0.5rem" }}
                />
                <p className="text-sm text-muted">Tap a product to add</p>
              </div>
            )}
            {cart.map((item) => (
              <div key={item.product_id} className="cart-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm font-medium truncate">
                    {item.product_name}
                  </div>
                  <div className="text-xs text-muted">
                    {fmtRs(item.selling_price)} * {item.quantity}
                  </div>
                </div>
                <div className="qty-ctrl">
                  <button
                    className="qty-btn"
                    onClick={() =>
                      item.quantity === 1
                        ? removeFromCart(item.product_id)
                        : updateQty(item.product_id, -1)
                    }
                  >
                    {item.quantity === 1 ? (
                      <Trash2 size={11} />
                    ) : (
                      <Minus size={11} />
                    )}
                  </button>
                  <span className="qty-val">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.product_id, 1)}
                  >
                    <Plus size={11} />
                  </button>
                </div>
                <div
                  style={{
                    width: 72,
                    textAlign: "right",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--accent-light)",
                  }}
                >
                  {fmtRs(
                    (Number(item.selling_price) +
                      (Number(item.selling_price) * Number(item.tax_rate)) /
                        100) *
                      Number(item.quantity),
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="total-row">
              <span className="text-muted">Subtotal</span>
              <span>{fmtRs(cartTotals.subtotal)}</span>
            </div>
            <div className="total-row">
              <span className="text-muted">GST</span>
              <span>{fmtRs(cartTotals.tax)}</span>
            </div>
            {discount > 0 && (
              <div className="total-row text-green">
                <span>Discount</span>
                <span>-{fmtRs(discount)}</span>
              </div>
            )}
            <hr className="divider" style={{ margin: "0.25rem 0" }} />
            <div className="total-row grand">
              <span>Grand Total</span>
              <span>{fmtRs(Number(grandTotal))}</span>
            </div>

            {!showCheckout && (
              <button
                className="btn btn-primary btn-lg w-full"
                style={{ justifyContent: "center", marginTop: "0.25rem" }}
                disabled={cart.length === 0}
                onClick={() => setCheckout(true)}
              >
                Checkout <ChevronRight size={16} />
              </button>
            )}

            {showCheckout && (
              <div className="flex flex-col gap-3">
                <div className="form-group">
                  <label className="form-label">Customer Name (optional)</label>
                  <input
                    value={orderForm.customer_name}
                    onChange={(e) =>
                      setOrderForm((f) => ({
                        ...f,
                        customer_name: e.target.value,
                      }))
                    }
                    placeholder="Walk-in Customer"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (optional)</label>
                  <input
                    value={orderForm.customer_phone}
                    onChange={(e) =>
                      setOrderForm((f) => ({
                        ...f,
                        customer_phone: e.target.value,
                      }))
                    }
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={orderForm.discount_amount}
                    onChange={(e) =>
                      setOrderForm((f) => ({
                        ...f,
                        discount_amount: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <div className="flex gap-2">
                    {["CASH", "UPI", "CARD"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`btn btn-sm ${orderForm.payment_method === m ? "btn-primary" : "btn-secondary"}`}
                        style={{ flex: 1, justifyContent: "center" }}
                        onClick={() =>
                          setOrderForm((f) => ({ ...f, payment_method: m }))
                        }
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCheckout(false)}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    Back
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={placeOrder}
                    disabled={placing}
                    style={{ flex: 2, justifyContent: "center" }}
                  >
                    {placing ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        <CreditCard size={15} /> Confirm & Bill
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
