import React from "react";

export default function Transactions(props) {
  const {
    inTransactions,
    outTransactions,
    inSearch,
    setInSearch,
    outSearch,
    setOutSearch,
    styles,
    formatNumber,
    capitalizeWords,
    displayBrand,
    menuRefs,
    openMenuId,
    setOpenMenuId,
    setForm,
    setModalType,
    setShowModal,
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
        alignItems: "stretch"
      }}
    >

      {/* ================= IN TRANSACTIONS ================= */}
      <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        height: "520px"
      }}>
        <h2>IN Transactions</h2>

        <input
          style={{ ...styles.input, marginBottom: 10 }}
          placeholder="Search IN transactions..."
          value={inSearch}
          onChange={(e) => setInSearch(e.target.value)}
        />

        <div style={{ flex: 1, overflowY: "auto", marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Brand</th>
                <th>Qty</th>
                <th>Total Price</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {inTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                    No transactions found
                  </td>
                </tr>
              ) : (
                inTransactions.map((i) => (
                  <tr key={i.id}>
                    <td>{i.date}</td>
                    <td>{capitalizeWords(i.items?.item_name)}</td>
                    <td>{displayBrand(i.items?.brand)}</td>
                    <td>{formatNumber(i.quantity)}</td>
                    <td>
                      ₱{Number(i.quantity * (i.unit_price || i.items?.unit_price || 0))
                        .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ position: "relative", textAlign: "center" }}>
                      <div
                        className="action-menu"
                        ref={(el) => (menuRefs.current["in-" + i.id] = el)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === "in-" + i.id ? null : "in-" + i.id);
                          }}
                        >
                          ⋮
                        </button>

                        {openMenuId === "in-" + i.id && (
                          <div style={{
                            position: "absolute",
                            right: 0,
                            top: 28,
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
                                setForm(i);
                                setModalType("transaction");
                                setShowModal(true);
                                setOpenMenuId(null);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              style={{ ...menuItemStyle, color: "#ef4444" }}
                              onClick={() => {
                                setConfirmAction({ type: "deleteTx", data: i });
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

      {/* ================= OUT TRANSACTIONS ================= */}
      <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        height: "520px"
      }}>
        <h2>OUT Transactions</h2>

        <input
          style={{ ...styles.input, marginBottom: 10 }}
          placeholder="Search OUT transactions..."
          value={outSearch}
          onChange={(e) => setOutSearch(e.target.value)}
        />

        <div style={{ flex: 1, overflowY: "auto", marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Brand</th>
                <th>Qty</th>
                <th>Total Price</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {outTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                    No transactions found
                  </td>
                </tr>
              ) : (
                outTransactions.map((i) => (
                  <tr key={i.id}>
                    <td>{i.date}</td>
                    <td>{capitalizeWords(i.items?.item_name)}</td>
                    <td>{displayBrand(i.items?.brand)}</td>
                    <td>{formatNumber(i.quantity)}</td>
                    <td>
                      ₱{Number(i.quantity * (i.unit_price || i.items?.unit_price || 0))
                        .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ position: "relative", textAlign: "center" }}>
                      <div
                        className="action-menu"
                        ref={(el) => (menuRefs.current["out-" + i.id] = el)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === "out-" + i.id ? null : "out-" + i.id);
                          }}
                        >
                          ⋮
                        </button>

                        {openMenuId === "out-" + i.id && (
                          <div style={{
                            position: "absolute",
                            right: 0,
                            top: 28,
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
                                setForm(i);
                                setModalType("transaction");
                                setShowModal(true);
                                setOpenMenuId(null);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              style={{ ...menuItemStyle, color: "#ef4444" }}
                              onClick={() => {
                                setConfirmAction({ type: "deleteTx", data: i });
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
