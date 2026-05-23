import { useState, useEffect } from 'react';
import { Category, Transaction, FinanceData } from '../types';
import { getDefaultCategories } from '../utils';
import { db } from '../lib/firebase';
import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDoc
} from 'firebase/firestore';

const STORAGE_KEY = 'controle_financeiro_data_v1';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function getInitialSimulationData(): FinanceData {
  const initialCategories = getDefaultCategories();
  
  const startMarch = '2026-03';
  const startJan = '2026-01';
  const startMay = '2026-05';

  const initialTransactions: Transaction[] = [
    {
      id: 'tx-sim-1',
      title: 'Geladeira Inox (5 parcelas)',
      categoryId: 'cat-housing',
      type: 'installment',
      amount: 2500,
      installmentsCount: 5,
      startMonth: startMarch,
      date: '2026-03-05',
      comments: 'Compra realizada na promoção de aniversário da loja física. Garantia estendida inclusa.',
    },
    {
      id: 'tx-sim-2',
      title: 'Supermercado Mensal',
      categoryId: 'cat-food',
      type: 'single',
      amount: 620.50,
      startMonth: startMay,
      date: '2026-05-10',
      comments: 'Compras básicas para o mês no hipermercado.',
    },
    {
      id: 'tx-sim-3',
      title: 'Curso de Especialização Técnica',
      categoryId: 'cat-others',
      type: 'installment',
      amount: 1200,
      installmentsCount: 12,
      startMonth: startJan,
      date: '2026-01-15',
      comments: 'Curso online de automação para acelerar carreira laboral.',
    },
    {
      id: 'tx-sim-4',
      title: 'Fatura Boleto Internet Fibra',
      categoryId: 'cat-housing',
      type: 'single',
      amount: 119.90,
      startMonth: startMay,
      date: '2026-05-20',
      comments: 'Vence todo dia 20 de cada mês.',
    }
  ];

  return {
    categories: initialCategories,
    transactions: initialTransactions,
    salaries: {
      '2026-05': 5500,
    },
    defaultSalary: 5000,
    paidTransactions: {
      'tx-sim-4_2026-05': true,
    },
  };
}

export function useFinance() {
  const [syncKey, setSyncKey] = useState<string | null>(() => {
    const val = localStorage.getItem('finance_sync_key');
    if (val === 'LOCAL') return null;
    return val || 'S-GERAL';
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const currentUser = syncKey ? { uid: syncKey } as any : null;

  // Core internal state
  const [data, setData] = useState<FinanceData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.categories && parsed.transactions) {
          if (!parsed.paidTransactions) {
            parsed.paidTransactions = {};
          }
          return parsed;
        }
      } catch (e) {
        console.error('Erro ao ler do localStorage:', e);
      }
    }
    return getInitialSimulationData();
  });

  // Sync state reference to local storage on any state change when running locally
  useEffect(() => {
    if (!syncKey) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, syncKey]);

  // Firestore Sync Effect
  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeCategories = () => {};
    let unsubscribeTransactions = () => {};

    if (syncKey) {
      setLoading(true);
      const userId = syncKey;

      // Ensure User configuration document exists
      const userDocRef = doc(db, 'users', userId);
      const userDocPath = `users/${userId}`;

      const initUserAndData = async () => {
        try {
          const userSnap = await getDoc(userDocRef);
          if (!userSnap.exists()) {
            await setDoc(userDocRef, {
              uid: userId,
              defaultSalary: data.defaultSalary || 5000,
              salaries: data.salaries || { '2026-05': 5500 },
              paidTransactions: data.paidTransactions || {},
            });

            // Seed Categories in cloud
            const catsColRef = collection(db, 'users', userId, 'categories');
            const catsBatch = writeBatch(db);
            const currentCats = data.categories.length > 0 ? data.categories : getDefaultCategories();
            currentCats.forEach((cat) => {
              const docRef = doc(catsColRef, cat.id);
              catsBatch.set(docRef, { ...cat, userId });
            });
            await catsBatch.commit();

            // Seed Transactions in cloud
            const txsColRef = collection(db, 'users', userId, 'transactions');
            const txsBatch = writeBatch(db);
            const currentTxs = data.transactions;
            currentTxs.forEach((tx) => {
              const docRef = doc(txsColRef, tx.id);
              txsBatch.set(docRef, { ...tx, userId });
            });
            await txsBatch.commit();
          }
        } catch (err) {
          console.error('Error seeding data:', err);
        }

        // Real-time User preferences synchronization
        unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const docData = docSnap.data();
            setData((prev) => ({
              ...prev,
              defaultSalary: docData.defaultSalary ?? 5000,
              salaries: docData.salaries ?? {},
              paidTransactions: docData.paidTransactions ?? {},
            }));
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, userDocPath);
        });

        // Real-time categories synchronization
        const catsColRef = collection(db, 'users', userId, 'categories');
        const catsPath = `users/${userId}/categories`;

        unsubscribeCategories = onSnapshot(catsColRef, async (querySnap) => {
          const fetchedCats: Category[] = [];
          querySnap.forEach((doc) => {
            fetchedCats.push(doc.data() as Category);
          });

          if (fetchedCats.length === 0) {
            try {
              const defaultCats = getDefaultCategories();
              const batch = writeBatch(db);
              defaultCats.forEach((cat) => {
                const docRef = doc(catsColRef, cat.id);
                batch.set(docRef, { ...cat, userId });
              });
              await batch.commit();
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, catsPath);
            }
          } else {
            setData((prev) => ({
              ...prev,
              categories: fetchedCats,
            }));
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, catsPath);
        });

        // Real-time transactions synchronization
        const txsColRef = collection(db, 'users', userId, 'transactions');
        const txsPath = `users/${userId}/transactions`;

        unsubscribeTransactions = onSnapshot(txsColRef, (querySnap) => {
          const fetchedTxs: Transaction[] = [];
          querySnap.forEach((doc) => {
            fetchedTxs.push(doc.data() as Transaction);
          });
          setData((prev) => ({
            ...prev,
            transactions: fetchedTxs,
          }));
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, txsPath);
        });
      };

      initUserAndData();
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.categories && parsed.transactions) {
            setData(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Erro ao ler do localStorage:', e);
        }
      }
      setData(getInitialSimulationData());
      setLoading(false);
    }

    return () => {
      unsubscribeUser();
      unsubscribeCategories();
      unsubscribeTransactions();
    };
  }, [syncKey]);


  // CATEGORIES CRUD
  const addCategory = async (category: Omit<Category, 'id'>) => {
    const newCatCount = data.categories.length + 1;
    const newCatId = `cat-custom-${Date.now()}-${newCatCount}`;
    const newCat: Category = {
      ...category,
      id: newCatId,
    };

    if (currentUser) {
      const path = `users/${currentUser.uid}/categories/${newCatId}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'categories', newCatId), {
          ...newCat,
          userId: currentUser.uid,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setData((prev) => ({
        ...prev,
        categories: [...prev.categories, newCat],
      }));
    }
  };

  const updateCategory = async (id: string, updated: Omit<Category, 'id'>) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/categories/${id}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'categories', id), {
          ...updated,
          id,
          userId: currentUser.uid,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setData((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }));
    }
  };

  const deleteCategory = async (id: string) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/categories/${id}`;
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'categories', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setData((prev) => {
        const updatedTransactions = prev.transactions.map((tx) => {
          if (tx.categoryId === id) {
            return { ...tx, categoryId: 'cat-others' };
          }
          return tx;
        });
        return {
          ...prev,
          categories: prev.categories.filter((c) => c.id !== id),
          transactions: updatedTransactions,
        };
      });
    }
  };

  // TRANSACTIONS CRUD
  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const newTxId = `tx-${Date.now()}`;
    const newTx: Transaction = {
      ...tx,
      id: newTxId,
    };

    if (currentUser) {
      const path = `users/${currentUser.uid}/transactions/${newTxId}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'transactions', newTxId), {
          ...newTx,
          userId: currentUser.uid,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setData((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
    }
  };

  const updateTransaction = async (id: string, updated: Omit<Transaction, 'id'>) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/transactions/${id}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'transactions', id), {
          ...updated,
          id,
          userId: currentUser.uid,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...updated } : t)),
      }));
    }
  };

  const deleteTransaction = async (id: string) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/transactions/${id}`;
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setData((prev) => {
        const cleanedPaid = { ...prev.paidTransactions };
        Object.keys(cleanedPaid).forEach((key) => {
          if (key.startsWith(`${id}_`)) {
            delete cleanedPaid[key];
          }
        });

        return {
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
          paidTransactions: cleanedPaid,
        };
      });
    }
  };

  // PAID STATE TRIGGERS
  const togglePaidTransaction = async (transactionId: string, month: string) => {
    const key = `${transactionId}_${month}`;
    const updatedPaid = {
      ...(data.paidTransactions || {}),
      [key]: !(data.paidTransactions || {})[key],
    };

    if (currentUser) {
      const path = `users/${currentUser.uid}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          defaultSalary: data.defaultSalary,
          salaries: data.salaries,
          paidTransactions: updatedPaid,
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setData((prev) => {
        const currentPaid = prev.paidTransactions || {};
        return {
          ...prev,
          paidTransactions: {
            ...currentPaid,
            [key]: !currentPaid[key],
          },
        };
      });
    }
  };

  // SALARIES OPERATIONS
  const setSalaryForMonth = async (month: string, salary: number) => {
    const updatedSalaries = {
      ...(data.salaries || {}),
      [month]: salary,
    };

    if (currentUser) {
      const path = `users/${currentUser.uid}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          defaultSalary: data.defaultSalary,
          salaries: updatedSalaries,
          paidTransactions: data.paidTransactions || {},
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setData((prev) => ({
        ...prev,
        salaries: {
          ...prev.salaries,
          [month]: salary,
        },
      }));
    }
  };

  const updateDefaultSalary = async (salary: number) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          defaultSalary: salary,
          salaries: data.salaries,
          paidTransactions: data.paidTransactions || {},
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setData((prev) => ({
        ...prev,
        defaultSalary: salary,
      }));
    }
  };

  const updateCategoriesOrder = (reorderedCats: Category[]) => {
    setData((prev) => ({
      ...prev,
      categories: reorderedCats,
    }));
  };

  const connectSyncKey = async (key: string) => {
    if (!key || !key.trim()) return;
    const formattedKey = key.trim().toUpperCase();
    setLoading(true);
    setSyncError(null);

    try {
      const docRef = doc(db, 'users', formattedKey);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        // If the workspace does not exist in the cloud, initialize it with current local data
        await setDoc(docRef, {
          uid: formattedKey,
          defaultSalary: data.defaultSalary || 5000,
          salaries: data.salaries || {},
          paidTransactions: data.paidTransactions || {},
        });

        // Seed Categories in cloud
        const catsColRef = collection(db, 'users', formattedKey, 'categories');
        const catsBatch = writeBatch(db);
        data.categories.forEach((cat) => {
          catsBatch.set(doc(catsColRef, cat.id), { ...cat, userId: formattedKey });
        });
        await catsBatch.commit();

        // Seed Transactions in cloud
        const txsColRef = collection(db, 'users', formattedKey, 'transactions');
        const txsBatch = writeBatch(db);
        data.transactions.forEach((tx) => {
          txsBatch.set(doc(txsColRef, tx.id), { ...tx, userId: formattedKey });
        });
        await txsBatch.commit();
      }
      localStorage.setItem('finance_sync_key', formattedKey);
      setSyncKey(formattedKey);
    } catch (err: any) {
      console.error('Error connecting sync key:', err);
      setSyncError('Chave inválida ou erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const generateNewSyncKey = async () => {
    setLoading(true);
    setSyncError(null);
    
    const rand = Math.floor(100000 + Math.random() * 900000); 
    const newKey = `S-${rand}`;

    try {
      await setDoc(doc(db, 'users', newKey), {
        uid: newKey,
        defaultSalary: data.defaultSalary || 5000,
        salaries: data.salaries || {},
        paidTransactions: data.paidTransactions || {},
      });

      const catsCol = collection(db, 'users', newKey, 'categories');
      const catsBatch = writeBatch(db);
      data.categories.forEach((cat) => {
        catsBatch.set(doc(catsCol, cat.id), { ...cat, userId: newKey });
      });
      await catsBatch.commit();

      const txsCol = collection(db, 'users', newKey, 'transactions');
      const txsBatch = writeBatch(db);
      data.transactions.forEach((tx) => {
        txsBatch.set(doc(txsCol, tx.id), { ...tx, userId: newKey });
      });
      await txsBatch.commit();

      localStorage.setItem('finance_sync_key', newKey);
      setSyncKey(newKey);
    } catch (err: any) {
      console.error('Error generating sync key:', err);
      setSyncError('Não foi possível gerar uma nova chave na nuvem.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectSyncKey = async () => {
    setLoading(true);
    setSyncError(null);
    try {
      localStorage.setItem('finance_sync_key', 'LOCAL');
      setSyncKey(null);
      
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setData(JSON.parse(saved));
      } else {
        setData(getInitialSimulationData());
      }
    } catch (err: any) {
      console.error('Error disconnecting sync key:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetToSimulationData = () => {
    if (!currentUser) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  return {
    categories: data.categories,
    transactions: data.transactions,
    salaries: data.salaries,
    defaultSalary: data.defaultSalary,
    paidTransactions: data.paidTransactions || {},
    currentUser,
    loading,
    syncKey,
    syncError,
    connectSyncKey,
    generateNewSyncKey,
    disconnectSyncKey,
    togglePaidTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setSalaryForMonth,
    updateDefaultSalary,
    updateCategoriesOrder,
    resetToSimulationData,
  };
}
