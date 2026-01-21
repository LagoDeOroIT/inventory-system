import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const editingRowStyle = { background: "#fff7ed" };

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>
      {text}
    </td>
  </tr>
);

export default function App() {
  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  const [activeTab, setActiveTab] = useState("transactions");

  const PAGE_SIZE = 5;
  const [txPage, setTxPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);

  const [editingId, setEditingId] = useState(null);
  const originalFormRef = useRef(null);

  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    date: "",
    brand: "",
    unit: "",
    volume_pack: "",
  });

  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  const [confirm, setConfirm] = useState(null);

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, item_name, unit_price, brand");

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

  // ================= HELPERS =================
  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(
      (k) => String(originalFormRef.current[k] || "") !== String(form[k] || "")
    );
  }

  async function saveTransaction() {
    if (!form.item_id || !form.quantity) {
      alert("Complete the form");
      return;
    }

    const item = items.find((i) => i.id === Number(form.item_id));
    if (!item) return alert("Item not found");

    const payload = {
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: Number(form.item_id),
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price,
      brand: form.brand || item.brand || null,
      unit: form.unit || null,
      volume_pack: form.volume_pack || null,
      deleted: false,
    };

    const { error } = editingId
      ? await supabase
          .from("inventory_transactions")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("inventory_transactions").insert(payload);

    if (error) return alert(error.message);

    setForm({
      item_id: "",
      type: "IN",
      quantity: "",
      date: "",
      brand: "",
      unit: "",
      volume_pack: "",
    });

    setItemSearch("");
    setEditingId(null);
    originalFormRef.current = null;
    loadData();
  }

  // ================= MONTHLY TOTALS =================
  const monthlyTotals = transactions.reduce((acc, t) => {
    if (!t.date) return acc;
    const month = t.date.slice(0, 7);
    acc[month] = acc[month] || { IN: 0, OUT: 0 };
    acc[month][t.type] += t.quantity * t.unit_price;
    return acc;
  }, {});

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ================= LOGIN =================
  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        <button
          onClick={() =>
            supabase.auth.signInWithOAuth({ provider: "google" })
          }
        >
          Login with Google
        </button>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div style={{ padding: 20 }}>
      <h1>Inventory System</h1>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("transactions")}>
          Transactions
        </button>
        <button onClick={() => setActiveTab("deleted")}>Deleted</button>
        <button onClick={() => setActiveTab("report")}>Monthly Report</button>
      </div>

      {/* TRANSACTIONS TAB */}
      {activeTab === "transactions" && (
        <>
          <div
            style={{
              border: "1px solid #ddd",
              padding: 12,
              borderRadius: 6,
            }}
          >
            <h3>{editingId ? "Edit Transaction" : "Add Transaction"}</h3>

            <div
              style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
              ref={searchRef}
            >
              <input
                placeholder="Search item"
                value={itemSearch}
                onChange={(e) => {
                  setItemSearch(e.target.value);
                  setDropdownOpen(true);
                }}
              />

              {dropdownOpen && itemSearch && (
                <div
                  style={{
                    position: "absolute",
                    background: "#fff",
                    border: "1px solid #ccc",
                    maxHeight: 150,
                    overflow: "auto",
                    zIndex: 10,
                  }}
                >
                  {items
                    .filter((i) =>
                      i.item_name
                        .toLowerCase()
                        .includes(itemSearch.toLowerCase())
                    )
                    .map((i) => (
                      <div
                        key={i.id}
                        style={{ padding: 6, cursor: "pointer" }}
                        onClick={() => {
                          setForm((f) => ({ ...f, item_id: i.id }));
                          setItemSearch(i.item_name);
                          setDropdownOpen(false);
                        }}
                      >
                        {i.item_name}
                      </div>
                    ))}
                </div>
              )}

              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
              >
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>

              <input
                type="number"
                placeholder="Qty"
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: e.target.value }))
                }
              />

              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />

              <button onClick={saveTransaction}>
                {editingId ? "Update" : "Save"}
              </button>
            </div>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th>
                <th style={thtd}>Item</th>
                <th style={thtd}>Type</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Brand</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && emptyRow(5, "No data")}
              {transactions
                .slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE)
                .map((t) => (
                  <tr key={t.id}>
                    <td style={thtd}>{t.date}</td>
                    <td style={thtd}>{t.items?.item_name}</td>
                    <td style={thtd}>{t.type}</td>
                    <td style={thtd}>{t.quantity}</td>
                    <td style={thtd}>{t.brand}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}

      {/* REPORT TAB */}
      {activeTab === "report" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Month</th>
              <th style={thtd}>IN</th>
              <th style={thtd}>OUT</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(monthlyTotals).length === 0 && emptyRow(3, "No data")}
            {Object.entries(monthlyTotals).map(([m, v]) => (
              <tr key={m}>
                <td style={thtd}>{m}</td>
                <td style={thtd}>₱{v.IN.toFixed(2)}</td>
                <td style={thtd}>₱{v.OUT.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
