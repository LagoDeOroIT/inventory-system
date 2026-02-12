import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: { display: 'flex', fontFamily: 'Segoe UI, sans-serif', minHeight: '100vh', background: '#f3f4f6' },
  sidebar: { width: 220, background: '#111827', color: '#fff', display: 'flex', flexDirection: 'column', padding: 20 },
  sidebarItem: (active) => ({ padding: '12px 16px', marginBottom: 8, borderRadius: 6, cursor: 'pointer', background: active ? '#1f2937' : 'transparent', fontWeight: active ? 600 : 500 }),
  main: { flex: 1, padding: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  buttonPrimary: { background: '#1f2937', color: '#fff', padding: '10px 16px', borderRadius: 6, border: 'none', cursor: 'pointer' },
  buttonSecondary: { background: '#e5e7eb', color: '#374151', padding: '10px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', marginRight: 12 },
  table: { width: '100%', borderCollapse: 'collapse' },
  thtd: { border: '1px solid #e5e7eb', padding: 8, textAlign: 'left' },
  emptyRow: { textAlign: 'center', padding: 12, color: '#6b7280' },
  modalOverlay: { position: 'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 },
  modalCard: { background:'#fff', padding:24, borderRadius:8, width:'400px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' },
  toggleGroup: { display:'flex', gap:12, marginBottom:12 },
  toggleButton: (active) => ({ flex:1, padding:'8px 0', borderRadius:6, border: active ? 'none' : '1px solid #d1d5db', background: active ? '#1f2937' : '#fff', color: active ? '#fff' : '#374151', cursor:'pointer', fontWeight:600 }),
  stockRoomSelect: { marginBottom: 16, padding: '8px', borderRadius: 6, border: '1px solid #d1d5db' }
};

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={styles.emptyRow}>{text}</td>
  </tr>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('stock');

  const [showNewOptions, setShowNewOptions] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedStockRoom, setSelectedStockRoom] = useState('All Stock Rooms');

  const [formItem, setFormItem] = useState({ item_name: '', brand: '', price: '' });
  const [formTransaction, setFormTransaction] = useState({ date:'', item_id:'', brand:'', type:'IN', quantity:'' });

  const stockRooms = ["All Stock Rooms","L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  async function loadData() {
    const { data: itemsData } = await supabase.from('items').select('*');
    const { data: tx } = await supabase.from('inventory_transactions').select('*, items(item_name, brand)').eq('deleted', false).order('date', {ascending:false});
    const { data: deletedTx } = await supabase.from('inventory_transactions').select('*, items(item_name, brand)').eq('deleted', true).order('deleted_at', {ascending:false});
    setItems(itemsData || []);
    setTransactions(tx || []);
    setDeletedTransactions(deletedTx || []);
  }

  useEffect(() => { if(session) loadData(); }, [session]);

  const filteredTransactions = transactions.filter(t => selectedStockRoom==='All Stock Rooms' || t.location===selectedStockRoom);
  const stockInventory = items.map(i => {
    const related = transactions.filter(t=>t.item_id===i.id);
    const stock = related.reduce((sum,t)=>sum+(t.type==='IN'?Number(t.quantity):-Number(t.quantity)),0);
    return { id:i.id, item_name:i.item_name, brand:i.brand, unit_price:Number(i.price||0), stock };
  });

  const handleFormItemChange = (key, value) => setFormItem(prev=>({...prev,[key]:value}));
  const handleFormTransactionChange = (key, value) => {
    if(key==='item_id'){ 
      const sel = items.find(it=>it.id===value); 
      setFormTransaction(prev=>({...prev, item_id:value, brand: sel?.brand||'' }));
    } else {
      setFormTransaction(prev=>({...prev,[key]:value}));
    }
  };

  const handleSubmitItem = async () => {
    if(!formItem.item_name||!formItem.brand||!formItem.price) return alert('Fill all fields');
    await supabase.from('items').insert([{...formItem, location: selectedStockRoom}]);
    setShowItemModal(false);
    setFormItem({item_name:'', brand:'', price:''});
    loadData();
  };

  const handleSubmitTransaction = async () => {
    if(!formTransaction.date||!formTransaction.item_id||!formTransaction.brand||!formTransaction.quantity) return alert('Fill all fields');
    // Check if brand matches item
    const item = items.find(i=>i.id===formTransaction.item_id);
    if(item && item.brand!==formTransaction.brand){
      if(window.confirm('Brand not found. Add new item?')){
        setFormItem({item_name:item.item_name, brand:formTransaction.brand, price:''});
        setShowItemModal(true);
        return;
      }
    }
    await supabase.from('inventory_transactions').insert([{...formTransaction}]);
    setShowTransactionModal(false);
    setFormTransaction({ date:'', item_id:'', brand:'', type:'IN', quantity:'' });
    loadData();
  };

  if(!session) return (
    <div style={{padding:40, textAlign:'center'}}>
      <h2>Inventory Login</h2>
      <button style={styles.buttonPrimary} onClick={()=>supabase.auth.signInWithOAuth({provider:'google'})}>Login with Google</button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={{marginBottom:24}}>Inventory System</h2>
        {['stock','transactions','deleted','report'].map(tab=>(
          <div key={tab} style={styles.sidebarItem(activeTab===tab)} onClick={()=>setActiveTab(tab)}>
            {tab==='stock'?'📦 Stock Inventory':tab==='transactions'?'📄 Transactions':tab==='deleted'?'🗑️ Deleted History':'📊 Monthly Report'}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <select style={styles.stockRoomSelect} value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
              {stockRooms.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button style={styles.buttonPrimary} onClick={()=>setShowNewOptions(!showNewOptions)}>New ⬇️</button>
        </div>

        {showNewOptions && (
          <div style={{marginBottom:16}}>
            <button style={{...styles.buttonPrimary, marginRight:12}} onClick={()=>{setShowItemModal(true); setShowNewOptions(false);}}>Add New Item</button>
            <button style={styles.buttonPrimary} onClick={()=>{setShowTransactionModal(true); setShowNewOptions(false);}}>Add Transaction</button>
          </div>
        )}

        {/* Stock Inventory Tab */}
        {activeTab==='stock' && (
          <div>
            <h2>📦 Stock Inventory</h2>
            <div style={{maxHeight:400, overflowY:'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thtd}>Available Stock</th>
                    <th style={styles.thtd}>Item Name</th>
                    <th style={styles.thtd}>Brand</th>
                    <th style={styles.thtd}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {stockInventory.length===0 && emptyRow(4,'No stock')}
                  {stockInventory.map(i=>(
                    <tr key={i.id} style={i.stock<=5?{background:'#fee2e2'}:{}}>
                      <td style={styles.thtd}>{i.stock}</td>
                      <td style={styles.thtd}>{i.item_name}</td>
                      <td style={styles.thtd}>{i.brand}</td>
                      <td style={styles.thtd}>₱{i.unit_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab==='transactions' && (
          <div>
            <h2>📄 Transactions</h2>
            <div style={{maxHeight:400, overflowY:'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thtd}>Date</th>
                    <th style={styles.thtd}>Item</th>
                    <th style={styles.thtd}>Brand</th>
                    <th style={styles.thtd}>Type</th>
                    <th style={styles.thtd}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length===0 && emptyRow(5,'No transactions')}
                  {filteredTransactions.map(t=>(
                    <tr key={t.id}>
                      <td style={styles.thtd}>{t.date}</td>
                      <td style={styles.thtd}>{t.items?.item_name}</td>
                      <td style={styles.thtd}>{t.items?.brand}</td>
                      <td style={styles.thtd}>{t.type}</td>
                      <td style={styles.thtd}>{t.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Deleted History Tab */}
        {activeTab==='deleted' && (
          <div>
            <h2>🗑️ Deleted History</h2>
            <div style={{maxHeight:400, overflowY:'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thtd}>Date</th>
                    <th style={styles.thtd}>Item</th>
                    <th style={styles.thtd}>Brand</th>
                    <th style={styles.thtd}>Type</th>
                    <th style={styles.thtd}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedTransactions.length===0 && emptyRow(5,'No deleted transactions')}
                  {deletedTransactions.map(t=>(
                    <tr key={t.id}>
                      <td style={styles.thtd}>{t.date}</td>
                      <td style={styles.thtd}>{t.items?.item_name}</td>
                      <td style={styles.thtd}>{t.items?.brand}</td>
                      <td style={styles.thtd}>{t.type}</td>
                      <td style={styles.thtd}>{t.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly Report Tab */}
        {activeTab==='report' && (
          <div>
            <h2>📊 Monthly Report</h2>
            <p>Coming Soon...</p>
          </div>
        )}

      </div>

      {/* Add Item Modal */}
      {showItemModal && (
        <div style={styles.modalOverlay} onClick={()=>setShowItemModal(false)}>
          <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>
            <h3>New Item</h3>
            <input style={{...styles.stockRoomSelect, marginBottom:12}} placeholder="Item Name" value={formItem.item_name} onChange={e=>handleFormItemChange('item_name', e.target.value)} />
            <input style={{...styles.stockRoomSelect, marginBottom:12}} placeholder="Brand" value={formItem.brand} onChange={e=>handleFormItemChange('brand', e.target.value)} />
            <input style={{...styles.stockRoomSelect, marginBottom:12}} placeholder="Price" type="number" value={formItem.price} onChange={e=>handleFormItemChange('price', e.target.value)} />
            <div style={{display:'flex', justifyContent:'flex-end'}}>
              <button style={styles.buttonSecondary} onClick={()=>setShowItemModal(false)}>Cancel</button>
              <button style={styles.buttonPrimary} onClick={handleSubmitItem}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTransactionModal && (
        <div style={styles.modalOverlay} onClick={()=>setShowTransactionModal(false)}>
          <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>
            <h3>New Transaction</h3>
            <input style={{...styles.stockRoomSelect, marginBottom:12}} type="date" value={formTransaction.date} onChange={e=>handleFormTransactionChange('date', e.target.value)} />
            <input style={{...styles.stockRoomSelect, marginBottom:12}} list="items-list" placeholder="Select Item" value={formTransaction.item_id} onChange={e=>handleFormTransactionChange('item_id', e.target.value)} />
            <datalist id="items-list">
              {items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}
            </datalist>
            <input style={{...styles.stockRoomSelect, marginBottom:12}} placeholder="Brand" value={formTransaction.brand} onChange={e=>handleFormTransactionChange('brand', e.target.value)} />
            <div style={styles.toggleGroup}>
              <button style={styles.toggleButton(formTransaction.type==='IN')} onClick={()=>handleFormTransactionChange('type','IN')}>IN</button>
              <button style={styles.toggleButton(formTransaction.type==='OUT')} onClick={()=>handleFormTransactionChange('type','OUT')}>OUT</button>
            </div>
            <input style={{...styles.stockRoomSelect, marginBottom:12}} type="number" placeholder="Quantity" value={formTransaction.quantity} onChange={e=>handleFormTransactionChange('quantity', e.target.value)} />
            <div style={{display:'flex', justifyContent:'flex-end'}}>
              <button style={styles.buttonSecondary} onClick={()=>setShowTransactionModal(false)}>Cancel</button>
              <button style={styles.buttonPrimary} onClick={handleSubmitTransaction}>Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
