import { useState, useEffect } from "react";
import { categoriesApi } from "../api/services";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, X, Tag } from "lucide-react";

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await categoriesApi.getAll();
      setCats(r.data.data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setModal(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "" });
    setModal(true);
  };
  const close = () => {
    setModal(false);
    setEditing(null);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error("Name is required");
    setSaving(true);
    try {
      if (editing) {
        await categoriesApi.update(editing.id, form);
      } else {
        await categoriesApi.create(form);
      }
      toast.success(editing ? "Category updated" : "Category created");
      close();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try {
      await categoriesApi.remove(c.id);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Categories</span>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Category
        </button>
      </div>
      <div className="page-body">
        {loading ? (
          <div className="page-loader">
            <div className="spinner" />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {cats.length === 0 && (
              <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                <Tag size={40} />
                <h3>No categories yet</h3>
                <button className="btn btn-primary mt-4" onClick={openCreate}>
                  <Plus size={14} />
                  Add first category
                </button>
              </div>
            )}
            {cats.map((c) => (
              <div key={c.id} className="card" style={{ padding: "1.25rem" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background:
                          "linear-gradient(135deg,#3b82f620,#06b6d420)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Tag size={16} color="var(--accent-light)" />
                    </div>
                    <span className="font-semibold">{c.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn-icon" onClick={() => openEdit(c)}>
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => remove(c)}
                      style={{ color: "var(--red)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {c.description && (
                  <p
                    className="text-sm text-muted"
                    style={{
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {c.description}
                  </p>
                )}
                <div
                  className="text-xs text-muted mt-2"
                  style={{
                    borderTop: "1px solid var(--border-solid)",
                    paddingTop: "0.5rem",
                  }}
                >
                  {c.product_count} active products
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {editing ? "Edit Category" : "Add Category"}
              </span>
              <button className="btn-icon" onClick={close}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={save} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Electronics"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Optional description"
                  style={{ resize: "vertical" }}
                />
              </div>
              <div className="modal-footer" style={{ margin: 0 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={close}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="spinner" />
                  ) : editing ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
