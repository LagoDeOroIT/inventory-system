import React from "react";

export default function DeletedHistory(props) {
  const {
    deletedItems,
    deletedTransactions,
    deletedItemSearch,
    setDeletedItemSearch,
    deletedTxSearch,
    setDeletedTxSearch,
    styles,
    capitalizeWords,
    displayBrand,
    formatNumber,
    menuRefs,
    openMenuId,
    setOpenMenuId,
    setConfirmAction,
    menuItemStyle
  } = props;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden"
      }}
    >

      {/* ================= DELETED INVENTORY ================= */}
      <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        height: "520px",
      }}>
        <h2>Deleted Inventory</h2>

        <input
          style={{ ...styles.input, marginBottom: 10 }}
          placeholder="Search deleted items..."
          value={deletedItemSearch}
          onChange={(e) => setDeletedItemSearch(e.target.value)}
        />

        <div style={{ flex: 1, overflowY: "auto", marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
              <tr>
                <th>Item Name</th>
                <th>Brand</th>
                <th>Price</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {deletedItems.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 16 }}>
                    No deleted items
                  </td>
                </tr>
              ) : (
                deletedItems
                  .filter(
                    (item) =>
                      (item.item_name || "").toLowerCase().includes(deletedItemSearch.toLowerCase()) ||
                      (item.brand || "").toLowerCase().includes(deletedItemSearch.toLowerCase())
                  )
                  .sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at))
                  .map((i) => (
                    <tr key={i.id}>
                      <td>{capitalizeWords(i.item_name)}</td>
                      <td>{capitalizeWords(i.brand)}</td>
                      <td>
                        ₱{Number(i.unit_price || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2
                        })}
                      </td>

                      <td style={{ position: "relative", textAlign: "center" }}>
                        <div
                          ref={(el) => (menuRefs.current["delitem-" + i.id] = el)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === "delitem-" + i.id ? null : "delitem-" + i.id);
                            }}
                          >
                            ⋮
                          </button>

                          {openMenuId === "delitem-" + i.id && (
                            <div style={{
                              position: "absolute",
                              right: 0,
                              top: 30,
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              minWidth: 120,
                              display: "flex",
                              flexDirection: "column"
                            }}>
                              <button
                                style={menuItemStyle}
                                onClick={() => {
                                  setConfirmAction({ type: "restoreItem", data: i });
                                  setOpenMenuId(null);
                                }}
                              >
                                Restore
                              </button>

                              <button
                                style={{ ...menuItemStyle, color: "#ef4444" }}
                                onClick={() => {
                                  setConfirmAction({ type: "permanentDeleteItem", data: i });
                                  setOpenMenuId(null);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= DELETED TRANSACTIONS ================= */}
      <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        height: "520px",
      }}>
        <h2>Deleted Transactions</h2>

        <input
          style={{ ...styles.input, marginBottom: 10 }}
          placeholder="Search deleted transactions..."
          value={deletedTxSearch}
          onChange={(e) => setDeletedTxSearch(e.target.value)}
        />

        <div style={{ flex: 1, overflowY: "auto", marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Brand</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Total Price</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {deletedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 16 }}>
                    No deleted transactions
                  </td>
                </tr>
              ) : (
                deletedTransactions
                  .filter(
                    (t) =>
                      (t.items?.item_name || "").toLowerCase().includes(deletedTxSearch.toLowerCase()) ||
                      (t.items?.brand || "").toLowerCase().includes(deletedTxSearch.toLowerCase())
                  )
                  .sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at))
                  .map((i) => (
                    <tr key={i.id}>
                      <td>{i.date}</td>
                      <td>{capitalizeWords(i.items?.item_name)}</td>
                      <td>{displayBrand(i.items?.brand)}</td>
                      <td>{i.type}</td>
                      <td>{formatNumber(i.quantity)}</td>
                      <td>
                        ₱{Number(
                          i.quantity * (i.unit_price || i.items?.unit_price || 0)
                        ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td style={{ position: "relative", textAlign: "center" }}>
                        <div
                          ref={(el) => (menuRefs.current["deltx-" + i.id] = el)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === "deltx-" + i.id ? null : "deltx-" + i.id);
                            }}
                          >
                            ⋮
                          </button>

                          {openMenuId === "deltx-" + i.id && (
                            <div style={{
                              position: "absolute",
                              right: 0,
                              top: 30,
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              minWidth: 120,
                              display: "flex",
                              flexDirection: "column"
                            }}>
                              <button
                                style={menuItemStyle}
                                onClick={() => {
                                  setConfirmAction({ type: "restoreTx", data: i });
                                  setOpenMenuId(null);
                                }}
                              >
                                Restore
                              </button>

                              <button
                                style={{ ...menuItemStyle, color: "#ef4444" }}
                                onClick={() => {
                                  setConfirmAction({ type: "permanentDeleteTx", data: i });
                                  setOpenMenuId(null);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
