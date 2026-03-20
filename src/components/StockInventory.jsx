import React from "react";

export default function StockInventory({
  items,
  selectedStockRoom,
  search,
  setSearch,
  handleAddItem,
  handleEditItem,
  handleDeleteItem
}) {
  return (
    <div style={{ flex: 1, padding: 20 }}>

      <h2>📦 Stock Inventory</h2>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search item..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: 8,
          width: "100%",
          marginBottom: 12
        }}
      />

      {/* TABLE */}
      <div>
        {items.length === 0 ? (
          <p>No items found.</p>
        ) : (
          items.map(item => (
            <div key={item.id} style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 10,
              borderBottom: "1px solid #ddd"
            }}>
              <div>
                <b>{item.item_name}</b>
                <div>Qty: {item.quantity}</div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleEditItem(item)}>Edit</button>
                <button onClick={() => handleDeleteItem(item)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
