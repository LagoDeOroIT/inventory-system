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
  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [deletedSearch, setDeletedSearch] = useState("");
  const [inSearch, setInSearch] = useState("");
  const [inFilter, setInFilter] = useState("all");
  const [outSearch, setOutSearch] = useState("");
  const [outFilter, setOutFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("stock");

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newItem, setNewItem] = useState({ item_name: "", brand: "", unit_price: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
  const originalFormRef = useRef(null);

  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  const [confirm, setConfirm] = useState(null);
  const openConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });
  const closeConfirm = () => setConfirm(null);

  const stockRooms = [
    "All Stock Rooms", "L1", "L2 Room 1", "L2 Room 2", "L2 Room 3", "L2 Room 4",
    "L3", "L5", "L6", "L7", "Maintenance Bodega 1", "Maintenance Bodega 2",
    "Maintenance Bodega 3", "SKI Stock Room", "Quarry Stock Room",
  ];
  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");

  // ================= EFFECTS =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => { setInSearch(""); }, [inFilter]);
  useEffect(() => { setOutSearch(""); }, [outFilter]);

  useEffect(() => {
    if (session) loadData();
    setShowForm(false);
  }, [session]);

  useEffect(() => {
    const handler = e => searchRef.current && !searchRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("id, item_name, unit_price, brand, location");
    const { data: tx } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", false).order("date", { ascending: false });
    const { data: deletedTx } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", true).order("deleted_at", { ascending: false });
    setItems(itemsData || []);
    setTransactions(tx || []);
    setDeletedTransactions(deletedTx || []);
  }

  // ================= HELPER =================
  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(k => String(originalFormRef.current[k] || "") !== String(form[k] || ""));
  }

  async function saveTransaction() {
    if (!form.quantity) return alert("Complete the form");
    let item = items.find(i => i.id === Number(form.item_id));
    if (!item && itemSearch) {
      if (selectedStockRoom === "All Stock Rooms") return alert("Select a stock room to create a new item");
      const { data: newItemData, error: itemErr } = await supabase.from("items").insert([{ item_name: itemSearch, location: selectedStockRoom }]).select().single();
      if (itemErr) return alert(itemErr.message);
      item = newItemData;
    }
    if (!item) return alert("Item not found");
    if (form.type === "OUT") {
      const stockItem = stockInventory.find(i => i.id === item.id);
      if (stockItem && Number(form.quantity) > stockItem.stock) return alert("Cannot OUT more than available stock");
    }

    const payload = {
      location: selectedStockRoom === "All Stock Rooms" ? null : selectedStockRoom,
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: Number(item.id),
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price) || item.unit_price || 0,
      brand: form.brand || item.brand || null,
      unit: form.unit || null,
      volume_pack: form.volume_pack || null,
      deleted: false,
    };

    if (form.type === "IN" && form.unit_price) {
      await supabase.from("items").update({ unit_price: Number(form.unit_price) }).eq("id", item.id);
    }

    const { error } = editingId
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingId)
      : await supabase.from("inventory_transactions").insert([payload]);

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", unit_price: "", date: "", brand: "", unit: "", volume_pack: "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  // ================= STOCK INVENTORY =================
  const stockInventory = items
    .filter(i => selectedStockRoom === "All Stock Rooms" || i.location === selectedStockRoom)
    .map(i => {
      const related = transactions.filter(t => t.item_id === i.id);
      const stock = related.reduce((sum, t) => sum + (t.type === "IN" ? Number(t.quantity) : -Number(t.quantity)), 0);
      const latestTx = related.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      return {
        id: i.id,
        item_name: i.item_name,
        brand: latestTx?.brand || i.brand || "—",
        volume_pack: latestTx?.volume_pack || "—",
        unit_price: Number(latestTx?.unit_price ?? i.unit_price ?? 0),
        stock,
        location: i.location
      };
    });

  const filteredTransactions = transactions.filter(t => selectedStockRoom === "All Stock Rooms" || t.location === selectedStockRoom);

  const monthlyTotals = filteredTransactions.reduce((acc, t) => {
    if (!t.date) return acc;
    const month = t.date.slice(0, 7);
    acc[month] = acc[month] || { IN: 0, OUT: 0 };
    acc[month][t.type] += t.quantity * t.unit_price;
    return acc;
  }, {});

  if (!session) return (
    <div style={{ padding: 40 }}>
      <h2>Inventory Login</h2>
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>Login with Google</button>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      {/* HEADER */}
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Lago De Oro Inventory System</h1>
      <div style={{ marginBottom: 16 }}>
        <label>Stock Room:</label>
        <select value={selectedStockRoom} onChange={e => setSelectedStockRoom(e.target.value)}>
          {stockRooms.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {["stock", "transactions", "report", "deleted"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
                     background: activeTab === tab ? "#1f2937" : "transparent",
                     color: activeTab === tab ? "#fff" : "#374151" }}
          >
            {tab === "stock" ? "📦 Stock" : tab === "transactions" ? "📄 Transactions" : tab === "report" ? "📊 Report" : "🗑️ Deleted"}
          </button>
        ))}
      </div>

      {/* ================= STOCK INVENTORY ================= */}
      {activeTab === "stock" && (
        <div>
          <button onClick={() => { setShowItemModal(true); setEditingItemId(null); setNewItem({ item_name:"", brand:"", unit_price:"" }); }}
                  style={{ marginBottom: 12 }}>+ Add / Edit Item</button>

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thtd}>Item</th>
                  <th style={thtd}>Brand</th>
                  <th style={thtd}>Volume Pack</th>
                  <th style={thtd}>Stock</th>
                  <th style={thtd}>Unit Price</th>
                  <th style={thtd}>Total Price</th>
                  <th style={thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockInventory.length === 0 && emptyRow(7, "No stock data")}
                {stockInventory.map(i => (
                  <StockRow key={i.id} item={i} loadData={loadData} setShowItemModal={setShowItemModal} setEditingItemId={setEditingItemId} setNewItem={setNewItem} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ITEM MODAL ================= */}
      {showItemModal && (
        <ItemModal newItem={newItem} setNewItem={setNewItem} editingItemId={editingItemId} setShowItemModal={setShowItemModal} loadData={loadData} selectedStockRoom={selectedStockRoom} />
      )}

      {/* ================= CONFIRM MODAL ================= */}
      {confirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:2000 }}>
          <div style={{ background:"#fff",borderRadius:12,width:400,padding:24 }}>
            <p style={{ marginBottom:24 }}>{confirm.message}</p>
            <div style={{ display:"flex",justifyContent:"flex-end",gap:12 }}>
              <button onClick={closeConfirm} style={{padding:"8px 16px",borderRadius:6,border:"none"}}>Cancel</button>
              <button onClick={()=>{ confirm.onConfirm(); closeConfirm(); }} style={{padding:"8px 16px",borderRadius:6,border:"none",background:"#1f2937",color:"#fff"}}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= STOCK ROW COMPONENT WITH QUICK IN/OUT =================
function StockRow({ item, loadData, setShowItemModal, setEditingItemId, setNewItem }) {
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickForm, setQuickForm] = useState({ type: "IN", quantity: "", unit_price: item.unit_price });

  const handleQuickSubmit = async () => {
    if (!quickForm.quantity) return alert("Enter quantity");
    const payload = {
      location: item.location,
      date: new Date().toISOString().slice(0, 10),
      item_id: item.id,
      type: quickForm.type,
      quantity: Number(quickForm.quantity),
      unit_price: Number(quickForm.unit_price || item.unit_price),
    };
    if (quickForm.type === "OUT" && Number(quickForm.quantity) > item.stock) return alert("Cannot OUT more than available stock");
    await supabase.from("inventory_transactions").insert([payload]);
    setQuickForm({ type: "IN", quantity: "", unit_price: item.unit_price });
    setShowQuickForm(false);
    loadData();
  };

  return (
    <>
      <tr style={item.stock <=5 ? { background:"#fee2e2"} : undefined}>
        <td style={thtd}>{item.item_name}</td>
        <td style={thtd}>{item.brand}</td>
        <td style={thtd}>{item.volume_pack}</td>
        <td style={thtd}>{item.stock}</td>
        <td style={thtd}>₱{item.unit_price.toFixed(2)}</td>
        <td style={thtd}>₱{(item.stock*item.unit_price).toFixed(2)}</td>
        <td style={thtd}>
          <button onClick={() => { setEditingItemId(item.id); setNewItem({ item_name:item.item_name, brand:item.brand, unit_price:item.unit_price }); setShowItemModal(true); }}>✏️ Edit</button>
          <button onClick={() => openConfirm("Delete this item?", async () => { await supabase.from("items").delete().eq("id", item.id); loadData(); })}>🗑️ Delete</button>
          <button onClick={() => setShowQuickForm(f=>!f)}>⚡ Quick IN/OUT</button>
        </td>
      </tr>
      {showQuickForm && (
        <tr style={{ background:"#f9fafb"}}>
          <td colSpan={7} style={{ padding:8 }}>
            <div style={{ display:"flex", gap:12, alignItems:"center"}}>
              <select value={quickForm.type} onChange={e=>setQuickForm(f=>({...f,type:e.target.value}))}>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
              <input type="number" placeholder="Quantity" value={quickForm.quantity} onChange={e=>setQuickForm(f=>({...f,quantity:e.target.value}))} />
              <input type="number" placeholder="Unit Price" value={quickForm.unit_price} onChange={e=>setQuickForm(f=>({...f,unit_price:e.target.value}))} />
              <button onClick={handleQuickSubmit}>Save</button>
              <button onClick={()=>setShowQuickForm(false)}>Cancel</button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ================= ITEM MODAL COMPONENT =================
function ItemModal({ newItem, setNewItem, editingItemId, setShowItemModal, loadData, selectedStockRoom }) {
  const handleSave = async () => {
    if (!newItem.item_name) return alert("Item name required");
    if (editingItemId) {
      await supabase.from("items").update({ item_name:newItem.item_name, brand:newItem.brand, unit_price:Number(newItem.unit_price)||0 }).eq("id", editingItemId);
    } else {
      if (selectedStockRoom === "All Stock Rooms") return alert("Select a stock room first");
      await supabase.from("items").insert([{ item_name:newItem.item_name, brand:newItem.brand, unit_price:Number(newItem.unit_price)||0, location:selectedStockRoom }]);
    }
    setShowItemModal(false);
    setNewItem({ item_name:"", brand:"", unit_price:"" });
    loadData();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:2000 }}>
      <div style={{ background:"#fff", borderRadius:12, width:520, padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3>{editingItemId ? "Edit Item":"Add New Item"}</h3>
          <button onClick={()=>setShowItemModal(false)}>&times;</button>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <input placeholder="Item name" value={newItem.item_name} onChange={e=>setNewItem(f=>({...f,item_name:e.target.value}))} />
          <input placeholder="Brand" value={newItem.brand} onChange={e=>setNewItem(f=>({...f,brand:e.target.value}))} />
          <input type="number" placeholder="Unit price" value={newItem.unit_price} onChange={e=>setNewItem(f=>({...f,unit_price:e.target.value}))} />
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
          <button onClick={()=>setShowItemModal(false)} style={{ marginRight:12 }}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
