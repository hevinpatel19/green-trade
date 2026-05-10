import { createContext, useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import UserContext from "./UserContext";
import { API_URL } from "../utils/api";

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user?.token) {
      setBalance(0);
      setTransactions([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setBalance(data.balance);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Wallet fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  // Auto-fetch on login/user change
  useEffect(() => {
    if (user?.token) {
      fetchBalance();
    } else {
      setBalance(0);
      setTransactions([]);
    }
  }, [user?.token, fetchBalance]);

  return (
    <WalletContext.Provider value={{ balance, setBalance, transactions, setTransactions, loading, fetchBalance }}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
