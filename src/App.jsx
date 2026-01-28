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
  const [inSearch, setInSearch] = useState("");
  const [inFilter, setInFilter] = useState("all");
  const [outSearch, setOutSearch] = useState("");
  const [outFilter, setOutFilter] = useState("all");

  // reset search when filter changes
  useEffect(() => {
    setInSearch("");
  }, [inFilter]);

  useEffect(() => {
    setOutSearch("");
  }, [outFilter]);

  // tabs
  const [activeTab, setActiveTab] = useState("stock");

  // ===== STOCK ROOMS =====
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

  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");


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

  const filteredItemsForSearch = items.filter(i => {
    if (selectedStockRoom === "All Stock Rooms") return false;
    return (
      i.location === selectedStockRoom &&
      i.item_name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  });

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
      .select("id, item_name, unit_price, brand, location");

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

    // NOTE: stock room filtering is applied at render level
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
    if (!form.quantity) return alert("Complete the form");

    let item = items.find(i => i.id === Number(form.item_id));

    // CREATE NEW ITEM IF NOT FOUND (TRANSACTIONS IS SOURCE OF TRUTH)
    if (!item && itemSearch) {
      if (selectedStockRoom === "All Stock Rooms") {
        alert("Select a stock room to create a new item");
        return;
      }
      const { data: newItemData, error: itemErr } = await supabase
        .from("items")
        .insert([{ item_name: itemSearch, location: selectedStockRoom }])
        .select()
        .single();

      if (itemErr) return alert(itemErr.message);
      item = newItemData;
    }

    if (!item) return alert("Item not found");

    if (form.type === "OUT") {
      const stockItem = stockInventory.find(i => i.id === item.id);
      if (stockItem && Number(form.quantity) > stockItem.stock) {
        alert("Cannot OUT more than available stock");
        return;
      }
    }

    const payload = {
      location: selectedStockRoom === "All Stock Rooms" ? null : selectedStockRoom,
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: Number(item.id),
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price || 0,
      brand: form.brand || item.brand || null,
      unit: form.unit || null,
      volume_pack: form.volume_pack || null,
      deleted: false,
    };

    const { error } = editingId
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingId)
      : await supabase.from("inventory_transactions").insert([payload]);

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", date: "", brand: "", unit: "", volume_pack: "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  // ================= STOCK INVENTORY =================
  const stockInventory = items
  .filter(i => selectedStockRoom === "All Stock Rooms" || i.location === selectedStockRoom)
  .map(i => {
    const related = transactions.filter(t => t.item_id === i.id);
    const stock = related.reduce((sum, t) => sum + (t.type === "IN" ? t.quantity : -t.quantity), 0);
    return { ...i, stock };
  });

  // ================= ADD NEW ITEM (STOCK TAB) =================

  const [showAddItem, setShowAddItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [stockEditItem, setStockEditItem] = useState(null);

  const [newItem, setNewItem] = useState({
  item_name: "",
  brand: "",
  unit_price: "",
  
  location: selectedStockRoom !== "All Stock Rooms" ? selectedStockRoom : "",
});

  const handleSaveItem = async () => {
  if (!selectedStockRoom || selectedStockRoom === "All Stock Rooms") {
    alert("Please select a stock room first");
    return;
  }

  const payload = {
    item_name: newItem.item_name,
    brand: newItem.brand,
    unit_price: Number(newItem.unit_price) || 0,
    location: selectedStockRoom,
  };

  const { error } = isEditingItem && editingItemId
    ? await supabase.from("items").update(payload).eq("id", editingItemId)
    : await supabase.from("items").insert([payload]);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  setNewItem({ item_name: "", brand: "", unit_price: "", location: selectedStockRoom });
  setIsEditingItem(false);
  setStockEditItem(null);
  setShowAddItem(false);
  loadData();
};

  // ================= FILTERED TRANSACTIONS =================
  const filteredTransactions = transactions.filter(t => {
    if (selectedStockRoom === "All Stock Rooms") return true;
    return t.location === selectedStockRoom;
  });

  // ================= MONTHLY TOTALS =================
  const monthlyTotals = filteredTransactions.reduce((acc, t) => {
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
    return <div>Please log in.</div>;
  }

        <button
          onClick={() => setShowAddItem(v => !v)}
          style={{
            background: "#1f2937",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
        

                {showAddItem ? "Hide" : "Show"}
              </button>
            </div>
            {showAddItem && (
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
                    <th style={thtd}>Volume Pack</th>
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
<td style={thtd}>{i.brand || "—"}</td>
<td style={thtd}>{i.stock}</td>
<td style={thtd}>₱{Number(i.unit_price || 0).toFixed(2)}</td>
<td style={thtd}>₱{(i.stock * (i.unit_price || 0)).toFixed(2)}</td>
<td style={thtd}>
  <button
    style={{ marginRight: 6 }}
    onClick={() => openConfirm("Edit this item?", () => {
      setIsEditingItem(true);
      setStockEditItem(i);
      setEditingItemId(i.id);
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
