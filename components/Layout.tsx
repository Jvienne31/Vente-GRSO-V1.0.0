// FIX: Add content for Layout.tsx to provide the main application shell.
import React, { useState, useMemo, useCallback } from 'react';
import type { User } from '../types';
import { Role } from '../types';
import { DashboardView } from './DashboardView';
import { POSView } from './POSView';
import { InventoryView } from './InventoryView';
import { TransactionsView } from './TransactionsView';
import { SalesReportView } from './SalesReportView';
import { BackupRestoreView } from './BackupRestoreView';
import { IconPOS, IconInventory, IconTransactions, IconDollarSign, IconPackage, IconDownload } from './icons/IconComponents';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

type View = 'dashboard' | 'pos' | 'inventory' | 'transactions' | 'reports' | 'backup';

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
            isActive
                ? 'bg-primary text-white font-semibold shadow-md'
                : 'text-text-secondary hover:bg-border hover:text-text-primary'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);


export const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
    const [activeView, setActiveView] = useState<View>('dashboard');

    const navItems = useMemo(() => {
        const items: {id: View, label: string, icon: React.ReactNode, roles: Role[]}[] = [
            { id: 'dashboard', label: 'Tableau de Bord', icon: <IconPackage size={20} />, roles: [Role.Admin, Role.Seller] },
            { id: 'pos', label: 'Point de Vente', icon: <IconPOS size={20} />, roles: [Role.Admin, Role.Seller] },
            { id: 'inventory', label: 'Inventaire', icon: <IconInventory size={20} />, roles: [Role.Admin] },
            { id: 'transactions', label: 'Transactions', icon: <IconTransactions size={20} />, roles: [Role.Admin, Role.Seller] },
            { id: 'reports', label: 'Rapports', icon: <IconDollarSign size={20} />, roles: [Role.Admin, Role.Seller] },
            { id: 'backup', label: 'Sauvegarde', icon: <IconDownload size={20} />, roles: [Role.Admin] },
        ];
        return items.filter(item => item.roles.includes(user.role));
    }, [user.role]);

    const handleSetActiveView = useCallback((view: 'pos' | 'inventory' | 'transactions' | View) => {
        setActiveView(view as View);
    }, []);

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardView setActiveView={handleSetActiveView} />;
            case 'pos':
                return <POSView user={user} />;
            case 'inventory':
                return <InventoryView user={user} />;
            case 'transactions':
                return <TransactionsView />;
            case 'reports':
                return <SalesReportView />;
            case 'backup':
                return <BackupRestoreView />;
            default:
                return <DashboardView setActiveView={handleSetActiveView} />;
        }
    };

    return (
        <div className="flex h-screen bg-background text-text-primary">
            <aside className="w-64 bg-surface border-r border-border flex flex-col p-4">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-center">Ventes GRSO</h1>
                </div>
                <nav className="flex-1 space-y-2">
                    {navItems.map(item => (
                        <NavItem
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            isActive={activeView === item.id}
                            onClick={() => setActiveView(item.id)}
                        />
                    ))}
                </nav>
                <div className="mt-auto">
                    <div className="p-4 rounded-lg bg-background text-center">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-text-secondary">{user.role}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full mt-4 px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary font-semibold hover:bg-border"
                    >
                        Se déconnecter
                    </button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                <div className="p-6">
                   {renderView()}
                </div>
            </main>
        </div>
    );
};