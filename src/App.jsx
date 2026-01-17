import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// SUPABASE CONFIG
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 10,
};

const thtd = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
};

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>
      {text}
    </td>
  </tr>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("staff");
  const [items, setItems] = useState([]); // item_name, brand, unit, 
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    date: "",
    brand: "",
    unit: "",
    
  });

  const selectedItem = items.find(i => i.id === Number(form.item_id)); // optional reference

  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // AUTH
  useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
    setRole(data.session?.user?.user_metadata?.role || "staff");
  });

  const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
    setSession(s);
    setRole(s?.user?.user_metadata?.role || "staff");
  });

  return () => listener.subscription.unsubscribe();
}, []);

  // LOAD DATA
  async function loadData() {
  const { data: itemsData } = await supabase
    .from("items")
    .select("id, item_name, brand, unit, , unit_price");

  const { data: tx } = await supabase
    .from("inventory_transactions")
    .select("*, items(item_name, brand, unit, )")
    .or("deleted.is.null,deleted.eq.false")
    .order("date", { ascending: false });

  const { data: deletedTx } = await supabase
    .from("inventory_transactions")
    .select("*, items(item_name)")
    .eq("deleted", true)
    .order("date", { ascending: false });

  setItems(itemsData || []);
  setTransactions(tx || []);
  setDeletedTransactions(deletedTx || []);
}

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  // ADD / UPDATE
  async function saveTransaction() {
    if (!form.item_id || !form.quantity) {
      alert("Complete the form");
      return;
    }

    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return;

    const payload = {
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: item.id,
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price,
      brand: form.brand,
      unit: form.unit,
      : form.,
    };

    if (editingId) {
      await supabase.from("inventory_transactions").update(payload).eq("id", editingId);
    } else {
      await supabase.from("inventory_transactions").insert(payload);
    }

    setForm({ item_id: "", type: "IN", quantity: "", date: "", brand: "", unit: "", : "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  // DELETE (SOFT)
  async function confirmDelete() {
    await supabase.from("inventory_transactions").update({ deleted: true }).eq("id", confirmDeleteId);
    setConfirmDeleteId(null);
    loadData();
  }

  async function recoverTransaction(id) {
    await supabase.from("inventory_transactions").update({ deleted: false }).eq("id", id);
    loadData();
  }

  function editTransaction(t) {
    setEditingId(t.id);
    setForm({ item_id: t.item_id, type: t.type, quantity: t.quantity, date: t.date, brand: t.brand || "", unit: t.unit || "", : t. || "" });
    setItemSearch(t.items?.item_name || "");
  }

  // STOCK SUMMARY
  const stockByItem = items.map(item => {
    const stock = transactions
      .filter(t => t.item_id === item.id)
      .reduce((s, t) => s + (t.type === "IN" ? t.quantity : -t.quantity), 0);

    return { ...item, stock, total: stock * item.unit_price };
  });

  // MONTHLY REPORT
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  const monthlyReport = items.map(item => {
    const monthlyTx = transactions.filter(t => t.item_id === item.id && t.date.startsWith(reportMonth));

    const totalIn = monthlyTx.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
    const totalOut = monthlyTx.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);

    return { ...item, totalIn, totalOut };
  });

  // CLOSE DROPDOWN
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

      <div style={{ marginTop: 10, padding: 8, border: "1px solid #ddd" }}>
        <div>
          <label>Brand</label><br />
          <input
            value={form.brand}
            onChange={e => setForm({ ...form, brand: e.target.value })}
            placeholder="Enter brand"
          />
        </div>
        <div>
          <label>Unit</label><br />
          <input
            value={form.unit}
            onChange={e => setForm({ ...form, unit: e.target.value })}
            placeholder="Enter unit (pcs, box, kg…)"
          />
        </div>
        <div>
          <label>Volume / Pack</label><br />
          <input
            value={form.}
            onChange={e => setForm({ ...form, : e.target.value })}
            placeholder="e.g. 500ml, 12 pcs"
          />
        </div>
      </div>

      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
        <option value="IN">IN</option>
        <option value="OUT">OUT</option>
      </select>

      <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />

      <button onClick={saveTransaction}>{editingId ? "Update" : "Save"}</button>

      <h2>Transactions</h2>

      <table style={tableStyle}>
        <thead>
          <tr><th style={thtd}>Date</th><th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Unit</th><th style={thtd}>Volume/Pack</th><th style={thtd}>Type</th><th style={thtd}>Qty</th><th style={thtd}>Action</th></tr>
        </thead>
        <tbody>
          {transactions.length === 0 && emptyRow(8, "No transactions yet")}
          {transactions.map(t => (
            <tr key={t.id}>
              <td style={thtd}>{t.date}</td>
              <td style={thtd}>{t.items?.item_name}</td><td style={thtd}>{t.brand || "-"}</td><td style={thtd}>{t.unit || "-"}</td><td style={thtd}>{t. || "-"}</td>
              <td style={thtd}>{t.type}</td>
              <td style={thtd}>{t.quantity}</td>
              <td style={thtd}>
                <button onClick={() => editTransaction(t)}>Edit</button>{" "}
                <button onClick={() => setConfirmDeleteId(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmDeleteId && (
        <div style={{ background: "#00000088", position: "fixed", inset: 0 }}>
          <div style={{ background: "#fff", margin: "20% auto", padding: 20, width: 300 }}>
            <p>Confirm delete?</p>
            <button onClick={confirmDelete}>Yes</button>{" "}
            <button onClick={() => setConfirmDeleteId(null)}>Cancel</button>
          </div>
        </div>
      )}

      <h2>Stock Summary</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Item</th>
            <th style={thtd}>Stock</th>
            <th style={thtd}>Total Value</th>
          </tr>
        </thead>
        <tbody>
          {stockByItem.length === 0 && emptyRow(3, "No stock data")}
          {stockByItem.map(i => (
            <tr key={i.id}>
              <td style={thtd}>{i.item_name}</td>
              <td style={thtd}>{i.stock}</td>
              <td style={thtd}>{i.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Monthly Report</h2>
      <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />

      <table style={tableStyle}>
        <thead><tr><th style={thtd}>Item</th><th style={thtd}>Total IN</th><th style={thtd}>Total OUT</th></tr></thead>
        <tbody>
          {monthlyReport.length === 0 && emptyRow(3, "No report data")}
          {monthlyReport.map(r => (
            <tr key={r.id}><td style={thtd}>{r.item_name}</td><td style={thtd}>{r.totalIn}</td><td style={thtd}>{r.totalOut}</td></tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => setShowDeleted(!showDeleted)}>
        {showDeleted ? "Hide Deleted" : "View Deleted"}
      </button>

      {showDeleted && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Date</th>
              <th style={thtd}>Item</th>
              <th style={thtd}>Action</th>
            </tr>
          </thead>
          <tbody>
            {deletedTransactions.map(t => (
              <tr key={t.id}>
                <td style={thtd}>{t.date}</td>
                <td style={thtd}>{t.items?.item_name}</td>
                <td style={thtd}>
                  <button onClick={() => recoverTransaction(t.id)}>Recover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
