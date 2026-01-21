import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #2a2a2a", padding: 10, textAlign: "left" };

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalCard = {
  background: "#0f172a",
  color: "#e5e7eb",
  padding: 24,
  borderRadius: 8,
  width: 420,
  boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
};

const modalBtn = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
};

const primaryBtn = {
  ...modalBtn,
  background: "#2563eb",
  color: "#fff",
};

const secondaryBtn = {
  ...modalBtn,
  background: "#334155",
  color: "#fff",
};

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [activeTab, setActiveTab] = useState("transactions");

  // ===== MODALS =====
  const [showTxModal, setShowTxModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // ===== FORMS =====
  const [txForm, setTxForm] = useState({ item_id: "", type: "IN", quantity: "", date: "" });
  const [itemForm, setItemForm] = useState({ item_name: "", brand: "", unit_price: "" });

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("*");
    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("deleted", false)
      .order("date", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  // ================= SAVE TRANSACTION =================
  async function saveTransaction() {
    const payload = {
      ...txForm,
      item_id: Number(txForm.item_id),
      quantity: Number(txForm.quantity),
      date: txForm.date || new Date().toISOString().slice(0, 10),
      unit_price: items.find(i => i.id === Number(txForm.item_id))?.unit_price || 0,
      deleted: false,
    };

    if (editingTx) {
      await supabase.from("inventory_transactions").update(payload).eq("id", editingTx.id);
    } else {
      await supabase.from("inventory_transactions").insert(payload);
    }

    setShowTxModal(false);
    setEditingTx(null);
    setTxForm({ item_id: "", type: "IN", quantity: "", date: "" });
    loadData();
  }

  // ================= SAVE ITEM =================
  async function saveItem() {
    await supabase.from("items").insert({
      item_name: itemForm.item_name,
      brand: itemForm.brand || null,
      unit_price: Number(itemForm.unit_price),
    });

    setShowItemModal(false);
    setItemForm({ item_name: "", brand: "", unit_price: "" });
    loadData();
  }

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>Login with Google</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ textAlign: "center" }}>Lago De Oro Inventory</h1>

      {/* ACTION BAR */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button style={primaryBtn} onClick={() => setShowTxModal(true)}>➕ Add Transaction</button>
        {activeTab === "stock" && (
          <button style={secondaryBtn} onClick={() => setShowItemModal(true)}>➕ Add Item</button>
        )}
      </div>

      {/* TRANSACTIONS */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Date</th>
            <th style={thtd}>Item</th>
            <th style={thtd}>Type</th>
            <th style={thtd}>Qty</th>
            <th style={thtd}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id}>
              <td style={thtd}>{t.date}</td>
              <td style={thtd}>{t.items?.item_name}</td>
              <td style={thtd}>{t.type}</td>
              <td style={thtd}>{t.quantity}</td>
              <td style={thtd}>
                <button
                  style={secondaryBtn}
                  onClick={() => {
                    setEditingTx(t);
                    setTxForm({ item_id: t.item_id, type: t.type, quantity: t.quantity, date: t.date });
                    setShowTxModal(true);
                  }}
                >
                  ✏️ Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TRANSACTION MODAL */}
      {showTxModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3>{editingTx ? "Edit Transaction" : "Add Transaction"}</h3>

            <select value={txForm.item_id} onChange={e => setTxForm(f => ({ ...f, item_id: e.target.value }))}>
              <option value="">Select item</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
            </select>

            <select value={txForm.type} onChange={e => setTxForm(f => ({ ...f, type: e.target.value }))}>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>

            <input type="number" placeholder="Quantity" value={txForm.quantity} onChange={e => setTxForm(f => ({ ...f, quantity: e.target.value }))} />
            <input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button style={secondaryBtn} onClick={() => { setShowTxModal(false); setEditingTx(null); }}>Cancel</button>
              <button style={primaryBtn} onClick={saveTransaction}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      {showItemModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3>Add Item</h3>
            <input placeholder="Item name" value={itemForm.item_name} onChange={e => setItemForm(f => ({ ...f, item_name: e.target.value }))} />
            <input placeholder="Brand" value={itemForm.brand} onChange={e => setItemForm(f => ({ ...f, brand: e.target.value }))} />
            <input type="number" placeholder="Unit price" value={itemForm.unit_price} onChange={e => setItemForm(f => ({ ...f, unit_price: e.target.value }))} />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button style={secondaryBtn} onClick={() => setShowItemModal(false)}>Cancel</button>
              <button style={primaryBtn} onClick={saveItem}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
