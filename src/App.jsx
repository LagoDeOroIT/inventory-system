import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

// ================= APP =================
export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [deletedSearch, setDeletedSearch] = useState("");
  const [deletedPage, setDeletedPage] = useState(1);([]);
  const [showDeleted, setShowDeleted] = useState(false);

  // Pagination
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  // Monthly report
  const REPORT_PAGE_SIZE = 5;
  const [reportMonth, setReportMonth] = useState("");
  const [reportPage, setReportPage] = useState(1);

  // UI
  const [confirmModal, setConfirmModal] = useState(null);
  const [MONTHLY_PAGE_SIZE] = useState(5);(null);
  const [toast, setToast] = useState(null);

  // Form
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    date: "",
    brand: "",
    unit: "",
    volume_pack: "",
  });

  // Item search dropdown
  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("id, item_name, unit_price");

    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("deleted", false)
      .order("date", { ascending: false });

    const { data: deletedTx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("deleted", true)
      .order("deleted_at", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
    setDeletedTransactions(deletedTx || []);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  // ================= SAVE / UPDATE =================
  async function saveTransaction() {
    if (!form.item_id || !form.quantity) return alert("Complete the form");

    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return alert("Item not found");

    const payload = {
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: Number(form.item_id),
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price,
      brand: form.brand || null,
      unit: form.unit || null,
      volume_pack: form.volume_pack || null,
      deleted: false,
    };

    const { error } = editingId
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingId)
      : await supabase.from("inventory_transactions").insert(payload);

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", date: "", brand: "", unit: "", volume_pack: "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  // ================= EDIT =================
  function editTransaction(t) {
    setConfirmModal({
      text: "Edit this transaction?",
      onConfirm: () => {
        setEditingId(t.id);
        setForm({
          item_id: t.item_id,
          type: t.type,
          quantity: t.quantity,
          date: t.date,
          brand: t.brand || "",
          unit: t.unit || "",
          volume_pack: t.volume_pack || "",
        });
        setItemSearch(t.items?.item_name || "");
        setConfirmModal(null);
      },
    });
  }

  // ================= DELETE =================
  function requestDelete(id) {
    setConfirmModal({
      text: "Delete this transaction?",
      danger: true,
      onConfirm: async () => {
        await supabase
          .from("inventory_transactions")
          .update({ deleted: true, deleted_at: new Date().toISOString() })
          .eq("id", id);
        setConfirmModal(null);
        loadData();
      },
    });
  }

  // ================= RESTORE / PERMANENT DELETE =================
  function restoreTransaction(id) {
    setConfirmModal({
      text: "Restore this transaction?",
      onConfirm: async () => {
        await supabase.from("inventory_transactions").update({ deleted: false, deleted_at: null }).eq("id", id);
        setConfirmModal(null);
        loadData();
      },
    });
  }

  function permanentlyDelete(id) {
    setConfirmModal({
      text: "Permanently delete this record?",
      danger: true,
      onConfirm: async () => {
        await supabase.from("inventory_transactions").delete().eq("id", id);
        setConfirmModal(null);
        loadData();
      },
    });
  }

  // ================= DROPDOWN CLICK OUTSIDE =================
  useEffect(() => {
    const handler = e => searchRef.current && !searchRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ================= LOGIN =================
  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>Login with Google</button>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div style={{ padding: 20 }}>
      {confirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 20, borderRadius: 6, minWidth: 280 }}>
            <p>{confirmModal.text}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button style={{ color: confirmModal?.danger ? "#d32f2f" : "#000" }} onClick={confirmModal.onConfirm}>Confirm</button>
              <button onClick={() => setConfirmModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <h1>Inventory System</h1>

      {/* FORM */}
      <div ref={searchRef} style={{ position: "relative", width: 250 }}>
        <input placeholder="Search item..." value={itemSearch} onFocus={() => setDropdownOpen(true)} onChange={e => { setItemSearch(e.target.value); setDropdownOpen(true); }} />
        {dropdownOpen && (
          <div style={{ border: "1px solid #ccc", background: "#fff" }}>
            {items.filter(i => i.item_name.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
              <div key={i.id} onClick={() => { setForm({ ...form, item_id: i.id }); setItemSearch(i.item_name); setDropdownOpen(false); }}>{i.item_name}</div>
            ))}
          </div>
        )}
      </div>

      <input placeholder="Brand" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
      <input placeholder="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
      <input placeholder="Volume / Pack" value={form.volume_pack} onChange={e => setForm({ ...form, volume_pack: e.target.value })} />
      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>IN</option><option>OUT</option></select>
      <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      <button onClick={saveTransaction}>{editingId ? "Update" : "Save"}</button>

      {/* TRANSACTIONS */}
      <h2>Transactions</h2>
      <table style={tableStyle}>
        <thead>
          <tr><th style={thtd}>Date</th><th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Unit</th><th style={thtd}>Volume</th><th style={thtd}>Type</th><th style={thtd}>Qty</th><th style={thtd}>Actions</th></tr>
        </thead>
        <tbody>
          {transactions.length === 0 && emptyRow(8, "No transactions")}
          {transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(t => (
            <tr key={t.id}>
              ate).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })}</td>
              <td style={thtd}>{t.items?.item_name}</td>
              <td style={thtd}>{t.brand}</td>
              <td style={thtd}>{t.unit}</td>
              <td style={thtd}>{t.volume_pack}</td>
              <td style={thtd}>{t.type}</td>
              <td style={thtd}>{t.quantity}</td>
              <td style={thtd}>
                <button onClick={() => editTransaction(t)}>✏️</button>
                <button onClick={() => requestDelete(t.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</button>
        <span> Page {page} </span>
        <button disabled={page*PAGE_SIZE>=transactions.length} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>

      {/* DELETE HISTORY */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 30 }}>
        <h2>Delete History</h2>
        <button onClick={() => setShowDeleted(v => !v)}>
          {showDeleted ? "Hide Delete History" : "Show Delete History"}
        </button>
      </div>

      {showDeleted && (
        <>
          <input
            placeholder="Search deleted..."
            value={deletedSearch}
            onChange={e => { setDeletedSearch(e.target.value); setDeletedPage(1); }}
          />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th><th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Unit</th><th style={thtd}>Volume</th><th style={thtd}>Type</th><th style={thtd}>Qty</th><th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deletedTransactions
                .filter(t => (t.items?.item_name || "").toLowerCase().includes(deletedSearch.toLowerCase()))
                .slice((deletedPage - 1) * PAGE_SIZE, deletedPage * PAGE_SIZE)
                .map(t => (
                  <tr key={t.id}>
                    ate).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })}</td>
                    <td style={thtd}>{t.items?.item_name}</td>
                    <td style={thtd}>{t.brand}</td>
                    <td style={thtd}>{t.unit}</td>
                    <td style={thtd}>{t.volume_pack}</td>
                    <td style={thtd}>{t.type}</td>
                    <td style={thtd}>{t.quantity}</td>
                    <td style={thtd}>
                      <button onClick={() => restoreTransaction(t.id)}>♻️</button>
                      <button onClick={() => permanentlyDelete(t.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div>
            <button disabled={deletedPage===1} onClick={()=>setDeletedPage(p=>p-1)}>Prev</button>
            <span> Page {deletedPage} </span>
            <button disabled={deletedPage*PAGE_SIZE>=deletedTransactions.length} onClick={()=>setDeletedPage(p=>p+1)}>Next</button>
          </div>
        </>
      )
    </div>
  );


      {/* MONTHLY REPORT */}
      <h2 style={{ marginTop: 40 }}>Monthly Report</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input
          type="month"
          value={reportMonth}
          onChange={e => { setReportMonth(e.target.value); setReportPage(1); }}
        />
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Item</th>
            <th style={thtd}>Brand</th>
            <th style={thtd}>Unit</th>
            <th style={thtd}>Volume</th>
            <th style={thtd}>Qty</th>
            <th style={thtd}>Total Price</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            const filtered = transactions.filter(t => {
              if (!reportMonth) return true;
              return t.date?.startsWith(reportMonth);
            });

            const grouped = {};
            filtered.forEach(t => {
              const key = `${t.item_id}-${t.brand}-${t.unit}-${t.volume_pack}`;
              if (!grouped[key]) {
                grouped[key] = {
                  name: t.items?.item_name,
                  brand: t.brand,
                  unit: t.unit,
                  volume: t.volume_pack,
                  qty: 0,
                  total: 0,
                };
              }
              grouped[key].qty += t.quantity;
              grouped[key].total += t.quantity * t.unit_price;
            });

            const rows = Object.values(grouped);
            const paged = rows.slice((reportPage - 1) * REPORT_PAGE_SIZE, reportPage * REPORT_PAGE_SIZE);

            if (rows.length === 0) return emptyRow(6, "No report data");

            return paged.map((r, i) => (
              <tr key={i}>
                <td style={thtd}>{r.name}</td>
                <td style={thtd}>{r.brand}</td>
                <td style={thtd}>{r.unit}</td>
                <td style={thtd}>{r.volume}</td>
                <td style={thtd}>{r.qty}</td>
                <td style={thtd}>₱{r.total.toFixed(2)}</td>
              </tr>
            ));
          })()}
        </tbody>
      </table>

      {(() => {
        const filtered = transactions.filter(t => !reportMonth || t.date?.startsWith(reportMonth));
        const total = filtered.reduce((s, t) => s + t.quantity * t.unit_price, 0);
        const avg = filtered.length ? total / filtered.length : 0;
        return (
          <p style={{ marginTop: 10 }}>
            <strong>Total Average Price:</strong> ₱{avg.toFixed(2)}
          </p>
        );
      })()}

      <div>
        <button disabled={reportPage === 1} onClick={() => setReportPage(p => p - 1)}>Prev</button>
        <span> Page {reportPage} </span>
        <button onClick={() => setReportPage(p => p + 1)}>Next</button>
      </div>

    </div>
  );
}
