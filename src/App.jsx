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
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingId, setEditingId] = useState(null);
  const originalFormRef = useRef(null);

  const [searchStock, setSearchStock] = useState("");
  const [searchTx, setSearchTx] = useState("");
  const [searchDeleted, setSearchDeleted] = useState("");

  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    date: "",
    brand: "",
    unit: "",
    volume_pack: "",
  });

  const [confirm, setConfirm] = useState(null);

  // ADD NEW ITEM POPUP
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ item_name: "", brand: "", unit_price: "" });
  const openConfirm = (title, message, color, onConfirm) =>
    setConfirm({ title, message, color, onConfirm });
  const closeConfirm = () => setConfirm(null);

  const PAGE_SIZE = 5;
  const [txPage, setTxPage] = useState(1);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);

  const monthlyReport = transactions.reduce((acc, t) => {
    const m = t.date?.slice(0, 7);
    if (!m) return acc;
    acc[m] = acc[m] || { in: 0, out: 0 };
    acc[m][t.type === "IN" ? "in" : "out"] += t.quantity;
    return acc;
  }, {});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return (
    <div style={{ padding: 20 }}>
      <h1>Inventory System</h1>

      {/* TOP CONTROLS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveTab("transactions")}>Transactions</button>
        <button onClick={() => setActiveTab("deleted")}>Deleted</button>
        <button onClick={() => setActiveTab("monthly")}>Monthly</button>

        <button
          onClick={() => setShowAddItem(true)}
          style={{ background: "#2563eb", color: "#fff", padding: "6px 12px", borderRadius: 6 }}
        >
          + Add New Item
        </button>
      </div>

      {/* DASHBOARD */}
      {activeTab === "dashboard" && (
        <>
          <h2 style={{ textAlign: "center" }}>Stock Inventory</h2>
          <input placeholder="Search item..." value={searchStock} onChange={(e) => setSearchStock(e.target.value)} />

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 && emptyRow(3, "No items")}
              {filteredItems.map((i) => {
                const stock = transactions
                  .filter((t) => t.item_id === i.id)
                  .reduce((s, t) => s + (t.type === "IN" ? t.quantity : -t.quantity), 0);
                return (
                  <tr key={i.id}>
                    <td style={thtd}>{i.item_name}</td>
                    <td style={thtd}>{i.brand}</td>
                    <td style={thtd}>{stock}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {/* TRANSACTIONS */}
      {activeTab === "transactions" && (
        <>
          <h2 style={{ textAlign: "center" }}>Transaction History</h2>
          <input placeholder="Search transaction..." value={searchTx} onChange={(e) => setSearchTx(e.target.value)} />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th>
                <th style={thtd}>Item</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.length === 0 && emptyRow(4, "No transactions")}
              {filteredTx.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE).map((t) => (
                <tr key={t.id} style={editingId === t.id ? editingRowStyle : undefined}>
                  <td style={thtd}>{t.date}</td>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>
                    <button disabled={editingId !== null && editingId !== t.id}>Edit</button>
                    <button disabled={editingId !== null}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* DELETED */}
      {activeTab === "deleted" && (
        <>
          <h2 style={{ textAlign: "center" }}>Deleted History</h2>
          <input placeholder="Search deleted..." value={searchDeleted} onChange={(e) => setSearchDeleted(e.target.value)} />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeleted.length === 0 && emptyRow(3, "No deleted records")}
              {filteredDeleted.slice((deletedPage - 1) * PAGE_SIZE, deletedPage * PAGE_SIZE).map((t) => (
                <tr key={t.id}>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>
                    <button>Restore</button>
                    <button>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* MONTHLY */}
      {activeTab === "monthly" && (
        <>
          <h2 style={{ textAlign: "center" }}>Monthly Report</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Month</th>
                <th style={thtd}>Total IN</th>
                <th style={thtd}>Total OUT</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyReport).length === 0 && emptyRow(3, "No data")}
              {Object.entries(monthlyReport).slice((monthlyPage - 1) * PAGE_SIZE, monthlyPage * PAGE_SIZE).map(([m, v]) => (
                <tr key={m}>
                  <td style={thtd}>{m}</td>
                  <td style={thtd}>{v.in}</td>
                  <td style={thtd}>{v.out}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ADD ITEM MODAL */}
      {showAddItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#fff", padding: 20, borderRadius: 8, minWidth: 300 }}>
            <h3>Add New Item</h3>
            <input placeholder="Item name" value={newItem.item_name} onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })} />
            <input placeholder="Brand" value={newItem.brand} onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })} />
            <input type="number" placeholder="Unit price" value={newItem.unit_price} onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })} />
            <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddItem(false)}>Cancel</button>
              <button onClick={async () => {
                await supabase.from("items").insert(newItem);
                setShowAddItem(false);
                setNewItem({ item_name: "", brand: "", unit_price: "" });
                loadData();
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  }, []);

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

  if (!session) return <div style={{ padding: 20 }}>Please login</div>;

  const filteredItems = items.filter((i) =>
    i.item_name.toLowerCase().includes(searchStock.toLowerCase())
  );

  const filteredTx = transactions.filter((t) =>
    t.items?.item_name?.toLowerCase().includes(searchTx.toLowerCase())
  );

  const filteredDeleted = deletedTransactions.filter((t) =>
    t.items?.item_name?.toLowerCase().includes(searchDeleted.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Inventory System</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button
              onClick={() => setShowAddItem(true)}
              style={{ background: "#2563eb", color: "#fff", padding: "6px 12px", borderRadius: 6 }}
            >
              + Add New Item
            </button>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 && emptyRow(3, "No items")}
              {filteredItems.map((i) => {
                const stock = transactions
                  .filter((t) => t.item_id === i.id)
                  .reduce((s, t) => s + (t.type === "IN" ? t.quantity : -t.quantity), 0);
                return (
                  <tr key={i.id}>
                    <td style={thtd}>{i.item_name}</td>
                    <td style={thtd}>{i.brand}</td>
                    <td style={thtd}>{stock}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {/* TRANSACTIONS */}
      {activeTab === "transactions" && (
        <>
          <h2 style={{ textAlign: "center" }}>Transaction History</h2>
          <input placeholder="Search transaction..." value={searchTx} onChange={(e) => setSearchTx(e.target.value)} />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th>
                <th style={thtd}>Item</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.length === 0 && emptyRow(4, "No transactions")}
              {filteredTx.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE).map((t) => (
                <tr key={t.id} style={editingId === t.id ? editingRowStyle : undefined}>
                  <td style={thtd}>{t.date}</td>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>
                    <button disabled={editingId !== null && editingId !== t.id} onClick={() => openConfirm("Edit", "Edit this transaction?", "#f59e0b", () => {})}>Edit</button>
                    <button disabled={editingId !== null} onClick={() => openConfirm("Delete", "Delete this transaction?", "#dc2626", async () => { await supabase.from("inventory_transactions").update({ deleted: true }).eq("id", t.id); loadData(); })}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* DELETED */}
      {activeTab === "deleted" && (
        <>
          <h2 style={{ textAlign: "center" }}>Deleted History</h2>
          <input placeholder="Search deleted..." value={searchDeleted} onChange={(e) => setSearchDeleted(e.target.value)} />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeleted.length === 0 && emptyRow(3, "No deleted records")}
              {filteredDeleted.slice((deletedPage - 1) * PAGE_SIZE, deletedPage * PAGE_SIZE).map((t) => (
                <tr key={t.id}>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>
                    <button onClick={() => openConfirm("Restore", "Restore this record?", "#16a34a", async () => { await supabase.from("inventory_transactions").update({ deleted: false }).eq("id", t.id); loadData(); })}>Restore</button>
                    <button onClick={() => openConfirm("Permanent Delete", "This cannot be undone. Continue?", "#b91c1c", async () => { await supabase.from("inventory_transactions").delete().eq("id", t.id); loadData(); })}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* MONTHLY */}
      {activeTab === "monthly" && (
        <>
          <h2 style={{ textAlign: "center" }}>Monthly Report</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Month</th>
                <th style={thtd}>Total IN</th>
                <th style={thtd}>Total OUT</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyReport).length === 0 && emptyRow(3, "No data")}
              {Object.entries(monthlyReport).slice((monthlyPage - 1) * PAGE_SIZE, monthlyPage * PAGE_SIZE).map(([m, v]) => (
                <tr key={m}>
                  <td style={thtd}>{m}</td>
                  <td style={thtd}>{v.in}</td>
                  <td style={thtd}>{v.out}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
