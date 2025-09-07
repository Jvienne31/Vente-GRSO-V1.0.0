import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../hooks/store';
import type { Product, ProductVariant, User } from '../types';
import { Table } from './common/Table';
import { Modal } from './common/Modal';
import { IconPlus, IconUpload, IconEdit, IconTrash, IconDownload } from './icons/IconComponents';

const ProductEditor: React.FC<{
    product: Product;
    setProduct: React.Dispatch<React.SetStateAction<Product | null>>;
    onSave: (product: Product) => void;
    onCancel: () => void;
}> = ({ product, setProduct, onSave, onCancel }) => {
    
    const handleChange = (field: keyof Omit<Product, 'id' | 'variants'>, value: string | number) => {
        setProduct(p => {
            if (!p) return null;
            const updatedValue = field === 'price' ? (typeof value === 'string' ? parseFloat(value.replace(',', '.')) || 0 : value) : value;
            return { ...p, [field]: updatedValue };
        });
    };

    const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number) => {
        setProduct(p => {
            if (!p) return null;
            const newVariants = [...p.variants];
            const updatedValue = (field === 'stock' || field === 'lowStockThreshold') ? (typeof value === 'string' ? parseInt(value, 10) || 0 : value) : value;
            newVariants[index] = { ...newVariants[index], [field]: updatedValue };
            return { ...p, variants: newVariants };
        });
    };
    
    const addVariant = () => {
        setProduct(p => p ? { ...p, variants: [...p.variants, { size: '', stock: 0, lowStockThreshold: 0 }] } : null);
    };

    const removeVariant = (index: number) => {
        setProduct(p => {
            if (!p || p.variants.length <= 1) return p;
            const newVariants = p.variants.filter((_, i) => i !== index);
            return { ...p, variants: newVariants };
        });
    };

    return (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 -mr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Nom du Produit</label>
                    <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full bg-background border border-border rounded-md p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Catégorie</label>
                    <input
                        type="text"
                        value={product.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full bg-background border border-border rounded-md p-2"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Prix de Vente (€)</label>
                <input
                    type="number"
                    value={product.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    className="w-full bg-background border border-border rounded-md p-2"
                    step="0.01"
                />
            </div>
            
            <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b border-border pb-2">Variantes</h4>
                {product.variants.map((variant, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-3 bg-surface/50 rounded-lg">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-text-secondary mb-1">Taille</label>
                            <input
                                type="text"
                                placeholder="S, M, L, N/A..."
                                value={variant.size}
                                onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                className="w-full bg-background border border-border rounded-md p-2"
                            />
                        </div>
                        <div className="md:col-span-1">
                             <label className="block text-sm font-medium text-text-secondary mb-1">Stock</label>
                            <input
                                type="number"
                                value={variant.stock}
                                onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                className="w-full bg-background border border-border rounded-md p-2"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-text-secondary mb-1">Seuil stock bas</label>
                            <input
                                type="number"
                                value={variant.lowStockThreshold}
                                onChange={(e) => handleVariantChange(index, 'lowStockThreshold', e.target.value)}
                                className="w-full bg-background border border-border rounded-md p-2"
                            />
                        </div>
                        <div className="md:col-span-1 flex items-center justify-start">
                            <button 
                                onClick={() => removeVariant(index)} 
                                disabled={product.variants.length <= 1}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <IconTrash size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                 <button onClick={addVariant} className="px-3 py-1.5 text-sm rounded-md border border-dashed border-border text-text-secondary font-semibold hover:bg-border transition-colors flex items-center gap-2">
                    <IconPlus size={14}/> Ajouter une variante
                </button>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-border mt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary font-semibold hover:bg-border">Annuler</button>
                <button type="button" onClick={() => onSave(product)} className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">Sauvegarder</button>
            </div>
        </div>
    );
};

export const InventoryView: React.FC<{ user: User }> = ({ user }) => {
    const products = useAppStore(state => state.products);
    const addProduct = useAppStore(state => state.addProduct);
    const updateProduct = useAppStore(state => state.updateProduct);
    const bulkAddOrUpdateProducts = useAppStore(state => state.bulkAddOrUpdateProducts);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => a.name.localeCompare(b.name));
    }, [products, searchTerm]);

    const handleAddProduct = () => {
        setEditingProduct({
            id: '', // Empty id signifies a new product
            name: '',
            price: 0,
            category: '',
            variants: [{ size: 'N/A', stock: 0, lowStockThreshold: 5 }]
        });
        setIsModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(JSON.parse(JSON.stringify(product)));
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSaveProduct = (productToSave: Product) => {
        if (!productToSave.name || !productToSave.category || productToSave.price <= 0) {
            alert("Veuillez remplir tous les champs obligatoires (Nom, Catégorie, Prix > 0).");
            return;
        }
        if (productToSave.variants.some(v => !v.size)) {
            alert("Toutes les variantes doivent avoir une taille (utilisez 'N/A' si non applicable).");
            return;
        }
        if (productToSave.variants.length === 0) {
            alert("Un produit doit avoir au moins une variante.");
            return;
        }

        if (productToSave.id) {
            updateProduct(productToSave);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...newProductData } = productToSave;
            addProduct(newProductData);
        }
        handleCloseModal();
    };
    
    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const lines = text.split(/[\r\n]+/).filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    alert("Le fichier CSV est vide ou ne contient que les en-têtes.");
                    return;
                }

                const headerMap = {
                    'nom': 'name',
                    'catégorie': 'category',
                    'prix': 'price',
                    'taille': 'size',
                    'stock': 'stock',
                    'seuil de stock faible': 'lowStockThreshold',
                };
                const requiredFrenchHeaders = Object.keys(headerMap);
                const csvHeaders = lines[0].split(';').map(h => h.trim().toLowerCase());

                const missingHeaders = requiredFrenchHeaders.filter(h => !csvHeaders.includes(h));
                if (missingHeaders.length > 0) {
                    alert(`En-têtes manquants ou incorrects dans le fichier CSV. Requis: ${requiredFrenchHeaders.join('; ')}. Manquants: ${missingHeaders.join(', ')}`);
                    return;
                }

                const productsToImport = lines.slice(1).map((line, i) => {
                    const values = line.split(';');
                    const productData = csvHeaders.reduce((obj, header, index) => {
                        const internalKey = headerMap[header as keyof typeof headerMap];
                        if (internalKey) {
                            obj[internalKey] = values[index]?.trim() ?? '';
                        }
                        return obj;
                    }, {} as any);

                    const price = parseFloat(productData.price?.replace(',', '.') || '0');
                    const stock = parseInt(productData.stock || '0', 10);
                    const lowStockThreshold = parseInt(productData.lowStockThreshold || '0', 10);

                    if (!productData.name || isNaN(price) || isNaN(stock) || isNaN(lowStockThreshold)) {
                        throw new Error(`Ligne ${i + 2} invalide : données manquantes ou incorrectes.`);
                    }

                    return {
                        name: productData.name,
                        price,
                        category: productData.category,
                        size: productData.size || 'N/A',
                        stock,
                        lowStockThreshold
                    };
                });
                
                bulkAddOrUpdateProducts(productsToImport);
                alert(`${productsToImport.length} variante(s) de produit importée(s) ou mise(s) à jour avec succès.`);
            } catch (error) {
                console.error("Erreur d'importation CSV:", error);
                alert(`Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue.'}`);
            } finally {
                if(event.target) event.target.value = '';
            }
        };
        reader.readAsText(file, 'windows-1252');
    }, [bulkAddOrUpdateProducts]);
    
    const handleExport = useCallback(() => {
        if (filteredProducts.length === 0) {
            alert("Il n'y a aucun produit à exporter pour les filtres sélectionnés.");
            return;
        }

        const headers = ['nom', 'catégorie', 'prix', 'taille', 'stock', 'seuil de stock faible'];
        const csvRows = [headers.join(';')];

        filteredProducts.forEach(product => {
            product.variants.forEach(variant => {
                const row = [
                    product.name,
                    product.category,
                    product.price.toString().replace('.', ','),
                    variant.size,
                    variant.stock,
                    variant.lowStockThreshold
                ].join(';');
                csvRows.push(row);
            });
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `inventaire-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [filteredProducts]);

    const columns = useMemo(() => [
        { header: 'Produit', accessor: (p: Product) => <div className="font-semibold">{p.name}</div> },
        { header: 'Catégorie', accessor: (p: Product) => p.category },
        { header: 'Prix', accessor: (p: Product) => p.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) },
        { 
            header: 'Stock',
            accessor: (p: Product) => {
                const hasMeaningfulVariants = p.variants.length > 1 || (p.variants.length === 1 && p.variants[0].size !== 'N/A');
                
                if (hasMeaningfulVariants) {
                    return (
                        <div className="flex flex-col text-xs space-y-1">
                            {p.variants.map(variant => {
                                const isLow = variant.stock <= variant.lowStockThreshold;
                                const isOutOfStock = variant.stock === 0;
                                let color = '';
                                if (isOutOfStock) {
                                    color = 'text-red-500';
                                } else if (isLow) {
                                    color = 'text-yellow-500';
                                }

                                return (
                                    <div key={variant.size} className="grid grid-cols-2 gap-2 items-center">
                                        <span className="font-medium text-text-secondary">{variant.size}:</span>
                                        <span className={`font-semibold text-right pr-2 ${color}`}>
                                            {variant.stock}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    );
                } else {
                    const singleVariant = p.variants[0];
                    if (!singleVariant) return <span className="text-text-secondary">N/A</span>;

                    const isLow = singleVariant.stock <= singleVariant.lowStockThreshold;
                    const isOutOfStock = singleVariant.stock === 0;
                    let color = '';
                    if (isOutOfStock) {
                        color = 'text-red-500 font-bold';
                    } else if (isLow) {
                        color = 'text-yellow-500 font-bold';
                    }
                    return <span className={color}>{singleVariant.stock}</span>;
                }
            }
        },
        {
            header: '',
            accessor: (p: Product) => (
                <div className="text-right">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditProduct(p);
                        }}
                        className="p-2 hover:bg-border rounded-lg text-text-secondary hover:text-text-primary"
                    >
                        <IconEdit size={18} />
                    </button>
                </div>
            )
        }
    ], [handleEditProduct]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-bold">Inventaire</h2>
                <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                     <button onClick={handleExport} disabled={filteredProducts.length === 0} className="px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary font-semibold hover:bg-border transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <IconDownload size={16} /> Exporter CSV
                    </button>
                    <button onClick={handleImportClick} className="px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary font-semibold hover:bg-border transition-colors flex items-center gap-2">
                        <IconUpload size={16} /> Importer CSV
                    </button>
                    <button onClick={handleAddProduct} className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
                        <IconPlus size={16} /> Ajouter Produit
                    </button>
                </div>
            </div>

            <div>
                <input
                    type="text"
                    placeholder="Rechercher par nom ou catégorie..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm bg-surface border border-border rounded-lg p-2"
                />
            </div>

            <Table<Product>
                columns={columns}
                data={filteredProducts}
                onRowClick={handleEditProduct}
            />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct?.id ? 'Modifier le Produit' : 'Ajouter un Produit'}>
                {editingProduct && <ProductEditor product={editingProduct} setProduct={setEditingProduct} onSave={handleSaveProduct} onCancel={handleCloseModal} />}
            </Modal>
        </div>
    );
};