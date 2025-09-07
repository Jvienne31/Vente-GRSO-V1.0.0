import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../hooks/store';
import type { User, Product, CartItem, ProductVariant } from '../types';
import { IconSearch, IconPlus, IconMinus, IconTrash, IconCreditCard, IconDollarSign, IconCheck } from './icons/IconComponents';
import { Modal } from './common/Modal';

interface POSViewProps {
  user: User;
}

const ProductCard: React.FC<{ product: Product; onClick: () => void; }> = ({ product, onClick }) => {
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    const isOutOfStock = totalStock === 0;

    return (
        <button 
            onClick={onClick}
            disabled={isOutOfStock}
            className={`bg-surface rounded-lg p-4 text-left shadow-md hover:shadow-lg transition-shadow duration-200 relative overflow-hidden ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {isOutOfStock && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">HORS STOCK</div>}
            <h3 className="font-bold text-base sm:text-lg text-text-primary truncate" title={product.name}>{product.name}</h3>
            <p className="text-sm text-text-secondary">{product.category}</p>
            <p className="mt-2 text-base sm:text-lg font-semibold text-primary">{product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
        </button>
    );
};


const VariantSelector: React.FC<{
    product: Product;
    onSelectVariant: (variant: ProductVariant) => void;
    onClose: () => void;
}> = ({ product, onSelectVariant, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Sélectionner une variante pour ${product.name}`}>
            <div className="space-y-3">
                {product.variants.map(variant => (
                    <button
                        key={variant.size}
                        disabled={variant.stock <= 0}
                        onClick={() => {
                            onSelectVariant(variant);
                            onClose();
                        }}
                        className="w-full flex justify-between items-center p-4 rounded-md bg-background hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div>
                            <p className="font-semibold">{variant.size}</p>
                            <p className="text-sm text-text-secondary">Stock: {variant.stock}</p>
                        </div>
                        {variant.stock > 0 && <IconPlus size={18} />}
                    </button>
                ))}
            </div>
        </Modal>
    );
};

export const POSView: React.FC<POSViewProps> = ({ user }) => {
    const products = useAppStore(state => state.products);
    const categories = useAppStore(state => state.categories);
    const completeTransaction = useAppStore(state => state.completeTransaction);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'Espèces' | 'Carte' | 'Chèque'>('Carte');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const filteredProducts = useMemo(() =>
        products.filter(p => {
            const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.category.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = selectedCategory ? p.category === selectedCategory : true;
            return searchMatch && categoryMatch;
        }).sort((a,b) => a.name.localeCompare(b.name)),
        [products, searchTerm, selectedCategory]
    );

    const addToCart = useCallback((product: Product, variant: ProductVariant) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.productId === product.id && item.size === variant.size);
            if (existingItem) {
                if (existingItem.quantity < variant.stock) {
                    return currentCart.map(item =>
                        item.productId === product.id && item.size === variant.size
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                }
                return currentCart; // Do not add if stock limit reached
            } else {
                 if (variant.stock > 0) {
                    return [...currentCart, {
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        size: variant.size,
                        stock: variant.stock
                    }];
                }
                return currentCart; // Do not add if out of stock
            }
        });
    }, []);

    const updateQuantity = useCallback((productId: string, size: string, change: number) => {
        setCart(currentCart => {
            const itemToUpdate = currentCart.find(item => item.productId === productId && item.size === size);
            if (!itemToUpdate) return currentCart;

            const newQuantity = itemToUpdate.quantity + change;
            if (newQuantity <= 0) {
                return currentCart.filter(item => !(item.productId === productId && item.size === size));
            }
            if (newQuantity > itemToUpdate.stock) {
                return currentCart; // Do not exceed stock
            }
            return currentCart.map(item =>
                item.productId === productId && item.size === size
                    ? { ...item, quantity: newQuantity }
                    : item
            );
        });
    }, []);
    
    const removeFromCart = (productId: string, size: string) => {
        setCart(currentCart => currentCart.filter(item => !(item.productId === productId && item.size === size)));
    };

    const handleProductClick = useCallback((product: Product) => {
        const hasMeaningfulVariants = product.variants.length > 1 || (product.variants.length === 1 && product.variants[0].size !== 'N/A');
        if (hasMeaningfulVariants) {
            setSelectedProduct(product);
        } else if (product.variants.length === 1) {
            addToCart(product, product.variants[0]);
        }
    }, [addToCart]);
    
    const handleVariantSelected = useCallback((variant: ProductVariant) => {
        if (selectedProduct) {
            addToCart(selectedProduct, variant);
        }
        setSelectedProduct(null);
    }, [selectedProduct, addToCart]);
    
    const { subtotal, tax, total } = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = subtotal * 0.20; // 20% TVA
        const total = subtotal + tax;
        return { subtotal, tax, total };
    }, [cart]);

    const handleCheckout = useCallback(() => {
        if (cart.length === 0) {
            alert("Le panier est vide.");
            return;
        }
        completeTransaction(cart, paymentMethod, user.id);
        setCart([]);
        setIsPaymentModalOpen(false);
    }, [cart, paymentMethod, user.id, completeTransaction]);
    
    const sortedCategories = useMemo(() => [...categories].sort((a,b) => a.name.localeCompare(b.name)), [categories]);

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Product List */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 pb-4 -mt-6 pt-6">
                    <h2 className="text-3xl font-bold mb-4">Point de Vente</h2>
                    <div className="relative">
                         <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-border rounded-lg p-3 pl-10"
                        />
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                    </div>
                     <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                selectedCategory === null ? 'bg-primary text-white' : 'bg-surface hover:bg-border'
                            }`}
                        >
                            Toutes
                        </button>
                        {sortedCategories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.name)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                    selectedCategory === category.name ? 'bg-primary text-white' : 'bg-surface hover:bg-border'
                                }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
                    {filteredProducts.map(p => (
                        <ProductCard key={p.id} product={p} onClick={() => handleProductClick(p)} />
                    ))}
                </div>
            </div>

            {/* Cart */}
            <aside className="w-96 bg-surface border-l border-border flex flex-col">
                <div className="p-6 border-b border-border">
                    <h3 className="text-xl font-bold">Panier</h3>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <p className="text-text-secondary text-center mt-8">Le panier est vide.</p>
                    ) : (
                        cart.map(item => (
                            <div key={`${item.productId}-${item.size}`} className="flex items-center gap-4 bg-background/50 p-3 rounded-md">
                                <div className="flex-grow">
                                    <p className="font-semibold truncate">{item.name}</p>
                                    <p className="text-sm text-text-secondary">Taille: {item.size}</p>
                                    <p className="text-sm font-mono text-primary">{item.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.productId, item.size, -1)} className="p-1 rounded-full hover:bg-border"><IconMinus size={16}/></button>
                                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, item.size, 1)} className="p-1 rounded-full hover:bg-border"><IconPlus size={16}/></button>
                                </div>
                                <button onClick={() => removeFromCart(item.productId, item.size)} className="p-1 rounded-full text-red-500 hover:bg-red-500/10"><IconTrash size={16} /></button>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-6 border-t border-border space-y-4 bg-background">
                        <div className="space-y-1 text-sm">
                           <div className="flex justify-between">
                                <span className="text-text-secondary">Sous-total</span>
                                <span>{subtotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                           </div>
                           <div className="flex justify-between">
                                <span className="text-text-secondary">TVA (20%)</span>
                                <span>{tax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                           </div>
                        </div>
                        <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-border">
                            <span className="text-xl font-bold">Total</span>
                            <span className="text-2xl font-bold text-primary">{total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                        </div>
                        <button onClick={() => setIsPaymentModalOpen(true)} className="w-full p-4 rounded-lg bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-colors">
                            Procéder au paiement
                        </button>
                    </div>
                )}
            </aside>
            
            {selectedProduct && (
                <VariantSelector
                    product={selectedProduct}
                    onSelectVariant={handleVariantSelected}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
            
            {isPaymentModalOpen && (
                <Modal isOpen={true} onClose={() => setIsPaymentModalOpen(false)} title="Finaliser la Vente">
                    <div className="space-y-6">
                        <div className="bg-background p-4 rounded-lg text-center">
                            <p className="text-text-secondary">Montant à payer</p>
                            <p className="text-4xl font-bold text-primary">{total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Méthode de paiement</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button onClick={() => setPaymentMethod('Carte')} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${paymentMethod === 'Carte' ? 'border-primary bg-primary/10' : 'border-border hover:border-text-secondary'}`}>
                                    <IconCreditCard /> Carte
                                </button>
                                <button onClick={() => setPaymentMethod('Espèces')} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${paymentMethod === 'Espèces' ? 'border-primary bg-primary/10' : 'border-border hover:border-text-secondary'}`}>
                                    <IconDollarSign /> Espèces
                                </button>
                                 <button onClick={() => setPaymentMethod('Chèque')} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${paymentMethod === 'Chèque' ? 'border-primary bg-primary/10' : 'border-border hover:border-text-secondary'}`}>
                                    <IconCheck /> Chèque
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-6 border-t border-border">
                            <button onClick={() => setIsPaymentModalOpen(false)} className="px-6 py-3 rounded-lg bg-surface border border-border text-text-secondary font-semibold hover:bg-border">Annuler</button>
                            <button onClick={handleCheckout} className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-600/90 flex items-center gap-2">
                                <IconCheck size={18} /> Confirmer la vente
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};