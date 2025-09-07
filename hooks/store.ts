// FIX: Implement Zustand store for state management.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Transaction, Category, CartItem, ProductVariant } from '../types';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Initial data is now empty to allow users to start with a clean slate.
const initialProducts: Product[] = [];

const getInitialCategories = (products: Product[]): Category[] => {
    const categoryNames = [...new Set(products.map(p => p.category))];
    return categoryNames.map(name => ({ id: `cat_${generateId()}`, name }));
};

interface AppState {
    products: Product[];
    transactions: Transaction[];
    categories: Category[];
    addProduct: (productData: Omit<Product, 'id'>) => void;
    updateProduct: (updatedProduct: Product) => void;
    completeTransaction: (cart: CartItem[], paymentMethod: 'Espèces' | 'Carte' | 'Chèque', sellerId: number) => void;
    bulkAddOrUpdateProducts: (productsToImport: {
        name: string;
        price: number;
        category: string;
        size: string;
        stock: number;
        lowStockThreshold: number;
    }[]) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            products: initialProducts,
            transactions: [],
            categories: getInitialCategories(initialProducts),

            addProduct: (productData) => {
                const newProduct: Product = {
                    id: `prod_${generateId()}`,
                    ...productData,
                };
                set(state => {
                    const existingCategory = state.categories.find(c => c.name === newProduct.category);
                    const updatedCategories = existingCategory 
                        ? state.categories 
                        : [...state.categories, { id: `cat_${generateId()}`, name: newProduct.category }];
                    
                    return {
                        products: [...state.products, newProduct],
                        categories: updatedCategories,
                    };
                });
            },

            updateProduct: (updatedProduct) => {
                set(state => {
                    const existingCategory = state.categories.find(c => c.name === updatedProduct.category);
                    const updatedCategories = existingCategory 
                        ? state.categories 
                        : [...state.categories, { id: `cat_${generateId()}`, name: updatedProduct.category }];

                    return {
                        products: state.products.map(p => p.id === updatedProduct.id ? updatedProduct : p),
                        categories: updatedCategories,
                    };
                });
            },

            completeTransaction: (cart, paymentMethod, sellerId) => {
                const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
                const tax = subtotal * 0.20;
                const total = subtotal + tax;

                const newTransaction: Transaction = {
                    id: `trans_${generateId()}`,
                    date: new Date().toISOString(),
                    items: cart.map(item => ({
                        productId: item.productId,
                        productName: item.name,
                        size: item.size,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    total,
                    tax,
                    paymentMethod,
                    sellerId
                };

                const updatedProducts = get().products.map(product => {
                    const newVariants = product.variants.map(variant => {
                        const cartItemForVariant = cart.find(item => item.productId === product.id && item.size === variant.size);
                        if (cartItemForVariant) {
                            return { ...variant, stock: variant.stock - cartItemForVariant.quantity };
                        }
                        return variant;
                    });
                    return { ...product, variants: newVariants };
                });

                set(state => ({
                    transactions: [newTransaction, ...state.transactions],
                    products: updatedProducts
                }));
            },

            bulkAddOrUpdateProducts: (productsToImport) => {
                 set(state => {
                    const productsCopy: Product[] = JSON.parse(JSON.stringify(state.products));
                    const categoriesCopy: Category[] = JSON.parse(JSON.stringify(state.categories));
                    const categoryNames = new Set(categoriesCopy.map(c => c.name));

                    productsToImport.forEach(item => {
                        let product = productsCopy.find((p: Product) => p.name.toLowerCase() === item.name.toLowerCase());
                        
                        if (!categoryNames.has(item.category)) {
                            categoriesCopy.push({ id: `cat_${generateId()}`, name: item.category });
                            categoryNames.add(item.category);
                        }

                        if (product) {
                            product.price = item.price;
                            product.category = item.category;
                            
                            let variant = product.variants.find((v: ProductVariant) => v.size === item.size);
                            if (variant) {
                                variant.stock = item.stock;
                                variant.lowStockThreshold = item.lowStockThreshold;
                            } else {
                                product.variants.push({
                                    size: item.size,
                                    stock: item.stock,
                                    lowStockThreshold: item.lowStockThreshold
                                });
                            }
                        } else {
                            const newProduct: Product = {
                                id: `prod_${generateId()}`,
                                name: item.name,
                                price: item.price,
                                category: item.category,
                                variants: [{
                                    size: item.size,
                                    stock: item.stock,
                                    lowStockThreshold: item.lowStockThreshold
                                }]
                            };
                            productsCopy.push(newProduct);
                        }
                    });
                    
                    return { products: productsCopy, categories: categoriesCopy };
                });
            }
        }),
        {
            name: 'grso-pos-storage',
        }
    )
);