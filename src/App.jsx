import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= CONFIRM MODAL =================
function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <p>{message}</p>
        <div style={styles.actions}>
          <button onClick={onConfirm}>Confirm</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ================= MAIN APP =================
export default function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [confirm, setConfirm] = useState(null);

  // ================= LOAD ITEMS =================
  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("id", { ascending: false });

    if (!error) setItems(data || []);
  }

  // ================= ADD ITEM =================
  async function addItem() {
    if (!name || !qty) return alert("Fill all fields");

    await supabase.from("items").insert([
      { name, stock: Number(qty), deleted: false },
    ]);

    setName("");
    setQty("");
    fetchItems();
  }

  // ================= DELETE =================
  function confirmDelete(id) {
    setConfirm({
      message: "Are you sure you want to delete this item?",
      action: async () => {
        await supabase.from("items").update({ deleted: true }).eq("id", id);
        setConfirm(null);
        fetchItems();
      },
    });
  }

  // ================= RESTORE =================
  function confirmRestore(id) {
    setConfirm({
      message: "Restore this item?",
      action: async () => {
        await supabase.from("items").update({ deleted: false }).eq("id", id);
        setConfirm(null);
        fetchItems();
      },
    });
  }

  // ================= DELETE PERMANENT =================
  function confirmPermanentDelete(id) {
    setConfirm({
      message: "Delete permanently? This cannot be undone.",
      action: async () => {
        await supabase.from("items").delete().eq("id", id);
        setConfirm(null);
        fetchItems();
      },
    });
  }

  const activeItems = items.filter(i => !i.deleted);
  const deletedItems = items.filter(i => i.deleted);
  const lowStockCount = activeItems.filter(i => i.stock <= 5).length;

  return (
    <div style={{ padding: 20 }}>
      <h2>Stock Inventory Dashboard</h2>

      {/* DASHBOARD CARD */}
      <div style={styles.card}>
        <p>Low Stock (≤5)</p>
        <h1>{lowStockCount}</h1>
      </div>

      {/* ADD ITEM */}
      <h3>Add New Item</h3>
      <input
        placeholder="Item name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        placeholder="Qty"
        type="number"
        value={qty}
        onChange={e => setQty(e.target.value)}
      />
      <button onClick={addItem}>Add</button>

      {/* ACTIVE ITEMS */}
      <h3>Items</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Name</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {activeItems.map(i => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td>{i.stock}</td>
              <td>
                <button onClick={() => confirmDelete(i.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DELETED ITEMS */}
      <h3>Deleted Items</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {deletedItems.map(i => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td>
                <button onClick={() => confirmRestore(i.id)}>Restore</button>
                <button onClick={() => confirmPermanentDelete(i.id)}>
                  Delete Permanently
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CONFIRM MODAL */}
      <ConfirmModal
        open={!!confirm}
        message={confirm?.message}
        onConfirm={confirm?.action}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

// ================= STYLES =================
const styles = {
  card: {
    border: "1px solid #ccc",
    padding: 20,
    width: 200,
    marginBottom: 20,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "#fff",
    padding: 20,
    minWidth: 300,
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 20,
  },
};
