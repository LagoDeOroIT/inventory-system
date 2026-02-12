import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const lowStockStyle = { background: "#fee2e2" };
const emptyRow = (colSpan, text) => (
  <tr><td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td></tr>
);

export default function App() {
  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");

  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");
  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  const stockRooms = [
    "All Stock Rooms","L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4",
    "L3","L5","L6","L7",
    "Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3",
    "SKI Stock Room","Quarry Stock Room"
  ];

  // ================= FORM STATES =================
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ item_name: "", brand: "", unit_price: "", location: "" });

  const [showTxForm, setShowTxForm] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [txForm, setTxForm] = useState({ item_id: "", type: "IN", quantity: "", unit_price: "", date: "", brand: "", volume_pack: "" });

  // ================= FILTER STATES =================
  const [inFilter, setInFilter] = useState("all");
  const [inSearch, setInSearch] = useState("");
  const [outFilter, setOutFilter] = useState("all");
  const [outSearch, setOutSearch] = useState("");
  const [deletedSearch, setDeletedSearch] = useState("");

  useEffect(() => setInSearch(""), [inFilter]);
  useEffect(() => setOutSearch(""), [outFilter]);

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

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handler = e => searchRef.current && !searchRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ================= STOCK INVENTORY =================
  const stockInventory = items
    .filter(i => selectedStockRoom === "All Stock Rooms" || i.location === selectedStockRoom)
    .map(i => {
      const related = transactions.filter(t => t.item_id === i.id);
      const stock = related.reduce((sum, t) => sum + (t.type === "IN" ? Number(t.quantity) : -Number(t.quantity)), 0);
      const latestTx = related.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
      return { ...i, brand: latestTx?.brand||i.brand||"—", volume_pack: latestTx?.volume_pack||"—", unit_price: Number(latestTx?.unit_price??i.unit_price??0), stock };
    });

  // ================= ITEM HANDLERS =================
  function editItem(item) { setEditingItem(item); setItemForm({ item_name:item.item_name, brand:item.brand, unit_price:item.unit_price, location:item.location }); setShowItemForm(true);}
  async function saveItem() {
    if (!itemForm.item_name || !itemForm.location) return alert("Fill required fields");
    if (editingItem) await supabase.from("items").update(itemForm).eq("id", editingItem.id);
    else await supabase.from("items").insert([itemForm]);
    setShowItemForm(false); setEditingItem(null); setItemForm({ item_name: "", brand: "", unit_price: "", location: "" });
    loadData();
  }
  async function deleteItem(id) { if(!window.confirm("Delete item permanently?")) return; await supabase.from("items").delete().eq("id", id); loadData(); }

  // ================= TRANSACTION HANDLERS =================
  function editTx(tx) { setEditingTx(tx); setTxForm({ item_id: tx.item_id, type: tx.type, quantity: tx.quantity, unit_price: tx.unit_price, date: tx.date, brand: tx.brand, volume_pack: tx.volume_pack }); setShowTxForm(true); }
  async function saveTx() {
    if(!txForm.item_id || !txForm.quantity || !txForm.date) return alert("Fill required fields");
    if(editingTx) await supabase.from("inventory_transactions").update(txForm).eq("id", editingTx.id);
    else await supabase.from("inventory_transactions").insert([txForm]);
    setShowTxForm(false); setEditingTx(null); setTxForm({ item_id:"", type:"IN", quantity:"", unit_price:"", date:"", brand:"", volume_pack:"" });
    loadData();
  }
  async function deleteTx(id) { if(!window.confirm("Delete transaction?")) return; await supabase.from("inventory_transactions").update({ deleted:true, deleted_at:new Date() }).eq("id",id); loadData(); }

  if(!session) return <div style={{padding:40}}><h2>Inventory Login</h2><button onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}>Login with Google</button></div>;

  return (
    <div style={{padding:20}}>
      <h1>Lago De Oro Inventory System</h1>
      <div style={{marginBottom:20}}>
        <button onClick={()=>setActiveTab("stock")}>Stock Inventory</button>
        <button onClick={()=>setActiveTab("transactions")}>Transactions</button>
        <button onClick={()=>setActiveTab("deleted")}>Deleted Transactions</button>
      </div>

      {/* ================= STOCK TAB ================= */}
      {activeTab==="stock" && (
        <div>
          <div style={{marginBottom:10, display:"flex", gap:10}}>
            <select value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>{stockRooms.map(r=><option key={r} value={r}>{r}</option>)}</select>
            <input placeholder="Search item..." value={itemSearch} onChange={e=>setItemSearch(e.target.value)} />
            <button onClick={()=>setEditingItem(null)||setShowItemForm(true)}>+ Add Item</button>
          </div>
          {showItemForm && (
            <div style={{padding:10,border:"1px solid #ccc",marginBottom:10}}>
              <h4>{editingItem?"Edit Item":"Add Item"}</h4>
              <input placeholder="Name" value={itemForm.item_name} onChange={e=>setItemForm({...itemForm, item_name:e.target.value})}/>
              <input placeholder="Brand" value={itemForm.brand} onChange={e=>setItemForm({...itemForm, brand:e.target.value})}/>
              <input type="number" placeholder="Unit Price" value={itemForm.unit_price} onChange={e=>setItemForm({...itemForm, unit_price:e.target.value})}/>
              <select value={itemForm.location} onChange={e=>setItemForm({...itemForm, location:e.target.value})}>{stockRooms.filter(r=>r!=="All Stock Rooms").map(r=><option key={r} value={r}>{r}</option>)}</select>
              <button onClick={saveItem}>Save</button>
              <button onClick={()=>setShowItemForm(false)}>Cancel</button>
            </div>
          )}
          <table style={tableStyle}>
            <thead>
              <tr><th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Volume/Pack</th><th style={thtd}>Unit Price</th><th style={thtd}>Stock</th><th style={thtd}>Location</th><th style={thtd}>Actions</th></tr>
            </thead>
            <tbody>
              {stockInventory.length===0 && emptyRow(7,"No items found")}
              {stockInventory.map(i=>(
                <tr key={i.id} style={i.stock<=5?lowStockStyle:undefined}>
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.brand}</td>
                  <td style={thtd}>{i.volume_pack}</td>
                  <td style={thtd}>{i.unit_price}</td>
                  <td style={thtd}>{i.stock}</td>
                  <td style={thtd}>{i.location}</td>
                  <td style={thtd}>
                    <button onClick={()=>editItem(i)}>Edit</button>
                    <button onClick={()=>deleteItem(i.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= TRANSACTIONS TAB ================= */}
      {activeTab==="transactions" && (
        <div>
          <button onClick={()=>setEditingTx(null)||setShowTxForm(true)}>+ Add Transaction</button>
          {showTxForm && (
            <div style={{padding:10,border:"1px solid #ccc",marginBottom:10}}>
              <h4>{editingTx?"Edit Transaction":"Add Transaction"}</h4>
              <select value={txForm.item_id} onChange={e=>setTxForm({...txForm,item_id:e.target.value})}>
                <option value="">Select Item</option>
                {items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}
              </select>
              <select value={txForm.type} onChange={e=>setTxForm({...txForm,type:e.target.value})}><option value="IN">IN</option><option value="OUT">OUT</option></select>
              <input type="number" placeholder="Quantity" value={txForm.quantity} onChange={e=>setTxForm({...txForm,quantity:e.target.value})}/>
              <input type="number" placeholder="Unit Price" value={txForm.unit_price} onChange={e=>setTxForm({...txForm,unit_price:e.target.value})}/>
              <input type="text" placeholder="Brand" value={txForm.brand} onChange={e=>setTxForm({...txForm,brand:e.target.value})}/>
              <input type="text" placeholder="Volume/Pack" value={txForm.volume_pack} onChange={e=>setTxForm({...txForm,volume_pack:e.target.value})}/>
              <input type="date" value={txForm.date} onChange={e=>setTxForm({...txForm,date:e.target.value})}/>
              <button onClick={saveTx}>Save</button>
              <button onClick={()=>setShowTxForm(false)}>Cancel</button>
            </div>
          )}
          <table style={tableStyle}>
            <thead><tr><th style={thtd}>Item</th><th style={thtd}>Type</th><th style={thtd}>Qty</th><th style={thtd}>Unit Price</th><th style={thtd}>Brand</th><th style={thtd}>Volume</th><th style={thtd}>Date</th><th style={thtd}>Actions</th></tr></thead>
            <tbody>
              {transactions.length===0 && emptyRow(8,"No transactions found")}
              {transactions.map(tx=>(
                <tr key={tx.id}>
                  <td style={thtd}>{tx.items?.item_name}</td>
                  <td style={thtd}>{tx.type}</td>
                  <td style={thtd}>{tx.quantity}</td>
                  <td style={thtd}>{tx.unit_price}</td>
                  <td style={thtd}>{tx.brand}</td>
                  <td style={thtd}>{tx.volume_pack}</td>
                  <td style={thtd}>{tx.date}</td>
                  <td style={thtd}><button onClick={()=>editTx(tx)}>Edit</button><button onClick={()=>deleteTx(tx.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= DELETED TAB ================= */}
      {activeTab==="deleted" && (
        <div>
          <input placeholder="Search deleted..." value={deletedSearch} onChange={e=>setDeletedSearch(e.target.value)} />
          <table style={tableStyle}>
            <thead><tr><th style={thtd}>Item</th><th style={thtd}>Type</th><th style={thtd}>Qty</th><th style={thtd}>Unit Price</th><th style={thtd}>Brand</th><th style={thtd}>Volume</th><th style={thtd}>Deleted At</th></tr></thead>
            <tbody>
              {deletedTransactions.length===0 && emptyRow(7,"No deleted transactions")}
              {deletedTransactions.filter(d=>!deletedSearch||d.items.item_name.toLowerCase().includes(deletedSearch.toLowerCase())).map(tx=>(
                <tr key={tx.id}><td style={thtd}>{tx.items?.item_name}</td><td style={thtd}>{tx.type}</td><td style={thtd}>{tx.quantity}</td><td style={thtd}>{tx.unit_price}</td><td style={thtd}>{tx.brand}</td><td style={thtd}>{tx.volume_pack}</td><td style={thtd}>{tx.deleted_at}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
