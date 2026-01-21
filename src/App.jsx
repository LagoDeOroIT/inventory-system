import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ================= SUPABASE ================= */
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

/* ================= STYLES ================= */
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const cardStyle = { border: "1px solid #ddd", padding: 12, borderRadius: 6 };
const PAGE_SIZE = 5;

export default function App() {
  /* ================= AUTH ================= */
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => data.subscription.unsubscribe();
  }, []);

  /* ================= STATE ================= */
  const [activeTab, setActiveTab] = useState("dashboard");

  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  const [txPage, setTxPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);

  /* ================= CONFIRM MODAL ================= */
  const [confirm, setConfirm] = useState(null);
  const openConfirm = (message, onConfirm) =>
    setConfirm({ message, onConfirm });
  const closeConfirm = () => setConfirm(null);

  /* ================= FORMS ================= */
  const [newItem, setNewItem] = useState({
    item_name: "",
    brand: "",
    unit_price: "",
  });

  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    date: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  /* ================= LOAD DATA ================= */
  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("*")
      .order("item_name");

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

  /* ================= ADD ITEM ================= */
  async function addItem() {
    if (!newItem.item_name || !newItem.unit_price)
      return alert("Item name and price required");

    await supabase.from("items").insert({
      item_name: newItem.item_name,
      brand: newItem.brand || null,
      unit_price: Number(newItem.unit_price),
    });

    setNewItem({ item_name: "", brand: "", unit_price: "" });
    loadData();
  }

  /* ================= SAVE TRANSACTION ================= */
  async function saveTransaction() {
    if (!form.item_id || !form.quantity)
      return alert("Complete the form");

    const item = items.find((i) => i.id === Number(form.item_id));
    if (!item) return;

    const payload = {
      item_id: Number(form.item_id),
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price,
      date: form.date || new Date().toISOString().slice(0, 10),
      deleted: false,
    };

    if (editingId) {
      await supabase
        .from("inventory_transactions")
        .update(payload)
        .eq("id", editingId);
    } else {
      await supabase.from("inventory_transactions").insert(payload);
    }

    setForm({ item_id: "", type: "IN", quantity: "", date: "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  /* ================= STOCK ================= */
  const stockByItem = items.map((item) => {
    const txs = transactions.filter((t) => t.item_id === item.id);
    const stock = txs.reduce(
      (s, t) => s + (t.type === "IN" ? t.quantity : -t.quantity),
      0
    );
    return { ...item, stock };
  });

  /* ================= LOGIN ================= */
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

  return (
    <div style={{ padding: 20 }}>
      <h1>Inventory System</h1>

      {/* ================= TABS ================= */}
      <div style={{ display: "flex", gap: 8 }}>
        {["dashboard", "transactions", "deleted", "report"].map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ================= DASHBOARD ================= */}
      {activeTab === "dashboard" && (
        <>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <div style={cardStyle}>
              <p>Low Stock (≤5)</p>
              <h2>{stockByItem.filter((i) => i.stock <= 5).length}</h2>
            </div>
          </div>

          <h3>Add New Item</h3>
          <input
            placeholder="Item name"
            value={newItem.item_name}
            onChange={(e) =>
              setNewItem({ ...newItem, item_name: e.target.value })
            }
          />
          <input
            placeholder="Brand"
            value={newItem.brand}
            onChange={(e) =>
              setNewItem({ ...newItem, brand: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.unit_price}
            onChange={(e) =>
              setNewItem({ ...newItem, unit_price: e.target.value })
            }
          />
          <button onClick={addItem}>Add</button>
        </>
      )}

      {/* ================= TRANSACTIONS ================= */}
      {activeTab === "transactions" && (
        <>
          <h3>Add / Edit Transaction</h3>

          <input
            placeholder="Item ID"
            value={form.item_id}
            onChange={(e) =>
              setForm({ ...form, item_id: e.target.value })
            }
          />

          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value })
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
              setForm({ ...form, quantity: e.target.value })
            }
          />

          <button onClick={saveTransaction}>
            {editingId ? "Update" : "Save"}
          </button>

          {/* TABLE */}
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
              {transactions
                .slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE)
                .map((t) => (
                  <tr key={t.id}>
                    <td style={thtd}>{t.date}</td>
                    <td style={thtd}>{t.items?.item_name}</td>
                    <td style={thtd}>{t.type}</td>
                    <td style={thtd}>{t.quantity}</td>
                    <td style={thtd}>
                      <button
                        onClick={() =>
                          openConfirm("Edit this transaction?", () => {
                            setForm({
                              item_id: t.item_id,
                              type: t.type,
                              quantity: t.quantity,
                              date: t.date,
                            });
                            setEditingId(t.id);
                          })
                        }
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          openConfirm("Delete this transaction?", async () => {
                            await supabase
                              .from("inventory_transactions")
                              .update({ deleted: true })
                              .eq("id", t.id);
                            loadData();
                          })
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}

      {/* ================= DELETED ================= */}
      {activeTab === "deleted" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Item</th>
              <th style={thtd}>Qty</th>
              <th style={thtd}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deletedTransactions.map((t) => (
              <tr key={t.id}>
                <td style={thtd}>{t.items?.item_name}</td>
                <td style={thtd}>{t.quantity}</td>
                <td style={thtd}>
                  <button
                    onClick={() =>
                      openConfirm("Restore this record?", async () => {
                        await supabase
                          .from("inventory_transactions")
                          .update({ deleted: false })
                          .eq("id", t.id);
                        loadData();
                      })
                    }
                  >
                    Restore
                  </button>
                  <button
                    onClick={() =>
                      openConfirm(
                        "Delete permanently?",
                        async () => {
                          await supabase
                            .from("inventory_transactions")
                            .delete()
                            .eq("id", t.id);
                          loadData();
                        }
                      )
                    }
                  >
                    Delete Permanently
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= CONFIRM MODAL ================= */}
      {confirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 6,
              width: 320,
            }}
          >
            <p>{confirm.message}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{ flex: 1 }}
                onClick={() => {
                  confirm.onConfirm();
                  closeConfirm();
                }}
              >
                Confirm
              </button>
              <button style={{ flex: 1 }} onClick={closeConfirm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
