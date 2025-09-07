import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../hooks/store';
import { Table } from './common/Table';
import { Modal } from './common/Modal';
import type { Transaction } from '../types';
import { IconDownload } from './icons/IconComponents';

const TransactionDetails: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    return (
        <div className="space-y-4">
            <div>
                <h4 className="font-bold text-lg">Détails de la Transaction</h4>
                <p><strong>ID:</strong> {transaction.id}</p>
                <p><strong>Date:</strong> {new Date(transaction.date).toLocaleString('fr-FR')}</p>
                <p><strong>Vendeur ID:</strong> {transaction.sellerId}</p>
                <p><strong>Paiement:</strong> {transaction.paymentMethod}</p>
            </div>
            <div>
                <h4 className="font-bold text-lg">Articles</h4>
                <ul className="divide-y divide-border">
                    {transaction.items.map((item, index) => (
                        <li key={index} className="py-2 flex justify-between">
                            <span>{item.productName} x {item.quantity}</span>
                            <span>{(item.price * item.quantity).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="border-t border-border pt-2 mt-2 text-right space-y-1">
                <p><strong>Sous-total:</strong> {(transaction.total - transaction.tax).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                <p><strong>TVA:</strong> {transaction.tax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                <p className="text-xl font-bold"><strong>Total:</strong> {transaction.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
            </div>
        </div>
    );
}

export const TransactionsView: React.FC = () => {
    const transactions = useAppStore(state => state.transactions);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (transactionDate < start) return false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (transactionDate > end) return false;
            }
            
            const lowerCaseSearch = searchTerm.toLowerCase();
            if (lowerCaseSearch) {
                const matchesId = t.id.toLowerCase().includes(lowerCaseSearch);
                const matchesMethod = t.paymentMethod.toLowerCase().includes(lowerCaseSearch);
                const matchesItem = t.items.some(item => 
                    item.productName.toLowerCase().includes(lowerCaseSearch)
                );
                if (!matchesId && !matchesMethod && !matchesItem) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, searchTerm, startDate, endDate]);

    const columns = useMemo(() => [
        { header: 'ID Transaction', accessor: (t: Transaction) => <span className="font-mono text-xs">{t.id.substring(0, 8)}...</span> },
        { header: 'Date', accessor: (t: Transaction) => new Date(t.date).toLocaleString('fr-FR') },
        { 
            header: 'Articles', 
            accessor: (t: Transaction) => (
                <div>
                    {t.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-xs truncate" title={`${item.quantity} x ${item.productName}`}>
                            {item.quantity} x {item.productName}
                        </div>
                    ))}
                    {t.items.length > 2 && (
                        <div className="text-xs text-text-secondary">et {t.items.length - 2} autre(s)...</div>
                    )}
                </div>
            )
        },
        { header: 'Montant Total', accessor: (t: Transaction) => <span className="font-semibold">{t.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span> },
        { header: 'Méthode', accessor: (t: Transaction) => t.paymentMethod },
    ], []);

    const handleRowClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
    };

    const handleCloseModal = () => {
        setSelectedTransaction(null);
    }
    
    const handleExport = useCallback(() => {
        if (filteredTransactions.length === 0) {
            alert("Il n'y a aucune transaction à exporter pour les filtres sélectionnés.");
            return;
        }
        
        const headers = ['ID Transaction', 'Date', 'Articles', 'Quantité Totale', 'Montant Total', 'Méthode de Paiement', 'Vendeur ID'];
        const csvRows = [headers.join(';')];

        filteredTransactions.forEach(t => {
            const row = [
                t.id,
                new Date(t.date).toLocaleString('fr-FR'),
                `"${t.items.map(i => `${i.quantity} x ${i.productName}`).join(', ')}"`,
                t.items.reduce((sum, i) => sum + i.quantity, 0),
                t.total.toString().replace('.', ','),
                t.paymentMethod,
                t.sellerId
            ].join(';');
            csvRows.push(row);
        });
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `transactions-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [filteredTransactions]);


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-bold">Transactions</h2>
                 <button onClick={handleExport} disabled={filteredTransactions.length === 0} className="px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary font-semibold hover:bg-border transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                   <IconDownload size={16} /> Exporter CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-surface rounded-lg">
                <div className="md:col-span-1">
                    <label htmlFor="search" className="text-sm text-text-secondary">Rechercher</label>
                    <input
                        id="search"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ID, produit, méthode..."
                        className="w-full mt-1 bg-background border border-border rounded-md p-2"
                    />
                </div>
                <div>
                    <label htmlFor="start-date" className="text-sm text-text-secondary">Date de début</label>
                    <input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full mt-1 bg-background border border-border rounded-md p-2"
                    />
                </div>
                <div>
                    <label htmlFor="end-date" className="text-sm text-text-secondary">Date de fin</label>
                    <input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full mt-1 bg-background border border-border rounded-md p-2"
                    />
                </div>
            </div>

            <Table<Transaction>
                columns={columns}
                data={filteredTransactions}
                onRowClick={handleRowClick}
            />
            <Modal isOpen={!!selectedTransaction} onClose={handleCloseModal} title="Détails de la Transaction">
                {selectedTransaction && <TransactionDetails transaction={selectedTransaction} />}
            </Modal>
        </div>
    );
};