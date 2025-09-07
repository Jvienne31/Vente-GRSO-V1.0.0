import React, { useMemo, useState, useCallback } from 'react';
import { useAppStore } from '../hooks/store';
import { IconDollarSign, IconPackage, IconTransactions, IconDownload } from './icons/IconComponents';
import { Table } from './common/Table';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string }> = ({ icon, title, value, color }) => (
    <div className="bg-surface p-6 rounded-xl shadow-lg flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-text-secondary text-sm">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
    </div>
);

type SalesData = {
    id: string;
    name: string;
    size: string;
    quantity: number;
    revenue: number;
}

type CategorySalesData = {
    id: string;
    category: string;
    quantity: number;
    revenue: number;
}


export const SalesReportView: React.FC = () => {
    const transactions = useAppStore(state => state.transactions);
    const products = useAppStore(state => state.products);
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
            return true;
        });
    }, [transactions, startDate, endDate]);

    const reportData = useMemo(() => {
        const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
        const totalTransactions = filteredTransactions.length;
        const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        const productMap = new Map(products.map(p => [p.id, p]));
        
        const productSales: { [key: string]: SalesData } = {};
        const categorySales: { [key: string]: { category: string; quantity: number; revenue: number; } } = {};

        filteredTransactions.forEach(t => {
            t.items.forEach(item => {
                // Aggregate by product variant
                const productKey = `${item.productId}-${item.size}`;
                if (!productSales[productKey]) {
                    productSales[productKey] = { id: productKey, name: item.productName, size: item.size, quantity: 0, revenue: 0 };
                }
                productSales[productKey].quantity += item.quantity;
                productSales[productKey].revenue += item.price * item.quantity;

                // Aggregate by category
                const product = productMap.get(item.productId);
                if (product) {
                    const category = product.category;
                    if (!categorySales[category]) {
                        categorySales[category] = { category, quantity: 0, revenue: 0 };
                    }
                    categorySales[category].quantity += item.quantity;
                    categorySales[category].revenue += item.price * item.quantity;
                }
            });
        });

        const aggregatedSales = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
        
        const aggregatedCategorySales = Object.values(categorySales)
            .map(c => ({ ...c, id: c.category }))
            .sort((a, b) => b.revenue - a.revenue);

        return {
            totalRevenue,
            totalTransactions,
            averageTransactionValue,
            aggregatedSales,
            aggregatedCategorySales
        };
    }, [filteredTransactions, products]);
    
    const handleExport = useCallback(() => {
        if (reportData.aggregatedSales.length === 0) {
            alert("Aucune donnée de vente à exporter pour la période sélectionnée.");
            return;
        }
        const headers = ['Produit', 'Taille', 'Quantité Vendue', 'Revenu Total'];
        const csvRows = [headers.join(';')];
        reportData.aggregatedSales.forEach(item => {
            const row = [item.name, item.size, item.quantity, item.revenue.toString().replace('.', ',')].join(';');
            csvRows.push(row);
        });
        const csvContent = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `rapport-ventes-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [reportData.aggregatedSales]);
    
     const columns = useMemo(() => [
        { header: 'Produit', accessor: (item: SalesData) => item.name },
        { header: 'Taille', accessor: (item: SalesData) => item.size },
        { header: 'Quantité Vendue', accessor: (item: SalesData) => item.quantity },
        { header: 'Revenu Total', accessor: (item: SalesData) => <span className="font-semibold">{item.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span> },
    ], []);
    
    const categoryColumns = useMemo(() => [
        { header: 'Catégorie', accessor: (item: CategorySalesData) => item.category },
        { header: 'Quantité Vendue', accessor: (item: CategorySalesData) => item.quantity },
        { header: 'Revenu Total', accessor: (item: CategorySalesData) => <span className="font-semibold">{item.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span> },
    ], []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-bold">Rapports de Ventes</h2>
                 <button onClick={handleExport} disabled={reportData.aggregatedSales.length === 0} className="px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary font-semibold hover:bg-border transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                   <IconDownload size={16} /> Exporter CSV
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface rounded-lg">
                <div>
                    <label htmlFor="start-date" className="text-sm text-text-secondary">Date de début</label>
                    <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full mt-1 bg-background border border-border rounded-md p-2" />
                </div>
                <div>
                    <label htmlFor="end-date" className="text-sm text-text-secondary">Date de fin</label>
                    <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full mt-1 bg-background border border-border rounded-md p-2" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<IconDollarSign />} title="Revenu Total" value={reportData.totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} color="bg-green-500/20 text-green-400" />
                <StatCard icon={<IconTransactions />} title="Transactions" value={reportData.totalTransactions.toString()} color="bg-purple-500/20 text-purple-400" />
                <StatCard icon={<IconPackage />} title="Panier Moyen" value={reportData.averageTransactionValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} color="bg-blue-500/20 text-blue-400" />
            </div>

            <div className="animate-fade-in">
                <h3 className="text-2xl font-bold mb-4">Détail des Ventes par Catégorie</h3>
                <Table<CategorySalesData> columns={categoryColumns} data={reportData.aggregatedCategorySales} />
            </div>

            <div className="animate-fade-in">
                <h3 className="text-2xl font-bold mb-4">Détail des Ventes par Produit</h3>
                <Table<SalesData> columns={columns} data={reportData.aggregatedSales} />
            </div>
        </div>
    );
};