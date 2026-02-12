import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: { display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: '#f4f6f8' },
  sidebar: { width: 220, background: '#1f2937', color: '#fff', display: 'flex', flexDirection: 'column', padding: 20 },
  sidebarHeader: { fontSize: 18, fontWeight: 700, marginBottom: 20 },
  sidebarButton: (active) => ({
    padding: '10px 12px', borderRadius: 6, marginBottom: 8, background: active ? '#374151' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'left', fontWeight: 500
  }),
  main: { flex: 1, padding: 24, overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  buttonPrimary: { background: '#1f2937', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer' },
  input: { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  thtd: { padding: 12, borderBottom: '1px solid #e5e7eb', textAlign: 'left' },
  modalOverlay: { position: 'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.4)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 },
  modalCard: { background:'#fff', padding:24, borderRadius:8, width:'400px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' },
  toggleGroup: { display:'flex', gap:12, marginBottom:12 },
  toggleButton: (active) => ({ flex:1, padding:'8px 0', borderRadius:6, border: active ? 'none' : '1px solid #d1d5db', background: active ? '#1f2937' : '#fff', color: active ? '#fff' : '#374151', cursor:'pointer', fontWeight:600 }),
};

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('stock');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'transaction' or 'item'
  const [selectedStockRoom, setSelectedStockRoom] = useState('All Stock Rooms');
  const [stockRooms] = useState(["All Stock Rooms","L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7","Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"]);

  const [form, setForm] = useState({
    item_id: '', type: 'IN', quantity: '', date: '', brand: '', item_name:'', price:''
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  async function loadData() {
    const { data: itemsData } = await supabase.from('items').select('*');
    const { data: txData } = await supabase.from('inventory_transactions').select('*, items(item_name, brand, unit_price)').order('date', { ascending: false });
    setItems(itemsData || []);
    setTransactions(txData || []);
  }

  useEffect(() => { if(session) loadData(); }, [session]);

  const handleFormChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmitTransaction = async () => {
    // Check if brand exists
    const selectedItem = items.find(i => i.id === form.item_id);
    if(selectedItem && form.brand !== selectedItem.brand) {
      if(!window.confirm('Brand differs from stock. Add as new item?')) return;
      setModalType('item');
      return;
    }
    await supabase.from('inventory_transactions').insert([{ ...form }]);
    setShowModal(false);
    setForm({ item_id: '', type:'IN', quantity:'', date:'', brand:'', item_name:'', price:'' });
    loadData();
  };

  const handleSubmitItem = async () => {
    await supabase.from('items').insert([{ item_name: form.item_name, brand: form.brand, unit_price: form.price, location: selectedStockRoom }]);
    setShowModal(false);
    setForm({ item_id: '', type:'IN', quantity:'', date:'', brand:'', item_name:'', price:'' });
    loadData();
  };

  if(!session) return <div style={{padding:40,textAlign:'center'}}><h2>Login</h2><button style={styles.buttonPrimary} onClick={()=>supabase.auth.signInWithOAuth({provider:'google'})}>Login with Google</button></div>;

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>Lago De Oro</div>
        <select value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)} style={{marginBottom:20,padding:8,borderRadius:6}}>
          {stockRooms.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <button style={styles.sidebarButton(activeTab==='stock')} onClick={()=>setActiveTab('stock')}>📦 Stock Inventory</button>
        <button style={styles.sidebarButton(activeTab==='transactions')} onClick={()=>setActiveTab('transactions')}>📄 Transactions</button>
        <button style={styles.sidebarButton(activeTab==='deleted')} onClick={()=>setActiveTab('deleted')}>🗑️ Deleted History</button>
        <button style={styles.sidebarButton(activeTab==='report')} onClick={()=>setActiveTab('report')}>📊 Monthly Report</button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <div style={styles.header}>
          <h1>{activeTab==='stock'?'Stock Inventory':activeTab==='transactions'?'Transactions':activeTab==='deleted'?'Deleted History':'Monthly Report'}</h1>
          <button style={styles.buttonPrimary} onClick={()=>{const type = window.prompt('Type "item" for new item or "transaction" for transaction'); setModalType(type); setShowModal(true);}}>NEW</button>
        </div>

        {/* Tables */}
        {activeTab==='stock' && (
          <table style={styles.table}>
            <thead><tr><th style={styles.thtd}>Available Stocks</th><th style={styles.thtd}>Item Name</th><th style={styles.thtd}>Brand</th><th style={styles.thtd}>Price</th></tr></thead>
            <tbody>
              {items.map(i=>(<tr key={i.id}><td style={styles.thtd}>{transactions.filter(t=>t.item_id===i.id).reduce((sum,t)=>sum+(t.type==='IN'?Number(t.quantity):-Number(t.quantity)),0)}</td><td style={styles.thtd}>{i.item_name}</td><td style={styles.thtd}>{i.brand}</td><td style={styles.thtd}>₱{i.unit_price.toFixed(2)}</td></tr>))}
            </tbody>
          </table>
        )}

        {activeTab==='transactions' && (
          <table style={styles.table}>
            <thead><tr><th style={styles.thtd}>Date</th><th style={styles.thtd}>Item</th><th style={styles.thtd}>Brand</th><th style={styles.thtd}>Type</th><th style={styles.thtd}>Quantity</th></tr></thead>
            <tbody>{transactions.map(t=>(<tr key={t.id}><td style={styles.thtd}>{t.date}</td><td style={styles.thtd}>{t.items?.item_name}</td><td style={styles.thtd}>{t.items?.brand}</td><td style={styles.thtd}>{t.type}</td><td style={styles.thtd}>{t.quantity}</td></tr>))}</tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={()=>setShowModal(false)}>
          <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>
            {modalType==='transaction' && <>
              <h3>New Transaction</h3>
              <input type="date" value={form.date} onChange={e=>handleFormChange('date',e.target.value)} style={styles.input} />
              <input list="items-list" value={form.item_id} placeholder="Select Item" onChange={e=>handleFormChange('item_id',e.target.value)} style={styles.input} />
              <datalist id="items-list">{items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}</datalist>
              <input value={form.brand} placeholder="Brand" onChange={e=>handleFormChange('brand',e.target.value)} style={styles.input} />
              <div style={styles.toggleGroup}>
                <button style={styles.toggleButton(form.type==='IN')} onClick={()=>handleFormChange('type','IN')}>IN</button>
                <button style={styles.toggleButton(form.type==='OUT')} onClick={()=>handleFormChange('type','OUT')}>OUT</button>
              </div>
              <input type="number" placeholder="Quantity" value={form.quantity} onChange={e=>handleFormChange('quantity',e.target.value)} style={styles.input} />
              <div style={{display:'flex',justifyContent:'flex-end',gap:12}}>
                <button style={styles.buttonPrimary} onClick={handleSubmitTransaction}>Submit</button>
                <button style={styles.buttonPrimary} onClick={()=>setShowModal(false)}>Cancel</button>
              </div>
            </>}
            {modalType==='item' && <>
              <h3>New Item</h3>
              <input placeholder="Item Name" value={form.item_name} onChange={e=>handleFormChange('item_name',e.target.value)} style={styles.input} />
              <input placeholder="Brand" value={form.brand} onChange={e=>handleFormChange('brand',e.target.value)} style={styles.input} />
              <input type="number" placeholder="Price" value={form.price} onChange={e=>handleFormChange('price',e.target.value)} style={styles.input} />
              <div style={{display:'flex',justifyContent:'flex-end',gap:12}}>
                <button style={styles.buttonPrimary} onClick={handleSubmitItem}>Submit</button>
                <button style={styles.buttonPrimary} onClick={()=>setShowModal(false)}>Cancel</button>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}
