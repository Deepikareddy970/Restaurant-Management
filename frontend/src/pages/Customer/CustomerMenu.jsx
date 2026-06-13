import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Trash2, 
  CheckSquare, 
  Sparkles 
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'item-1', name: 'Truffle Mushroom Pasta', price: 18.5, category: 'Mains', desc: 'Fettuccine pasta in rich black truffle cream sauce with wild woodland mushrooms.', img: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=400' },
  { id: 'item-2', name: 'Smashed Avocado Toast', price: 12.0, category: 'Starters', desc: 'Artisanal sourdough bread topped with creamy avocados, cherry tomatoes, and red pepper flakes.', img: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=400' },
  { id: 'item-3', name: 'Belgian Chocolate Lava Cake', price: 8.5, category: 'Desserts', desc: 'Warm, gooey chocolate cake with a molten core, served with vanilla bean ice cream.', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400' },
  { id: 'item-4', name: 'Iced Matcha Latte', price: 5.5, category: 'Drinks', desc: 'Premium grade Japanese matcha whisked with cold milk and sweet organic honey.', img: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400' },
  { id: 'item-5', name: 'Ribeye Steak w/ Asparagus', price: 34.0, category: 'Mains', desc: 'Pan-seared 10oz ribeye basted in garlic rosemary butter, served with roasted asparagus.', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400' },
  { id: 'item-6', name: 'Crispy Garlic Parmesan Wings', price: 10.5, category: 'Starters', desc: 'Golden fried chicken wings tossed in rich garlic butter and fresh parmesan cheese.', img: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=400' },
  { id: 'item-7', name: 'Classic Caesar Salad', price: 11.0, category: 'Starters', desc: 'Crisp romaine leaves, garlic croutons, parmesan cheese shavings in home caesar dressing.', img: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=400' }
];

const CustomerMenu = () => {
  const { addToast } = useSocket();
  const navigate = useNavigate();
  
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('All');
  const [submitting, setSubmitting] = useState(false);

  // Cart Functions
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    addToast(`${item.name} added to cart.`, 'success');
  };

  const updateQuantity = (itemId, amount) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const nextQty = i.quantity + amount;
            return { ...i, quantity: nextQty };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
    addToast('Item removed from cart.', 'info');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!cart.length) return;
    setSubmitting(true);

    try {
      const itemsPayload = cart.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));

      const res = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: itemsPayload,
          totalAmount: cartTotal,
        }),
      });

      const data = await res.json();
      if (data.success) {
        addToast('Checkout successful! Tracking order.', 'success');
        setCart([]);
        navigate(`/customer/tracker?orderId=${data.order.id || data.order._id}`);
      } else {
        addToast(data.message || 'Checkout failed.', 'error');
      }
    } catch (err) {
      addToast('Connection failed during checkout.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];
  const filteredMenu = category === 'All' ? MENU_ITEMS : MENU_ITEMS.filter((i) => i.category === category);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu Browsing Workspace */}
      <div className="lg:col-span-2 space-y-6">
        {/* Banner */}
        <div className="p-6 rounded-3xl bg-indigo-600 dark:bg-indigo-950 text-white relative overflow-hidden shadow-lg shadow-indigo-600/15">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
          <div className="relative z-10">
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              <span>Dine-In Epitome Culinary Menu</span>
            </h1>
            <p className="text-xs text-indigo-100 mt-1">
              Select gourmet specialties crafted by master chefs, delivered straight to your table
            </p>
          </div>
        </div>

        {/* Category Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 ${
                category === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Menu Cards List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMenu.map((item) => (
            <div key={item.id} className="glass-panel p-4 rounded-3xl flex flex-col justify-between gap-4">
              <div className="flex gap-3">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-20 h-20 rounded-2xl object-cover bg-slate-100 border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                    {item.category}
                  </span>
                  <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100 truncate mt-1.5">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <span className="font-black text-sm text-indigo-600 dark:text-indigo-400">${item.price.toFixed(2)}</span>
                <button
                  onClick={() => addToCart(item)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition duration-150"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart side pane */}
      <div className="p-6 rounded-3xl glass-panel h-fit sticky top-20 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-805 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4.5 h-4.5 text-indigo-500" />
            <span>My Table Cart</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">Cart is empty. Add dishes to checkout.</div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 text-xs">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">${item.price.toFixed(2)} each</p>
                  </div>

                  {/* Quantity adjust */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total and Checkout */}
        {cart.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500 uppercase">Subtotal</span>
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400">${cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Place Table Order</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerMenu;
