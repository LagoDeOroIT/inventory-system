
          )}
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                    <th style={thtd}>Volume Pack</th>
                <th style={thtd}>Current Stock</th>
                <th style={thtd}>Unit Price</th>
                <th style={thtd}>Stock Value</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockInventory.length === 0 && emptyRow(6, "No stock data")}
              {stockInventory.map(i => (
                <tr key={i.id} style={i.stock <= 5 ? { background: "#fee2e2" } : undefined}>
                  <td style={thtd}>{i.item_name}</td>
<td style={thtd}>{i.brand || "—"}</td>
<td style={thtd}>{i.volume_pack || "—"}</td>
<td style={thtd}>{i.stock}</td>
<td style={thtd}>₱{Number(i.unit_price || 0).toFixed(2)}</td>
<td style={thtd}>₱{(i.stock * (i.unit_price || 0)).toFixed(2)}</td>
<td style={thtd}>
  <button
    style={{ marginRight: 6 }}
    onClick={() => openConfirm("Edit this item?", () => {
      setIsEditingItem(true);
      setStockEditItem(i);
      setEditingItemId(i.id);
      setNewItem({
        item_name: i.item_name,
        brand: i.brand || "",
        unit_price: i.unit_price,
      });
      setShowAddItem(true);
    })}
  >✏️ Edit</button>
  <button
    onClick={() => openConfirm("Permanently delete this item? This cannot be undone.", async () => {
      await supabase.from("items").delete().eq("id", i.id);
      loadData();
    })}
  >🗑️ Delete</button>
</td>
</tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
