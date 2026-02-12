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
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newItem, setNewItem] = useState({ item_name: "", brand: "", unit_price: "" });

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
  useEffect(() => { setInSearch(""); }, [inFilter]);
  useEffect(() => { setOutSearch(""); }, [outFilter]);

  // tabs
  const [activeTab, setActiveTab] = useState("stock");

  // ================= STOCK ROOMS =================
  const stockRooms = [
    "All Stock Rooms","L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4",
    "L3","L5","L6","L7","Maintenance Bodega 1","Maintenance Bodega 2",
    "Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room",
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
    unit_price: "",
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
    setDeletedTransactions(deletedTx || []);
  }

  useEffect(() => {
    if (session) loadData();
    setShowForm(false);
  }, [session]);

  // ================= SAVE =================
  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(k => String(originalFormRef.current[k] || "") !== String(form[k] || ""));
  }

  async function saveTransaction() {
    if (!form.quantity) return alert("Complete the form");

    let item = items.find(i => i.id === Number(form.item_id));

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

  // ================= MONTHLY REPORT STATE =================
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0,7)); // yyyy-mm

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
      {/* STOCK ROOM SELECTOR */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#374151" }}>Stock Room</label>
          <select value={selectedStockRoom} onChange={e => setSelectedStockRoom(e.target.value)}>
            {stockRooms.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Lago De Oro Inventory System</h1>
        <p style={{ fontSize: 12, marginTop: 0, color: "#6b7280" }}>Manage stock IN / OUT and reports</p>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 16, padding: 8, background: "#f3f4f6", borderRadius: 999 }}>
          <button
            onClick={() => setActiveTab("stock")}
            style={{ padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
              background: activeTab==="stock"?"#1f2937":"transparent", color: activeTab==="stock"?"#fff":"#374151", fontWeight:500 }}
          >📦 Stock Inventory</button>
          <button
            onClick={() => setActiveTab("transactions")}
            style={{ padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
              background: activeTab==="transactions"?"#1f2937":"transparent", color: activeTab==="transactions"?"#fff":"#374151", fontWeight:500 }}
          >📄 Transactions</button>
          <button
            onClick={() => setActiveTab("report")}
            style={{ padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
              background: activeTab==="report"?"#1f2937":"transparent", color: activeTab==="report"?"#fff":"#374151", fontWeight:500 }}
          >📊 Monthly Report</button>
          <button
            onClick={() => setActiveTab("deleted")}
            style={{ padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
              background: activeTab==="deleted"?"#1f2937":"transparent", color: activeTab==="deleted"?"#fff":"#374151", fontWeight:500 }}
          >🗑️ Deleted History</button>
        </div>
      </div>

      {/* ================= MONTHLY REPORT TAB ================= */}
      {activeTab==="report" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <label>Select Month: </label>
            <input type="month" value={reportMonth} onChange={e=>setReportMonth(e.target.value)} />
          </div>
          <div style={{ maxHeight:400, overflowY:"auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thtd}>Item</th>
                  <th style={thtd}>Total IN</th>
                  <th style={thtd}>Total OUT</th>
                  <th style={thtd}>Remaining Stock</th>
                </tr>
              </thead>
              <tbody>
                {items.length===0 && emptyRow(4,"No data")}
                {items.map(i => {
                  const related = transactions.filter(t=>t.item_id===i.id && t.date.startsWith(reportMonth));
                  const totalIN = related.filter(t=>t.type==="IN").reduce((a,t)=>a+t.quantity,0);
                  const totalOUT = related.filter(t=>t.type==="OUT").reduce((a,t)=>a+t.quantity,0);
                  return (
                    <tr key={i.id}>
                      <td style={thtd}>{i.item_name}</td>
                      <td style={thtd}>{totalIN}</td>
                      <td style={thtd}>{totalOUT}</td>
                      <td style={thtd}>{totalIN-totalOUT}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= STOCK TAB (with Add/Edit Item button) ================= */}
      {activeTab==="stock" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button onClick={()=>setShowItemModal(true)} style={{ padding:"12px 20px", background:"#111827", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}>
              + Add / Edit Item
            </button>
          </div>
          <div style={{ maxHeight:400, overflowY:"auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thtd}>Item</th>
                  <th style={thtd}>Brand</th>
                  <th style={thtd}>Volume Pack</th>
                  <th style={thtd}>Stock</th>
                  <th style={thtd}>Unit Price</th>
                  <th style={thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockInventory.length===0 && emptyRow(6,"No stock data")}
                {stockInventory.map(i=>(
                  <tr key={i.id} style={i.stock<=5?{background:"#fee2e2"}:{}}>
                    <td style={thtd}>{i.item_name}</td>
                    <td style={thtd}>{i.brand}</td>
                    <td style={thtd}>{i.volume_pack}</td>
                    <td style={thtd}>{i.stock}</td>
                    <td style={thtd}>{i.unit_price.toFixed(2)}</td>
                    <td style={thtd}>
                      <button onClick={()=>{setEditingItemId(i.id); setNewItem({item_name:i.item_name, brand:i.brand, unit_price:i.unit_price}); setShowItemModal(true)}}>✏️ Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================= ITEM MODAL ================= */}
      {showItemModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 }}>
          <div style={{ background:"#fff", borderRadius:12, width:400, padding:24 }}>
            <h3>{editingItemId?"Edit Item":"Add Item"}</h3>
            <input placeholder="Item Name" value={newItem.item_name} onChange={e=>setNewItem(f=>({...f,item_name:e.target.value}))} style={{width:"100%", marginBottom:8}} />
            <input placeholder="Brand" value={newItem.brand} onChange={e=>setNewItem(f=>({...f,brand:e.target.value}))} style={{width:"100%", marginBottom:8}} />
            <input type="number" placeholder="Unit Price" value={newItem.unit_price} onChange={e=>setNewItem(f=>({...f,unit_price:e.target.value}))} style={{width:"100%", marginBottom:8}} />
            <button onClick={async ()=>{
              if(!newItem.item_name) return alert("Item name required");
              if(editingItemId){
                await supabase.from("items").update({item_name:newItem.item_name, brand:newItem.brand, unit_price:Number(newItem.unit_price)||0}).eq("id", editingItemId);
              } else {
                if(selectedStockRoom==="All Stock Rooms") return alert("Select a stock room first");
                await supabase.from("items").insert([{item_name:newItem.item_name, brand:newItem.brand, unit_price:Number(newItem.unit_price)||0, location:selectedStockRoom}]);
              }
              setShowItemModal(false);
              setEditingItemId(null);
              setNewItem({ item_name: "", brand: "", unit_price: "" });
              loadData();
            }} style={{width:"100%", padding:10, background:"#1f2937", color:"#fff", border:"none", borderRadius:6}}>{editingItemId?"Update Item":"Save Item"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
