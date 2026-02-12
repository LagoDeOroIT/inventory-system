import React, { useEffect, useState, useRef } from "react";
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

// ================= POPUP TRANSACTION FORM =================
function TransactionForm({ items, stockInventory, showForm, setShowForm, form, setForm, saveTransaction, editingId }) {
  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredItems = items.filter(i => i.item_name.toLowerCase().includes(itemSearch.toLowerCase()));

  const handleSelectItem = (item) => {
    setForm({
      ...form,
      item_id: item.id,
      brand: item.brand,
      unit_price: item.unit_price,
      volume_pack: item.volume_pack,
    });
    setItemSearch(item.item_name);
    setDropdownOpen(false);
  };

  const currentStock = stockInventory.find(i => i.id === form.item_id)?.stock || 0;

  return showForm ? (
    <div style={{
      position: "fixed", top:0, left:0, right:0, bottom:0,
      background: "rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center",
      zIndex: 999
    }}>
      <div style={{ background:"#fff", padding:20, borderRadius:8, width:400, position:"relative" }}>
        <button onClick={()=>setShowForm(false)} style={{position:"absolute", top:8, right:8}}>✖</button>
        <h3 style={{marginTop:0}}>{editingId ? "Edit Transaction" : "Add Transaction"}</h3>

        <div style={{marginBottom:8}}>
          <label>Item</label>
          <input
            type="text"
            value={itemSearch}
            onFocus={()=>setDropdownOpen(true)}
            onChange={e => { setItemSearch(e.target.value); setForm({...form, item_id: null}); setDropdownOpen(true); }}
            style={{width:"100%", padding:6, marginTop:2}}
          />
          {dropdownOpen && filteredItems.length > 0 && (
            <div style={{border:"1px solid #ccc", maxHeight:120, overflowY:"auto"}}>
              {filteredItems.map(i=>(
                <div key={i.id} onClick={()=>handleSelectItem(i)} style={{padding:6, cursor:"pointer"}}>
                  {i.item_name} ({i.brand})
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{marginBottom:8}}>
          <label>Type</label>
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{width:"100%", padding:6}}>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
        </div>

        <div style={{marginBottom:8}}>
          <label>Quantity {form.type==="OUT" && `(Current Stock: ${currentStock})`}</label>
          <input type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} style={{width:"100%", padding:6}} />
        </div>

        <div style={{marginBottom:8}}>
          <label>Unit Price</label>
          <input type="number" value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})} style={{width:"100%", padding:6}} />
        </div>

        <div style={{marginBottom:8}}>
          <label>Brand</label>
          <input type="text" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} style={{width:"100%", padding:6}} />
        </div>

        <div style={{marginBottom:8}}>
          <label>Volume/Pack</label>
          <input type="text" value={form.volume_pack} onChange={e=>setForm({...form,volume_pack:e.target.value})} style={{width:"100%", padding:6}} />
        </div>

        <div style={{marginBottom:8}}>
          <label>Date</label>
          <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{width:"100%", padding:6}} />
        </div>

        <button onClick={saveTransaction} style={{padding:"8px 16px"}}>{editingId ? "Save Changes" : "Add Transaction"}</button>
      </div>
    </div>
  ) : null;
}

// ================= MAIN APP =================
export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");

  // Form state
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

  // Stock rooms
  const stockRooms = ["All Stock Rooms","L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7"];

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("*");
    const { data: tx } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", false).order("date", { ascending: false });
    const { data: deletedTx } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", true).order("deleted_at", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
    setDeletedTransactions(deletedTx || []);
  }

  useEffect(() => { if(session) loadData(); }, [session]);

  // ================= SAVE =================
  async function saveTransaction() {
    if(!form.quantity) return alert("Enter quantity");

    let item = items.find(i=>i.id===Number(form.item_id));
    if(!item) return alert("Select an existing item");

    const payload = {
      location: selectedStockRoom === "All Stock Rooms" ? null : selectedStockRoom,
      date: form.date || new Date().toISOString().slice(0,10),
      item_id: Number(item.id),
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price) || item.unit_price || 0,
      brand: form.brand || item.brand || null,
      unit: form.unit || null,
      volume_pack: form.volume_pack || null,
      deleted: false,
    };

    if(form.type==="IN" && form.unit_price){
      await supabase.from("items").update({unit_price:Number(form.unit_price)}).eq("id", item.id);
    }

    const { error } = editingId
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingId)
      : await supabase.from("inventory_transactions").insert([payload]);

    if(error) return alert(error.message);

    setForm({item_id:"",type:"IN",quantity:"",unit_price:"",date:"",brand:"",unit:"",volume_pack:""});
    setEditingId(null);
    setShowForm(false);
    loadData();
  }

  // ================= STOCK INVENTORY =================
  const stockInventory = items.map(i=>{
    const related = transactions.filter(t=>t.item_id===i.id);
    const stock = related.reduce((sum,t)=>sum + (t.type==="IN"?Number(t.quantity):-Number(t.quantity)),0);
    const latestTx = related.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
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

  if(!session) return <div style={{padding:40}}><h2>Login</h2><button onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}>Login with Google</button></div>;

  return (
    <div style={{padding:20}}>
      <h1>Lago De Oro Inventory System</h1>
      {/* Stock Room Selector */}
      <select value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
        {stockRooms.map(r=><option key={r} value={r}>{r}</option>)}
      </select>

      {/* Tabs */}
      <div style={{display:"flex", gap:8, margin:"16px 0"}}>
        {["stock","transactions","deleted","report"].map(tab=>(
          <button key={tab} style={{background:activeTab===tab?"#333":"#eee", color:activeTab===tab?"#fff":"#000"}} onClick={()=>setActiveTab(tab)}>{tab.toUpperCase()}</button>
        ))}
      </div>

      {/* TRANSACTION FORM POPUP */}
      <TransactionForm
        items={items}
        stockInventory={stockInventory}
        showForm={showForm}
        setShowForm={setShowForm}
        form={form}
        setForm={setForm}
        saveTransaction={saveTransaction}
        editingId={editingId}
      />

      {/* TABS CONTENT */}
      {activeTab==="transactions" && (
        <div>
          <button onClick={()=>{setShowForm(true); setForm({item_id:"",type:"IN",quantity:"",unit_price:"",date:"",brand:"",unit:"",volume_pack:""}); setEditingId(null)}}>➕ Add Transaction</button>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th><th style={thtd}>Item</th><th style={thtd}>Type</th><th style={thtd}>Qty</th><th style={thtd}>Unit Price</th><th style={thtd}>Brand</th><th style={thtd}>Volume</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t=>(
                <tr key={t.id} style={editingId===t.id?editingRowStyle:{cursor:"pointer"}} onClick={()=>{
                  originalFormRef.current={item_id:t.item_id,type:t.type,quantity:String(t.quantity),unit_price:String(t.unit_price||""),date:t.date,brand:t.brand||"",unit:t.unit||"",volume_pack:t.volume_pack||""};
                  setEditingId(t.id);
                  setForm(originalFormRef.current);
                  setShowForm(true);
                }}>
                  <td style={thtd}>{t.date}</td><td style={thtd}>{t.items?.item_name}</td><td style={thtd}>{t.type}</td><td style={thtd}>{t.quantity}</td><td style={thtd}>{t.unit_price}</td><td style={thtd}>{t.brand}</td><td style={thtd}>{t.volume_pack}</td>
                </tr>
              ))}
              {transactions.length===0 && emptyRow(7,"No transactions")}
            </tbody>
          </table>
        </div>
      )}

      {activeTab==="stock" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Volume</th><th style={thtd}>Stock</th><th style={thtd}>Unit Price</th><th style={thtd}>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {stockInventory.map(i=>(
              <tr key={i.id} style={i.stock<=5?{background:"#fee2e2"}:{}}>
                <td style={thtd}>{i.item_name}</td><td style={thtd}>{i.brand}</td><td style={thtd}>{i.volume_pack}</td><td style={thtd}>{i.stock}</td><td style={thtd}>{i.unit_price}</td><td style={thtd}>{(i.stock*i.unit_price).toFixed(2)}</td>
              </tr>
            ))}
            {stockInventory.length===0 && emptyRow(6,"No stock data")}
          </tbody>
        </table>
      )}

      {activeTab==="deleted" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Date</th><th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Volume</th><th style={thtd}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {deletedTransactions.length===0 && emptyRow(5,"No deleted records")}
            {deletedTransactions.map(t=>(
              <tr key={t.id}>
                <td style={thtd}>{t.deleted_at || t.date}</td>
                <td style={thtd}>{t.items?.item_name}</td>
                <td style={thtd}>{t.brand}</td>
                <td style={thtd}>{t.volume_pack}</td>
                <td style={thtd}>{t.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab==="report" && (
        <table style={tableStyle}>
          <thead>
            <tr><th style={thtd}>Month</th><th style={thtd}>IN Total</th><th style={thtd}>OUT Total</th></tr>
          </thead>
          <tbody>
            {Object.entries(transactions.reduce((acc,t)=>{
              if(!t.date) return acc;
              const month=t.date.slice(0,7);
              acc[month]=acc[month]||{IN:0,OUT:0};
              acc[month][t.type]+=t.quantity*t.unit_price;
              return acc;
            },{})).map(([m,v])=>(
              <tr key={m}><td style={thtd}>{m}</td><td style={thtd}>{v.IN.toFixed(2)}</td><td style={thtd}>{v.OUT.toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  );
}
