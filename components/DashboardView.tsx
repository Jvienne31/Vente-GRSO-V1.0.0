import React from 'react';
import { useAppStore } from '../hooks/store';
import { IconPOS, IconInventory, IconTransactions, IconDollarSign, IconPackage, IconAlertTriangle } from './icons/IconComponents';

interface DashboardViewProps {
    setActiveView: (view: 'pos' | 'inventory' | 'transactions') => void;
}

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

const QuickLink: React.FC<{ icon: React.ReactNode; title: string; onClick: () => void }> = ({ icon, title, onClick }) => (
    <button onClick={onClick} className="bg-surface p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center hover:bg-border transition-colors duration-200">
        {icon}
        <p className="mt-2 font-semibold text-text-primary">{title}</p>
    </button>
);


export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveView }) => {
    const products = useAppStore(state => state.products);
    const transactions = useAppStore(state => state.transactions);

    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    // FIX: Correctly check for low stock by iterating through product variants.
    // The `stock` and `lowStockThreshold` properties exist on variants, not directly on the product.
    const lowStockItems = products.filter(p => p.variants.some(v => v.stock <= v.lowStockThreshold)).length;
    const totalProducts = products.length;
    const recentTransactions = transactions.slice(0, 5);

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-text-primary">Tableau de Bord</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<IconDollarSign />} title="Revenu Total" value={totalRevenue} color="bg-green-500/20 text-green-400" />
                <StatCard icon={<IconPackage />} title="Produits en Stock" value={totalProducts.toString()} color="bg-blue-500/20 text-blue-400" />
                <StatCard icon={<IconAlertTriangle />} title="Alertes Stock Faible" value={lowStockItems.toString()} color="bg-yellow-500/20 text-yellow-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <QuickLink icon={<IconPOS size={32} />} title="Nouvelle Vente" onClick={() => setActiveView('pos')} />
                 <QuickLink icon={<IconInventory size={32} />} title="Gérer l'Inventaire" onClick={() => setActiveView('inventory')} />
                 <QuickLink icon={<IconTransactions size={32} />} title="Voir les Transactions" onClick={() => setActiveView('transactions')} />
            </div>

            <div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">Transactions Récentes</h3>
                <div className="bg-surface rounded-xl shadow-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-border/50">
                            <tr>
                                <th className="p-4 font-semibold">ID Transaction</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Montant</th>
                                <th className="p-4 font-semibold">Méthode</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.map((t, index) => (
                                <tr key={t.id} className={`border-t border-border ${index % 2 === 0 ? 'bg-surface' : 'bg-surface/50'}`}>
                                    <td className="p-4 text-sm text-text-secondary">{t.id}</td>
                                    <td className="p-4 text-sm">{new Date(t.date).toLocaleString('fr-FR')}</td>
                                    <td className="p-4 font-medium">{t.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                                    <td className="p-4 text-sm">{t.paymentMethod}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};