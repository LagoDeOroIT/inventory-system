import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x"; 
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [items, setItems] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [selectedRoom, setSelectedRoom] = useState("Main Stock");
  const [activeTab, setActiveTab] = useState("items");

  const [form, setForm] = useState({
    item_name: "",
    category: "",
    quantity: "",
    unit: ""
  });

  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // ================= FETCH =================

  const fetchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("stock_room", selectedRoom)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    setItems(data || []);
  };

  const fetchDeletedItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("stock_room", selectedRoom)
      .eq("deleted", true)
      .order("deleted_at", { ascending: false });

    setDeletedItems(data || []);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("stock_room", selectedRoom)
      .order("created_at", { ascending: false });

    setTransactions(data || []);
  };

  useEffect(() => {
    fetchItems();
    fetchDeletedItems();
    fetchTransactions();
  }, [selectedRoom]);

  // ================= ADD ITEM =================

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.quantity) return;

    await supabase.from("items").insert([{
      item_name: form.item_name,
      category: form.category,
      quantity: Number(form.quantity),
      unit: form.unit,
      stock_room: selectedRoom,
      deleted: false
    }]);

    setForm({ item_name: "", category: "", quantity: "", unit: "" });
    fetchItems();
  };

  // ================= EDIT =================

  const handleEditItem = (item) => {
    setEditingItem(item);
    setForm(item);
    setShowEditModal(true);
  };

  const submitEdit = async () => {
    await supabase.from("items")
      .update({
        item_name: form.item_name,
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit
      })
      .eq("id", editingItem.id);

    setShowEditModal(false);
    setEditingItem(null);
    fetchItems();
  };

  // ================= SOFT DELETE =================

  const softDeleteItem = (item) => {
    setConfirmAction(() => async () => {
      await supabase.from("items")
        .update({
          deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq("id", item.id);

      setShowConfirm(false);
      fetchItems();
      fetchDeletedItems();
    });

    setShowConfirm(true);
  };

  // ================= RESTORE =================

  const restoreItem = (id) => {
    setConfirmAction(() => async () => {
      await supabase.from("items")
        .update({
          deleted: false,
          deleted_at: null
        })
        .eq("id", id);

      setShowConfirm(false);
      fetchItems();
      fetchDeletedItems();
    });

    setShowConfirm(true);
  };

  // ================= PERMANENT DELETE =================

  const permanentDelete = (id) => {
    setConfirmAction(() => async () => {
      await supabase.from("items").delete().eq("id", id);
      setShowConfirm(false);
      fetchDeletedItems();
    });

    setShowConfirm(true);
  };

  // ================= TRANSACTIONS =================

  const addTransaction = async (item, qty, type) => {
    const newQty = type === "IN"
      ? item.quantity + qty
      : item.quantity - qty;

    await supabase.from("transactions").insert([{
      item_id: item.id,
      item_name: item.item_name,
      quantity: qty,
      type,
      stock_room: selectedRoom
    }]);

    await supabase.from("items")
      .update({ quantity: newQty })
      .eq("id", item.id);

    fetchItems();
    fetchTransactions();
  };

  return (
    <div className="container">
      <h1>Inventory Management System</h1>

      <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
        <option>Main Stock</option>
        <option>Office Stock</option>
        <option>Warehouse</option>
      </select>

      <div className="tabs">
        <button onClick={() => setActiveTab("items")}>Items</button>
        <button onClick={() => setActiveTab("transactions")}>Transactions</button>
        <button onClick={() => setActiveTab("deleted")}>Recycle Bin</button>
      </div>

      {/* ADD FORM */}
      <form onSubmit={addItem} className="form">
        <input placeholder="Item Name" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} />
        <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        <input type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
        <input placeholder="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
        <button>Add</button>
      </form>

      {/* ITEMS */}
      {activeTab === "items" && (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.item_name}</td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>
                  <button onClick={() => handleEditItem(item)}>Edit</button>
                  <button onClick={() => softDeleteItem(item)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* TRANSACTIONS */}
      {activeTab === "transactions" && (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Type</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{tx.item_name}</td>
                <td>{tx.quantity}</td>
                <td>{tx.type}</td>
                <td>{new Date(tx.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* RECYCLE BIN */}
      {activeTab === "deleted" && (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Deleted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deletedItems.map(item => (
              <tr key={item.id}>
                <td>{item.item_name}</td>
                <td>{item.quantity}</td>
                <td>{new Date(item.deleted_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => restoreItem(item.id)}>Restore</button>
                  <button onClick={() => permanentDelete(item.id)}>Delete Permanently</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal">
          <div className="modal-box">
            <h3>Edit Item</h3>
            <input value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} />
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />

            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
              <button onClick={submitEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="modal">
          <div className="modal-box">
            <h3>Confirm Action</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirm(false)}>Cancel</button>
              <button onClick={confirmAction}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
