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
  // ================= STATES =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");
  const [confirm, setConfirm] = useState(null);

  // Transaction modal
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTxId, setEditingTxId] = useState(null);
  const [txForm, setTxForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    unit_price: "",
    date: "",
    brand: "",
    unit: "",
    volume_pack: "",
  });
  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Stock modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newItem, setNewItem] = useState({ item_name: "", brand: "", unit_price: "", category: "" });

  const originalTxRef = useRef(null);

  // Filters
  const [inSearch, setInSearch] = useState("");
  const [inFilter, setInFilter] = useState("all");
  const [outSearch, setOutSearch] = useState("");
  const [outFilter, setOutFilter] = useState("all");
  const [deletedSearch, setDeletedSearch] = useState("");

  // Stock Rooms
  const stockRooms = [
    "All Stock Rooms", "L1", "L2 Room 1", "L2 Room 2", "L2 Room 3", "L2 Room 4",
    "L3", "L5", "L6", "L7", "Maintenance Bodega 1", "Maintenance Bodega 2",
    "Maintenance Bodega 3", "SKI Stock Room", "Quarry Stock Room",
  ];

  // ================= CONFIRM MODAL =================
  const openConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });
  const closeConfirm = () => setConfirm(null);

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
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

  useEffect(() => {
    if (session) loadData();
  }, [session]);

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
  const filteredTransactions = transactions.filter(t => selectedStockRoom === "All Stock Rooms" ? true : t.location === selectedStockRoom);

  // ================= MONTHLY TOTALS =================
  const monthlyTotals = filteredTransactions.reduce((acc, t) => {
    if (!t.date) return acc;
    const month = t.date.slice(0, 7);
    acc[month] = acc[month] || { IN: 0, OUT: 0 };
    acc[month][t.type] += t.quantity * t.unit_price;
    return acc;
  }, {});

  // ================= SAVE TRANSACTION =================
  async function saveTransaction() {
    if (!txForm.quantity) return alert("Complete the form");
    let item = items.find(i => i.id === Number(txForm.item_id));
    if (!item && itemSearch) {
      if (selectedStockRoom === "All Stock Rooms") return alert("Select a stock room to create a new item");
      const { data: newItemData, error: itemErr } = await supabase.from("items").insert([{ item_name: itemSearch, location: selectedStockRoom }]).select().single();
      if (itemErr) return alert(itemErr.message);
      item = newItemData;
    }
    if (!item) return alert("Item not found");

    if (txForm.type === "OUT") {
      const stockItem = stockInventory.find(i => i.id === item.id);
      if (stockItem && Number(txForm.quantity) > stockItem.stock) return alert("Cannot OUT more than available stock");
    }

    const payload = {
      location: selectedStockRoom === "All Stock Rooms" ? null : selectedStockRoom,
      date: txForm.date || new Date().toISOString().slice(0, 10),
      item_id: Number(item.id),
      type: txForm.type,
      quantity: Number(txForm.quantity),
      unit_price: Number(txForm.unit_price) || item.unit_price || 0,
      brand: txForm.brand || item.brand || null,
      unit: txForm.unit || null,
      volume_pack: txForm.volume_pack || null,
      deleted: false,
    };

    if (txForm.type === "IN" && txForm.unit_price) {
      await supabase.from("items").update({ unit_price: Number(txForm.unit_price) }).eq("id", item.id);
    }

    const { error } = editingTxId
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingTxId)
      : await supabase.from("inventory_transactions").insert([payload]);

    if (error) return alert(error.message);

    setTxForm({ item_id: "", type: "IN", quantity: "", unit_price: "", date: "", brand: "", unit: "", volume_pack: "" });
    setItemSearch("");
    setEditingTxId(null);
    setShowTransactionModal(false);
    loadData();
  }

  // ================= CLICK OUTSIDE =================
  const searchRef = useRef(null);
  useEffect(() => {
    const handler = e => searchRef.current && !searchRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      {/* TAB NAV */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, gap: 16 }}>
        {["stock","transactions","report","deleted"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding:"8px 16px",
              borderRadius:999,
              border:"none",
              cursor:"pointer",
              background: activeTab===tab?"#1f2937":"transparent",
              color: activeTab===tab?"#fff":"#374151",
              fontWeight:500
            }}
          >
            {tab==="stock"?"📦 Stock":tab==="transactions"?"📄 Transactions":tab==="report"?"📊 Report":"🗑️ Deleted"}
          </button>
        ))}
      </div>

      {/* ================= STOCK INVENTORY TAB ================= */}
      {activeTab==="stock" && (
        <div>
          <button onClick={()=>{setShowItemModal(true); setEditingItemId(null)}} style={{ marginBottom:12, padding:"12px 20px", background:"#111827", color:"#fff", border:"none", borderRadius:8, cursor:"pointer" }}>+ Add / Edit Item</button>
          <div style={{ maxHeight:400, overflowY:"auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Volume Pack</th><th style={thtd}>Stock</th><th style={thtd}>Unit Price</th><th style={thtd}>Total Value</th><th style={thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockInventory.length===0 && emptyRow(7,"No stock data")}
                {stockInventory.map(i => (
                  <tr key={i.id} style={i.stock<=5?{background:"#fee2e2"}:undefined}>
                    <td style={thtd}>{i.item_name}</td>
                    <td style={thtd}>{i.brand}</td>
                    <td style={thtd}>{i.volume_pack}</td>
                    <td style={thtd}>{i.stock}</td>
                    <td style={thtd}>₱{i.unit_price.toFixed(2)}</td>
                    <td style={thtd}>₱{(i.unit_price*i.stock).toFixed(2)}</td>
                    <td style={thtd}>
                      <button style={{marginRight:6}} onClick={()=>{setShowItemModal(true); setEditingItemId(i.id); setNewItem({item_name:i.item_name, brand:i.brand, unit_price:i.unit_price})}}>✏️ Edit</button>
                      <button onClick={()=>openConfirm("Permanently delete this item?", async ()=>{await supabase.from("items").delete().eq("id",i.id); loadData();})}>🗑️ Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TRANSACTIONS MODAL ================= */}
      {showTransactionModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 }}>
          <div style={{ background:"#fff", padding:24, borderRadius:12, width:600, position:"relative" }}>
            <h3>{editingTxId?"Edit Transaction":"Add Transaction"}</h3>
            <div style={{ display:"flex", flexWrap:"wrap", gap:12, position:"relative" }} ref={searchRef}>
              {/* Autocomplete input */}
              <input placeholder="Item Name" value={itemSearch} onChange={e=>{setItemSearch(e.target.value); setTxForm(f=>({...f,item_id:""}))}} style={{ flex:1, padding:"8px 12px", borderRadius:8, border:"1px solid #d1d5db"}}/>
              {itemSearch && (
                <div style={{ position:"absolute", top:40, left:0, right:0, background:"#fff", border:"1px solid #ccc", maxHeight:180, overflowY:"auto", zIndex:1001, borderRadius:4 }}>
                  {items.filter(i=>i.item_name.toLowerCase().includes(itemSearch.toLowerCase())).map(i=>{
                    const stockItem = stockInventory.find(s=>s.id===i.id);
                    const lowStock = stockItem && stockItem.stock<=5;
                    return (
                      <div key={i.id} style={{ padding:8, cursor:"pointer", background:lowStock?"#fee2e2":"transparent", display:"flex", justifyContent:"space-between" }}
                        onClick={()=>{setItemSearch(i.item_name); setTxForm(f=>({...f,item_id:i.id})); setDropdownOpen(false)}}>
                        <span>{i.item_name} {i.brand?`(${i.brand})`:''}</span>
                        {lowStock && <span style={{color:"#b91c1c", fontWeight:"bold"}}>Low Stock</span>}
                      </div>
                    )
                  })}
                  {items.filter(i=>i.item_name.toLowerCase().includes(itemSearch.toLowerCase())).length===0 && <div style={{ padding:8, color:"#888"}}>Create new item: "{itemSearch}"</div>}
                </div>
              )}
              <select value={txForm.type} onChange={e=>setTxForm(f=>({...f,type:e.target.value}))}><option value="IN">IN</option><option value="OUT">OUT</option></select>
              <input type="number" placeholder="Quantity" value={txForm.quantity} onChange={e=>setTxForm(f=>({...f,quantity:e.target.value}))}/>
              <input type="number" placeholder="Unit Price" value={txForm.unit_price} onChange={e=>setTxForm(f=>({...f,unit_price:e.target.value}))}/>
              <input type="text" placeholder="Brand" value={txForm.brand} onChange={e=>setTxForm(f=>({...f,brand:e.target.value}))}/>
              <input type="text" placeholder="Volume Pack" value={txForm.volume_pack} onChange={e=>setTxForm(f=>({...f,volume_pack:e.target.value}))}/>
              <input type="date" value={txForm.date} onChange={e=>setTxForm(f=>({...f,date:e.target.value}))}/>
            </div>
            <div style={{ marginTop:12, display:"flex", justifyContent:"flex-end", gap:8 }}>
              <button onClick={()=>setShowTransactionModal(false)}>Cancel</button>
              <button onClick={saveTransaction}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM MODAL ================= */}
      {confirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 }}>
          <div style={{ background:"#fff", padding:24, borderRadius:8, width:360, boxShadow:"0 10px 30px rgba(0,0,0,0.25)", textAlign:"center" }}>
            <h3>Confirm Action</h3>
            <p>{confirm.message}</p>
            <div style={{ display:"flex", gap:10 }}>
              <button style={{ flex:1, background:"#1f2937", color:"#fff"}} onClick={()=>{confirm.onConfirm(); closeConfirm();}}>Confirm</button>
              <button style={{ flex:1, background:"#e5e7eb"}} onClick={closeConfirm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ITEM MODAL ================= */}
      {showItemModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 }}>
          <div style={{ background:"#fff", borderRadius:12, width:520, maxWidth:"95%", padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <h3>{editingItemId?"Edit Item":"Add Item"}</h3>
              <button onClick={()=>{setShowItemModal(false); setEditingItemId(null)}}>&times;</button>
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <input placeholder="Item name" value={newItem.item_name} onChange={e=>setNewItem(f=>({...f,item_name:e.target.value}))} style={{ flex:1 }}/>
              <input placeholder="Brand" value={newItem.brand} onChange={e=>setNewItem(f=>({...f,brand:e.target.value}))} style={{ flex:1 }}/>
              <input type="number" placeholder="Unit Price" value={newItem.unit_price} onChange={e=>setNewItem(f=>({...f,unit_price:e.target.value}))} style={{ flex:1 }}/>
            </div>
            <button style={{ marginTop:16, padding:"8px 16px", background:"#111827", color:"#fff", border:"none", borderRadius:6 }} onClick={async ()=>{
              if(!newItem.item_name) return alert("Item name required");
              if(editingItemId){
                await supabase.from("items").update(newItem).eq("id",editingItemId);
              }else{
                await supabase.from("items").insert([{...newItem, location:"L1"}]);
              }
              loadData(); setShowItemModal(false); setEditingItemId(null);
            }}>Save</button>
          </div>
        </div>
      )}

      {/* ================= REPORT TAB ================= */}
      {activeTab==="report" && (
        <div>
          <h3>Monthly Report</h3>
          <table style={tableStyle}>
            <thead><tr><th style={thtd}>Month</th><th style={thtd}>IN Total</th><th style={thtd}>OUT Total</th></tr></thead>
            <tbody>
              {Object.keys(monthlyTotals).length===0 && emptyRow(3,"No data")}
              {Object.entries(monthlyTotals).map(([month, t])=>(
                <tr key={month}>
                  <td style={thtd}>{month}</td>
                  <td style={thtd}>₱{t.IN.toFixed(2)}</td>
                  <td style={thtd}>₱{t.OUT.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= DELETED TAB ================= */}
      {activeTab==="deleted" && (
        <div>
          <h3>Deleted Transactions</h3>
          <div style={{ maxHeight:400, overflowY:"auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thtd}>Item</th><th style={thtd}>Type</th><th style={thtd}>Quantity</th><th style={thtd}>Deleted At</th></tr></thead>
              <tbody>
                {deletedTransactions.length===0 && emptyRow(4,"No deleted transactions")}
                {deletedTransactions.map(d=>(
                  <tr key={d.id}>
                    <td style={thtd}>{d.items?.item_name}</td>
                    <td style={thtd}>{d.type}</td>
                    <td style={thtd}>{d.quantity}</td>
                    <td style={thtd}>{d.deleted_at?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
