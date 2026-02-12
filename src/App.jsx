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
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

export default function App() {
  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    unit_price: "",
    date: "",
    brand: "",
    unit: "",
    volume_pack: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  const stockRooms = [
    "All Stock Rooms",
    "L1",
    "L2 Room 1",
    "L2 Room 2",
    "L2 Room 3",
    "L2 Room 4",
    "L3",
    "L5",
    "L6",
    "L7",
    "Maintenance Bodega 1",
    "Maintenance Bodega 2",
    "Maintenance Bodega 3",
    "SKI Stock Room",
    "Quarry Stock Room",
  ];

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, item_name, unit_price, brand, category, location");

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
    setShowForm(false);
  }, [session]);

  // ================= FORM HANDLERS =================
  const stockInventory = items
    .filter(i => selectedStockRoom === "All Stock Rooms" || i.location === selectedStockRoom)
    .map(i => {
      const related = transactions.filter(t => t.item_id === i.id);
      const stock = related.reduce(
        (sum, t) => sum + (t.type === "IN" ? Number(t.quantity) : -Number(t.quantity)),
        0
      );
      const latestTx = related.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      return {
        id: i.id,
        item_name: i.item_name,
        brand: latestTx?.brand || i.brand || "—",
        volume_pack: latestTx?.volume_pack || "—",
        unit_price: Number(latestTx?.unit_price ?? i.unit_price ?? 0),
        stock,
        location: i.location,
      };
    });

  const filteredItemsForSearch = items.filter(i => {
    if (selectedStockRoom === "All Stock Rooms") return i.item_name.toLowerCase().includes(itemSearch.toLowerCase());
    return i.location === selectedStockRoom && i.item_name.toLowerCase().includes(itemSearch.toLowerCase());
  });

  async function saveTransaction() {
    if (!form.quantity || !form.item_id) return alert("Complete the form");

    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return alert("Item not found");

    const payload = {
      location: selectedStockRoom === "All Stock Rooms" ? null : selectedStockRoom,
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: Number(form.item_id),
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price) || item.unit_price || 0,
      brand: form.brand || item.brand || null,
      unit: form.unit || null,
      volume_pack: form.volume_pack || null,
      deleted: false,
    };

    const { error } = editingId
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingId)
      : await supabase.from("inventory_transactions").insert([payload]);

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", unit_price: "", date: "", brand: "", unit: "", volume_pack: "" });
    setItemSearch("");
    setEditingId(null);
    setShowForm(false);
    loadData();
  }

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handler = e => searchRef.current && !searchRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ================= MONTHLY REPORT =================
  const monthlyReport = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleString("default", { month: "short", year: "numeric" });
    if (!acc[month]) acc[month] = { IN: 0, OUT: 0 };
    acc[month][t.type] += Number(t.quantity);
    return acc;
  }, {});

  // ================= RENDER =================
  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>Login with Google</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Inventory Management</h2>
      <div style={{ marginBottom: 20 }}>
        {["stock", "transactions", "deleted", "report"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              marginRight: 8,
              padding: "6px 12px",
              background: activeTab === tab ? "#007bff" : "#ccc",
              color: activeTab === tab ? "#fff" : "#000",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ================= STOCK TABLE ================= */}
      {activeTab === "stock" && (
        <div>
          <div style={{ marginBottom: 10 }}>
            <label>
              Stock Room:
              <select
                value={selectedStockRoom}
                onChange={e => setSelectedStockRoom(e.target.value)}
                style={{ marginLeft: 8 }}
              >
                {stockRooms.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label style={{ marginLeft: 20 }}>
              Search:
              <input
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Volume/Pack</th>
                <th style={thtd}>Unit Price</th>
                <th style={thtd}>Stock</th>
                <th style={thtd}>Location</th>
              </tr>
            </thead>
            <tbody>
              {stockInventory.length === 0 && emptyRow(6, "No items found")}
              {stockInventory.map(i => (
                <tr key={i.id}>
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.brand}</td>
                  <td style={thtd}>{i.volume_pack}</td>
                  <td style={thtd}>{i.unit_price}</td>
                  <td style={thtd}>{i.stock}</td>
                  <td style={thtd}>{i.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= TRANSACTIONS ================= */}
      {activeTab === "transactions" && (
        <div>
          <button onClick={() => setShowForm(true)} style={{ marginBottom: 10 }}>Add Transaction</button>
          {showForm && (
            <div style={{ marginBottom: 10, padding: 10, border: "1px solid #ccc", position: "relative" }}>
              <div ref={searchRef}>
                <label>
                  Item:
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={e => { setItemSearch(e.target.value); setDropdownOpen(true); }}
                    style={{ marginLeft: 8 }}
                  />
                </label>
                {dropdownOpen && filteredItemsForSearch.length > 0 && (
                  <ul style={{
                    border: "1px solid #ccc",
                    position: "absolute",
                    background: "#fff",
                    zIndex: 10,
                    maxHeight: 150,
                    overflowY: "auto",
                    width: 200,
                    padding: 0,
                    margin: 0,
                    listStyle: "none",
                  }}>
                    {filteredItemsForSearch.map(i => (
                      <li
                        key={i.id}
                        onClick={() => { setForm({ ...form, item_id: i.id, unit_price: i.unit_price, brand: i.brand }); setItemSearch(i.item_name); setDropdownOpen(false); }}
                        style={{ padding: "5px 8px", cursor: "pointer" }}
                      >
                        {i.item_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <label style={{ marginLeft: 10 }}>
                Type:
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ marginLeft: 8 }}
                >
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                </select>
              </label>
              <label style={{ marginLeft: 10 }}>
                Quantity:
                <input
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  style={{ marginLeft: 8 }}
                />
              </label>
              <label style={{ marginLeft: 10 }}>
                Unit Price:
                <input
                  value={form.unit_price}
                  onChange={e => setForm({ ...form, unit_price: e.target.value })}
                  style={{ marginLeft: 8 }}
                />
              </label>
              <button onClick={saveTransaction} style={{ marginLeft: 10 }}>Save</button>
              <button onClick={() => setShowForm(false)} style={{ marginLeft: 5 }}>Cancel</button>
            </div>
          )}
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th>
                <th style={thtd}>Item</th>
                <th style={thtd}>Type</th>
                <th style={thtd}>Quantity</th>
                <th style={thtd}>Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && emptyRow(5, "No transactions")}
              {transactions.map(t => (
                <tr key={t.id}>
                  <td style={thtd}>{t.date}</td>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.type}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>{t.unit_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= DELETED ================= */}
      {activeTab === "deleted" && (
        <div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Deleted At</th>
                <th style={thtd}>Item</th>
                <th style={thtd}>Type</th>
                <th style={thtd}>Quantity</th>
                <th style={thtd}>Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {deletedTransactions.length === 0 && emptyRow(5, "No deleted transactions")}
              {deletedTransactions.map(t => (
                <tr key={t.id}>
                  <td style={thtd}>{t.deleted_at}</td>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.type}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>{t.unit_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MONTHLY REPORT ================= */}
      {activeTab === "report" && (
        <div>
          <h3>Monthly Report</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Month</th>
                <th style={thtd}>Total IN</th>
                <th style={thtd}>Total OUT</th>
                <th style={thtd}>Net Stock</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyReport).length === 0 && emptyRow(4, "No data")}
              {Object.entries(monthlyReport).map(([month, data]) => (
                <tr key={month}>
                  <td style={thtd}>{month}</td>
                  <td style={thtd}>{data.IN}</td>
                  <td style={thtd}>{data.OUT}</td>
                  <td style={thtd}>{data.IN - data.OUT}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
