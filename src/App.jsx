import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const editingRowStyle = { background: "#fff7ed" }; // highlight edited row

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

export default function App() {
  // ===== CONFIRM MODAL STATE =====
  const [confirm, setConfirm] = useState(null);
  const openConfirm = (message, onConfirm) => {
    setConfirm({ message, onConfirm });
  };
  const closeConfirm = () => setConfirm(null);
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [deletedSearch, setDeletedSearch] = useState("");

  // tabs
  const [activeTab, setActiveTab] = useState("transactions");


  // form
  const [showForm, setShowForm] = useState(false);
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

  // item search
  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

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

  // ================= SAVE =================
  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(k => String(originalFormRef.current[k] || "") !== String(form[k] || ""));
  }

  async function saveTransaction() {
    if (!form.item_id || !form.quantity) return alert("Complete the form");
    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return alert("Item not found");

    if (form.type === "OUT") {
      const stockItem = stockInventory.find(i => i.id === item.id);
      if (stockItem && Number(form.quantity) > stockItem.stock) {
        alert("Cannot OUT more than available stock");
        return;
      }
    }

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
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingId)
      : await supabase.from("inventory_transactions").insert(payload);

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", date: "", brand: "", unit: "", volume_pack: "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  // ================= ADD NEW ITEM (STOCK TAB) =================

  const [showAddItem, setShowAddItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [stockEditItem, setStockEditItem] = useState(null);

  const [newItem, setNewItem] = useState({
    item_name: "",
    brand: "",
    unit_price: "",
  });

  async function handleSaveItem() {
    if (!newItem.item_name || !newItem.unit_price) {
      alert("Item name and unit price are required");
      return;
    }

    if (isEditingItem && stockEditItem) {
      const { error } = await supabase
        .from("items")
        .update({
          item_name: newItem.item_name,
          brand: newItem.brand || null,
          unit_price: Number(newItem.unit_price),
        })
        .eq("id", stockEditItem.id);

      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from("items").insert({
        item_name: newItem.item_name,
        brand: newItem.brand || null,
        unit_price: Number(newItem.unit_price),
      });

      if (error) return alert(error.message);
    }

    setNewItem({ item_name: "", brand: "", unit_price: "" });
    setIsEditingItem(false);
    setStockEditItem(null);
    setShowAddItem(false);
    loadData();
  }

  // ================= STOCK INVENTORY =================
  const stockInventory = items.map(item => {
    const related = transactions.filter(t => t.item_id === item.id);
    const qtyIn = related.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
    const qtyOut = related.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);
    return {
      ...item,
      stock: qtyIn - qtyOut,
    };
  });

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
    const handler = e => searchRef.current && !searchRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        
            </div>
            (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} ref={searchRef}>
              <input
                placeholder="Search item"
                value={itemSearch}
                onChange={e => {
                  setItemSearch(e.target.value);
                  setDropdownOpen(true);
                }}
              />
              {dropdownOpen && itemSearch && (
                <div style={{ position: "absolute", background: "#fff", border: "1px solid #ccc", maxHeight: 150, overflow: "auto" }}>
                  {items.filter(i => i.item_name.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
                    <div key={i.id} style={{ padding: 6, cursor: "pointer" }} onClick={() => {
                      setForm(f => ({ ...f, item_id: i.id }));
                      setItemSearch(i.item_name);
                      setDropdownOpen(false);
                    }}>{i.item_name}</div>
                  ))}
                </div>
              )}
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
              <input type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              
            </div>
            (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input placeholder="Item name" value={newItem.item_name} onChange={e => setNewItem(n => ({ ...n, item_name: e.target.value }))} />
              <input placeholder="Brand" value={newItem.brand} onChange={e => setNewItem(n => ({ ...n, brand: e.target.value }))} />
              <input type="number" placeholder="Unit price" value={newItem.unit_price} onChange={e => setNewItem(n => ({ ...n, unit_price: e.target.value }))} />
              <button onClick={handleSaveItem}>{isEditingItem ? "Update Item" : "Add Item"}</button>
                        </div>
          )}
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Current Stock</th>
                <th style={thtd}>Unit Price</th>
                <th style={thtd}>Stock Value</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockInventory.length === 0 && emptyRow(6, "No stock data")}
              {stockInventory.map(i => (
                <tr key={i.id} style={i.stock <= 5 ? { background: "#fee2e2" } : undefined}>
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.brand}</td>
                  <td style={thtd}>{i.stock}</td>
                  <td style={thtd}>₱{Number(i.unit_price || 0).toFixed(2)}</td>
                  <td style={thtd}>₱{(i.stock * (i.unit_price || 0)).toFixed(2)}</td>
                  <td style={thtd}>
                    <button
                      style={{ marginRight: 6 }}
                      onClick={() => openConfirm("Edit this item?", () => {
                        setIsEditingItem(true);
                        setStockEditItem(i);
                        setNewItem({
                          item_name: i.item_name,
                          brand: i.brand || "",
                          unit_price: i.unit_price,
                        });
                        setShowAddItem(true);
                      })}
                    >✏️ Edit</button>
                    <button
                      onClick={() => openConfirm("Permanently delete this item? This cannot be undone.", async () => {
                        await supabase.from("items").delete().eq("id", i.id);
                        loadData();
                      })}
                    >🗑️ Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
