// FIX: Add content for BackupRestoreView.tsx to provide backup and restore functionality.
import React, { useCallback, useState } from 'react';
import { useAppStore } from '../hooks/store';
import { IconDownload, IconUpload } from './icons/IconComponents';

export const BackupRestoreView: React.FC = () => {
    // FIX: Switched to atomic selectors to prevent infinite render loops (React Error #185).
    // Instead of creating a new object on every render, we select each piece of state individually.
    const products = useAppStore(state => state.products);
    const transactions = useAppStore(state => state.transactions);
    const categories = useAppStore(state => state.categories);
    
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleBackup = useCallback(() => {
        const stateToBackup = {
            products,
            transactions,
            categories,
        };
        const dataStr = JSON.stringify(stateToBackup, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `grso-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [products, transactions, categories]);
    
    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        if (!window.confirm("Êtes-vous sûr de vouloir restaurer ? L'état actuel de l'application sera écrasé par les données du fichier.")) {
            if(event.target) event.target.value = '';
            return;
        }

        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const restoredState = JSON.parse(text);
                
                // Basic validation
                if (!restoredState.products || !restoredState.transactions || !restoredState.categories) {
                    throw new Error("Fichier de sauvegarde invalide. Propriétés requises manquantes.");
                }

                // Directly update the store state
                useAppStore.setState({
                    products: restoredState.products,
                    transactions: restoredState.transactions,
                    categories: restoredState.categories,
                });

                alert('Restauration réussie !');
            } catch (error) {
                console.error("Erreur de restauration:", error);
                alert(`Une erreur est survenue pendant la restauration: ${error instanceof Error ? error.message : 'Erreur inconnue.'}`);
            } finally {
                setIsLoading(false);
                if(event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold">Sauvegarde et Restauration</h2>
            
            <div className="p-6 bg-surface rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Sauvegarder les Données</h3>
                <p className="text-text-secondary mb-4">
                    Créez une sauvegarde complète de toutes vos données (produits, transactions, catégories). 
                    Le fichier sera téléchargé au format JSON. Conservez-le en lieu sûr.
                </p>
                <button 
                    onClick={handleBackup} 
                    className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    <IconDownload size={18} /> Télécharger la Sauvegarde
                </button>
            </div>
            
            <div className="p-6 bg-surface rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Restaurer les Données</h3>
                <p className="text-text-secondary mb-4">
                    Restaurez l'état de l'application à partir d'un fichier de sauvegarde JSON.
                    <strong className="text-red-500"> Attention : cette action est irréversible et écrasera toutes les données existantes.</strong>
                </p>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
                <button 
                    onClick={handleRestoreClick} 
                    disabled={isLoading}
                    className="px-6 py-3 rounded-lg bg-surface border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? 'Restauration...' : <><IconUpload size={18} /> Choisir un Fichier et Restaurer</>}
                </button>
            </div>
        </div>
    );
};