import React, { useState, useEffect } from "react";

const API = "http://localhost:8000";

export default function App() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  const [activeTab, setActiveTab] = useState("stock");

  const [stockSearch, setStockSearch] = useState("");
  const [txnSearch, setTxnSearch] = useState("");
  const [deletedSearch, setDeletedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editTxn, setEditTxn] = useState(null);

  const [form, setForm] = useState({
    date: "",
    item_id: "",
    type: "OUT",
    quantity: "",
    unit_price: ""
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    await Promise.all([loadItems(), loadTransactions(), loadDeleted()]);
  };

  const loadItems = async () => {
    const r = await fetch(`${API}/items`);
    setItems(await r.json());
  };

  const loadTransactions = async () => {
    const r = await fetch(`${API}/transactions`);
    setTransactions(await r.json());
  };

  const loadDeleted = async () => {
    const r = await fetch(`${API}/deleted-transactions`);
    setDeletedTransactions(await r.json());
  };

  const openAdd = () => {
    setEditTxn(null);
    setForm({
      date: new Date().toISOString().slice(0,10),
      item_id: "",
      type: "OUT",
      quantity: "",
      unit_price: ""
    });
    setModalOpen(true);
  };

  const openEdit = t => {
    setEditTxn(t);
    setForm({
      date: t.date,
      item_id: t.item_id,
      type: t.type,
      quantity: t.quantity,
      unit_price: t.unit_price || ""
    });
    setModalOpen(true);
  };

  const submitForm = async () => {
    if(!form.item_id || !form.quantity) return alert("Fill all required fields");

    const method = editTxn ? "PUT" : "POST";
    const url = editTxn ? `${API}/transactions/${editTxn.id}` : `${API}/transactions`;

    await fetch(url, {
      method,
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(form)
    });

    setModalOpen(false);
    loadAll();
  };

  const deleteTxn = async id => {
    if(!window.confirm("Delete this transaction?")) return;
    await fetch(`${API}/transactions/${id}`, { method:"DELETE" });
    loadAll();
  };

  const monthlyReport = transactions.reduce((acc,t)=>{
    const m = t.date?.slice(0,7);
    if(!m) return acc;
    if(!acc[m]) acc[m] = {in:0,out:0,val:0};
    if(t.type==="IN") acc[m].in += +t.quantity;
    else {
      acc[m].out += +t.quantity;
      acc[m].val += +t.quantity * +(t.unit_price||0);
    }
    return acc;
  },{});

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <h1>📦 Inventory Management System</h1>
          <button style={styles.addBtn} onClick={openAdd}>+ New Transaction</button>
        </div>

        {/* TABS */}
        <div style={styles.tabs}>
          {["stock","transactions","deleted","report"].map(t=>(
            <div
              key={t}
              onClick={()=>setActiveTab(t)}
              style={{
                ...styles.tab,
                ...(activeTab===t?styles.activeTab:{})
              }}
            >
              {t.toUpperCase()}
            </div>
          ))}
        </div>

        {/* STOCK */}
        {activeTab==="stock" && (
          <div style={styles.card}>
            <h2>📋 Current Stock</h2>
            <input style={styles.input} placeholder="Search items..." value={stockSearch} onChange={e=>setStockSearch(e.target.value)} />
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {items.filter(i=>i.item_name.toLowerCase().includes(stockSearch.toLowerCase())).map(i=>(
                  <tr key={i.id} style={i.stock<10?styles.lowStock:{}}>
                    <td>{i.item_name}</td>
                    <td>{i.category}</td>
                    <td>{i.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TRANSACTIONS */}
        {activeTab==="transactions" && (
          <div style={styles.card}>
            <h2>🧾 Transactions</h2>
            <input style={styles.input} placeholder="Search..." value={txnSearch} onChange={e=>setTxnSearch(e.target.value)} />
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.filter(t=>
                  t.items?.item_name?.toLowerCase().includes(txnSearch.toLowerCase())
                ).map(t=>(
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.items?.item_name}</td>
                    <td>{t.type}</td>
                    <td>{t.quantity}</td>
                    <td>₱{Number(t.unit_price||0).toFixed(2)}</td>
                    <td>
                      <button style={styles.editBtn} onClick={()=>openEdit(t)}>Edit</button>
                      <button style={styles.delBtn} onClick={()=>deleteTxn(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DELETED */}
        {activeTab==="deleted" && (
          <div style={styles.card}>
            <h2>🗑 Deleted History</h2>
            <input style={styles.input} placeholder="Search..." value={deletedSearch} onChange={e=>setDeletedSearch(e.target.value)} />
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Deleted</th>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {deletedTransactions.filter(t=>
                  t.items?.item_name?.toLowerCase().includes(deletedSearch.toLowerCase())
                ).map(t=>(
                  <tr key={t.id}>
                    <td>{t.deleted_at}</td>
                    <td>{t.date}</td>
                    <td>{t.items?.item_name}</td>
                    <td>{t.type}</td>
                    <td>{t.quantity}</td>
                    <td>₱{Number(t.unit_price||0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT */}
        {activeTab==="report" && (
          <div style={styles.card}>
            <h2>📊 Monthly Report</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total IN</th>
                  <th>Total OUT</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(monthlyReport).sort((a,b)=>b.localeCompare(a)).map(m=>(
                  <tr key={m}>
                    <td>{m}</td>
                    <td>{monthlyReport[m].in}</td>
                    <td>{monthlyReport[m].out}</td>
                    <td>₱{monthlyReport[m].val.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL */}
        {modalOpen && (
          <div style={styles.modalBg}>
            <div style={styles.modal}>
              <h2>{editTxn?"Edit":"New"} Transaction</h2>

              <input type="date" style={styles.input} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>

              <select style={styles.input} value={form.item_id} onChange={e=>setForm({...form,item_id:e.target.value})}>
                <option value="">Select Item</option>
                {items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}
              </select>

              <select style={styles.input} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                <option>IN</option>
                <option>OUT</option>
              </select>

              <input style={styles.input} placeholder="Quantity" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/>
              <input style={styles.input} placeholder="Unit Price" type="number" value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})}/>

              <div style={styles.modalBtns}>
                <button style={styles.addBtn} onClick={submitForm}>Save</button>
                <button style={styles.delBtn} onClick={()=>setModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  page:{ background:"#f4f6f9", minHeight:"100vh", padding:20 },
  container:{ maxWidth:1200, margin:"auto" },
  header:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:15 },

  tabs:{ display:"flex", gap:8, marginBottom:15 },
  tab:{ padding:"10px 18px", background:"#e5e7eb", borderRadius:8, cursor:"pointer", fontWeight:600 },
  activeTab:{ background:"#2563eb", color:"#fff" },

  card:{ background:"#fff", borderRadius:12, padding:20, boxShadow:"0 5px 15px rgba(0,0,0,.05)" },

  table:{ width:"100%", borderCollapse:"collapse", marginTop:10 },
  lowStock:{ background:"#fee2e2" },

  input:{ padding:10, width:"100%", margin:"8px 0", borderRadius:8, border:"1px solid #ccc" },

  addBtn:{ background:"#2563eb", color:"#fff", border:"none", padding:"10px 18px", borderRadius:8, cursor:"pointer", fontWeight:600 },
  editBtn:{ background:"#f59e0b", color:"#fff", border:"none", padding:"6px 12px", borderRadius:6, cursor:"pointer", marginRight:6 },
  delBtn:{ background:"#dc2626", color:"#fff", border:"none", padding:"6px 12px", borderRadius:6, cursor:"pointer" },

  modalBg:{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center" },
  modal:{ background:"#fff", padding:25, borderRadius:12, width:420 },
  modalBtns:{ display:"flex", justifyContent:"space-between", marginTop:10 }
};
