import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// SUPABASE CONFIG
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: "8px", textAlign: "left" };

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>
      {text}
    </td>
  </tr>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  // UI STATES
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [deleteSearch, setDeleteSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

    // Restore from delete history
  async function restoreTransaction(id) {
    setConfirmModal({
      text: "Restore this transaction?",
      onConfirm: async () => {
        await supabase
          .from("inventory_transactions")
          .update({ deleted: false, deleted_at: null })
          .eq("id", id);
        setToast("Transaction restored");
        setConfirmModal(null);
        loadData();
      },
    });
  }


  // Permanent delete
  async function permanentlyDelete(id) {
    setConfirmModal({
      text: "Permanently delete this record? This cannot be undone.",
      danger: true,
      onConfirm: async () => {
        await supabase.from("inventory_transactions").delete().eq("id", id);
        setToast("Transaction permanently deleted");
        setConfirmModal(null);
        loadData();
      },
    });
  }

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    date: "",
    brand: "",
    unit: "",
  });

  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

    // AUTH
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);


  // LOAD DATA
  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, item_name, unit_price");

    const { data: tx, error: txErr } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("deleted", false)
      .order("date", { ascending: false });

    if (txErr) console.error("LOAD TX ERROR", txErr);

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

  // SAVE
  async function saveTransaction() {
    if (!form.item_id || !form.quantity) {
      alert("Complete the form");
      return;
    }

    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) {
      alert("Item not found");
      return;
    }

    const payload = {
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: Number(item.id),
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: Number(item.unit_price),
      brand: form.brand || null,
      unit: form.unit || null,
      deleted: false,
    };

    const { error } = editingId
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingId)
      : await supabase.from("inventory_transactions").insert(payload);

    if (error) {
      console.error("SAVE ERROR", error);
      alert(error.message);
      return;
    }

    setForm({ item_id: "", type: "IN", quantity: "", date: "", brand: "", unit: "" });
    setItemSearch("");
    setEditingId(null);
    await loadData();
  }

  // DELETE MODAL STATE
  const [deleteTarget, setDeleteTarget] = useState(null);

    async function confirmDelete() {
    if (!deleteTarget) return;

    const { error } = await supabase
      .from("inventory_transactions")
      .update({ deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", deleteTarget);

    if (error) {
      alert(error.message);
      return;
    }

    setToast("Transaction deleted (undo available)");
    setDeleteTarget(null);
    await loadData();
  }

  function editTransaction(t) {
    setEditingId(t.id);
    setForm({
      item_id: t.item_id,
      type: t.type,
      quantity: t.quantity,
      date: t.date,
      brand: t.brand || "",
      unit: t.unit || "",
    });
    setItemSearch(t.items?.item_name || "");
  }

  // CLICK OUTSIDE DROPDOWN
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Inventory System</h1>

      <div ref={searchRef} style={{ position: "relative", width: 220 }}>
        <input
          placeholder="Search item..."
          value={itemSearch}
          onFocus={() => setDropdownOpen(true)}
          onChange={e => {
            setItemSearch(e.target.value);
            setDropdownOpen(true);
          }}
        />

        {dropdownOpen && (
          <div style={{ border: "1px solid #ccc", background: "#fff" }}>
            {items
              .filter(i => i.item_name.toLowerCase().includes(itemSearch.toLowerCase()))
              .map(i => (
                <div
                  key={i.id}
                  onClick={() => {
                    setForm({ ...form, item_id: i.id });
                    setItemSearch(i.item_name);
                    setDropdownOpen(false);
                  }}
                >
                  {i.item_name}
                </div>
              ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <label>Brand</label><br />
        <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />

        <br /><label>Unit</label><br />
        <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
      </div>

      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
        <option value="IN">IN</option>
        <option value="OUT">OUT</option>
      </select>

      <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />

      <button onClick={saveTransaction}>{editingId ? "Update" : "Save"}</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <h2>Transactions</h2>
  <button onClick={() => setShowDeleted(s => !s)}>
    {showDeleted ? "Hide Delete History" : "Show Delete History"}
  </button>
</div>

{/* ACTIVE TRANSACTIONS */}
{!showDeleted && (
  <table style={tableStyle}>
    <thead>
      <tr>
        <th style={thtd}>Date</th>
        <th style={thtd}>Item</th>
        <th style={thtd}>Brand</th>
        <th style={thtd}>Unit</th>
        <th style={thtd}>Type</th>
        <th style={thtd}>Qty</th>
        <th style={thtd}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {transactions.length === 0 && emptyRow(7, "No transactions")}
      
)
      {transactions.map(t => (
        <tr key={t.id}>
          <td style={thtd}>{t.date}</td>
          <td style={thtd}>{t.items?.item_name}</td>
          <td style={thtd}>{t.brand || "-"}</td>
          <td style={thtd}>{t.unit || "-"}</td>
          <td style={thtd}>{t.type}</td>
          <td style={thtd}>{t.quantity}</td>
          <td style={thtd}>
            <button onClick={() => editTransaction(t)}>Edit</button>
            <button style={{ marginLeft: 8 }} onClick={() => setDeleteTarget(t.id)}>Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>



{/* DELETE HISTORY */}
{showDeleted && (
  <>
    <input
      placeholder="Search deleted..."
      value={deleteSearch}
      onChange={e => {
        setDeleteSearch(e.target.value);
        setPage(1);
      }}
      style={{ marginBottom: 8 }}
    />
  <table style={tableStyle}>
    <thead>
      <tr>
        <th style={thtd}>Date</th>
        <th style={thtd}>Item</th>
        <th style={thtd}>Brand</th>
        <th style={thtd}>Unit</th>
        <th style={thtd}>Type</th>
        <th style={thtd}>Qty</th>
        <th style={thtd}>Actions</th>
      </tr>
    </thead>
    <tbody>
      {deletedTransactions.length === 0 && emptyRow(7, "No deleted history")}
      {deletedTransactions
        .filter(t =>
          t.items?.item_name?.toLowerCase().includes(deleteSearch.toLowerCase())
        )
        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        .map(t => (
        <tr key={t.id}>
          <td style={thtd}>{t.date}</td>
          <td style={thtd}>{t.items?.item_name}</td>
          <td style={thtd}>{t.brand || "-"}</td>
          <td style={thtd}>{t.unit || "-"}</td>
          <td style={thtd}>{t.type}</td>
          <td style={thtd}>{t.quantity}</td>
          <td style={thtd}>
            <button onClick={() => restoreTransaction(t.id)} title="Restore">♻️ Restore</button>
            <button style={{ marginLeft: 8, color: "#d32f2f" }} onClick={() => permanentlyDelete(t.id)} title="Delete permanently">🗑️ Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}

<h2>Monthly Report</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Item</th>
            <th style={thtd}>Total IN</th>
            <th style={thtd}>Total OUT</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && emptyRow(3, "No report data")}
          {items.map(i => {
            const monthly = transactions.filter(t => t.item_id === i.id);
            const totalIn = monthly.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
            const totalOut = monthly.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);

            return (
              <tr key={i.id}>
                <td style={thtd}>{i.item_name}</td>
                <td style={thtd}>{totalIn}</td>
                <td style={thtd}>{totalOut}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
