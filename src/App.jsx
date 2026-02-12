import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: { display: 'flex', fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f3f4f6' },
  sidebar: { width: 220, background: '#111827', color: '#fff', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  sidebarButton: (active) => ({ padding: '10px 16px', borderRadius: 8, background: active ? '#1f2937' : 'transparent', color: '#fff', border: 'none', textAlign: 'left', cursor: 'pointer' }),
  main: { flex: 1, padding: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  newButton: { background: '#1f2937', color: '#fff', padding: '10px 16px', borderRadius: 6, border: 'none', cursor: 'pointer' },
  card: { background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 24 },
  table: { width: '100%', borderCollapse: 'collapse' },
  thtd: { border: '1px solid #e5e7eb', padding: 8, textAlign: 'left' },
  emptyRow: { textAlign: 'center', padding: 12, color: '#6b7280' },
  modalOverlay: { position: 'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 },
  modalCard: { background:'#fff', padding:24, borderRadius:8, width:'400px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' },
  input: { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 12 },
  toggleGroup: { display:'flex', gap:12, marginBottom:12 },
  toggleButton: (active) => ({ flex:1, padding:'8px 0', borderRadius:6, border: active ? 'none' : '1px solid #d1d5db', background: active ? '#1f2937' : '#fff', color: active ? '#fff' : '#374151', cursor:'pointer', fontWeight:600 })
};

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={styles.emptyRow}>{text}</td>
  </tr>
);

export default function App() {
  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('stock');
  const [selectedStockRoom, setSelectedStockRoom] = useState('All Stock Rooms');

  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formItem, setFormItem] = useState({ item_name: '', brand: '', price: '' });
  const [formTransaction, setFormTransaction] = useState({ date:'', item_id:'', brand:'', type:'IN', quantity:'' });

  // ================= STOCK ROOMS =================
  const stockRooms = [
    'All Stock Rooms','L1','L2 Room 1','L2 Room 2','L2 Room 3','L2 Room 4','L3','L5','L6','L7','Maintenance Bodega 1','Maintenance Bodega 2','Maintenance Bodega 3','SKI Stock Room','Quarry Stock Room'
  ];

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData(){
    const { data: itemsData } = await supabase.from('items').select('*').eq('deleted', false);
    const { data: deletedItemsData } = await supabase.from('items').select('*').eq('deleted', true);
    const { data: tx } = await supabase.from('inventory_transactions').select('*, items(item_name)').eq('deleted', false).order('date', { ascending:false });
    const { data: deletedTx } = await supabase.from('inventory_transactions').select('*, items(item_name)').eq('deleted', true).order('deleted_at', { ascending:false });

    setItems(itemsData||[]);
    setDeletedItems(deletedItemsData||[]);
    setTransactions(tx||[]);
    setDeletedTransactions(deletedTx||[]);
  }

  useEffect(()=>{ if(session) loadData(); },[session]);

  // ================= HANDLE FORM =================
  const handleItemChange = (key, value) => setFormItem(prev=>({...prev,[key]:value}));
  const handleTransactionChange = (key, value) => setFormTransaction(prev=>({...prev,[key]:value}));

  const submitItem = async ()=>{
    if(editingItem){
      await supabase.from('items').update(formItem).eq('id', editingItem.id);
      setEditingItem(null);
    } else {
      await supabase.from('items').insert([formItem]);
    }
    setShowAddItem(false);
    setFormItem({ item_name:'', brand:'', price:'' });
    loadData();
  };

  const submitTransaction = async ()=>{
    if(!formTransaction.item_id || !formTransaction.quantity || !formTransaction.date) return alert('Fill all fields');
    await supabase.from('inventory_transactions').insert([formTransaction]);
    setShowAddTransaction(false);
    setFormTransaction({ date:'', item_id:'', brand:'', type:'IN', quantity:'' });
    loadData();
  };

  const softDeleteItem = async (id)=>{
    await supabase.from('items').update({ deleted:true }).eq('id',id);
    loadData();
  };

  if(!session) return (
    <div style={{ padding:40, textAlign:'center' }}>
      <h2>Inventory Login</h2>
      <button style={{...styles.newButton}} onClick={()=>supabase.auth.signInWithOAuth({provider:'google'})}>Login with Google</button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2>Lago De Oro</h2>
        <button style={styles.sidebarButton(activeTab==='stock')} onClick={()=>setActiveTab('stock')}>📦 Stock</button>
        <button style={styles.sidebarButton(activeTab==='transactions')} onClick={()=>setActiveTab('transactions')}>📄 Transactions</button>
        <button style={styles.sidebarButton(activeTab==='deleted')} onClick={()=>setActiveTab('deleted')}>🗑️ Deleted History</button>
        <button style={styles.sidebarButton(activeTab==='report')} onClick={()=>setActiveTab('report')}>📊 Monthly Report</button>

        {/* Stock Room Selector */}
        <div style={{ marginTop: 24 }}>
          <label>Stock Room:</label>
          <select value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
            {stockRooms.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>

      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <div style={styles.header}>
          <h1>{activeTab==='stock'?'Stock Inventory':activeTab==='transactions'?'Transactions':activeTab==='deleted'?'Deleted History':'Monthly Report'}</h1>
          <div>
            <button style={styles.newButton} onClick={()=>{
              if(selectedStockRoom==='All Stock Rooms') return alert('Select stock room first');
              setShowNewMenu(prev=>!prev);
            }}>NEW</button>

            {/* New Options Menu */}
            {showNewMenu && (
              <div style={{position:'absolute', background:'#fff', padding:12, borderRadius:6, boxShadow:'0 4px 12px rgba(0,0,0,0.15)', marginTop:8}}>
                <button style={{display:'block', marginBottom:8}} onClick={()=>{setShowAddItem(true); setShowNewMenu(false);}}>Add New Item</button>
                <button style={{display:'block'}} onClick={()=>{setShowAddTransaction(true); setShowNewMenu(false);}}>Add New Transaction</button>
              </div>
            )}
          </div>
        </div>

        {/* ================= STOCK TAB ================= */}
        {activeTab==='stock' && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Item Name</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Price</th>
                  <th style={styles.thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length===0 && emptyRow(4,'No items')}
                {items.map(i=>(
                  <tr key={i.id}>
                    <td style={styles.thtd}>{i.item_name}</td>
                    <td style={styles.thtd}>{i.brand}</td>
                    <td style={styles.thtd}>₱{i.price}</td>
                    <td style={styles.thtd}>
                      <button onClick={()=>{setEditingItem(i); setFormItem({ item_name:i.item_name, brand:i.brand, price:i.price }); setShowAddItem(true);}}>✏️</button>
                      <button onClick={()=>softDeleteItem(i.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TRANSACTIONS TAB ================= */}
        {activeTab==='transactions' && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Date</th>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Type</th>
                  <th style={styles.thtd}>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length===0 && emptyRow(5,'No transactions')}
                {transactions.map(t=>(
                  <tr key={t.id}>
                    <td style={styles.thtd}>{t.date}</td>
                    <td style={styles.thtd}>{t.items?.item_name}</td>
                    <td style={styles.thtd}>{t.brand}</td>
                    <td style={styles.thtd}>{t.type}</td>
                    <td style={styles.thtd}>{t.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= DELETED HISTORY TAB ================= */}
        {activeTab==='deleted' && (
          <div style={styles.card}>
            <h3>Deleted Items</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Item Name</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Price</th>
                </tr>
              </thead>
              <tbody>
                {deletedItems.length===0 && emptyRow(3,'No deleted items')}
                {deletedItems.map(i=>(
                  <tr key={i.id}>
                    <td style={styles.thtd}>{i.item_name}</td>
                    <td style={styles.thtd}>{i.brand}</td>
                    <td style={styles.thtd}>₱{i.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ================= MODALS ================= */}
      {(showAddItem) && (
        <div style={styles.modalOverlay} onClick={()=>setShowAddItem(false)}>
          <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>
            <h3>{editingItem?'Edit Item':'Add New Item'}</h3>
            <input style={styles.input} placeholder='Item Name' value={formItem.item_name} onChange={e=>handleItemChange('item_name',e.target.value)} />
            <input style={styles.input} placeholder='Brand' value={formItem.brand} onChange={e=>handleItemChange('brand',e.target.value)} />
            <input style={styles.input} placeholder='Price' type='number' value={formItem.price} onChange={e=>handleItemChange('price',e.target.value)} />
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button onClick={()=>setShowAddItem(false)}>Cancel</button>
              <button onClick={submitItem}>{editingItem?'Update':'Submit'}</button>
            </div>
          </div>
        </div>
      )}

      {(showAddTransaction) && (
        <div style={styles.modalOverlay} onClick={()=>setShowAddTransaction(false)}>
          <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>
            <h3>Add Transaction</h3>
            <input style={styles.input} type='date' value={formTransaction.date} onChange={e=>handleTransactionChange('date', e.target.value)} />
            <input style={styles.input} list='items-list' placeholder='Select item' value={formTransaction.item_id} onChange={e=>handleTransactionChange('item_id', e.target.value)} />
            <datalist id='items-list'>
              {items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}
            </datalist>
            <input style={styles.input} placeholder='Brand' value={formTransaction.brand} onChange={e=>handleTransactionChange('brand', e.target.value)} />
            <div style={styles.toggleGroup}>
              <button style={styles.toggleButton(formTransaction.type==='IN')} onClick={()=>handleTransactionChange('type','IN')}>IN</button>
              <button style={styles.toggleButton(formTransaction.type==='OUT')} onClick={()=>handleTransactionChange('type','OUT')}>OUT</button>
            </div>
            <input style={styles.input} type='number' placeholder='Quantity' value={formTransaction.quantity} onChange={e=>handleTransactionChange('quantity', e.target.value)} />
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button onClick={()=>setShowAddTransaction(false)}>Cancel</button>
              <button onClick={submitTransaction}>Submit</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
