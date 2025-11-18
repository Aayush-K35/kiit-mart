import React, { useState } from 'react';
import { MapPin, User, LogIn, LogOut, Package, Plus, Minus, ArrowLeft, Store, Tag, Home, Info, Trash2, AlertCircle, X, Smile } from 'lucide-react';

// --- Mock Data & Constants ---

const HOSTELS = [
  { id: 'KP-25A', name: 'KP-25A Block', type: 'boys' },
  { id: 'KP-25B', name: 'KP-25B Block', type: 'boys' },
  { id: 'KP-25C', name: 'KP-25C Block', type: 'boys' },
  { id: 'KP-25D', name: 'KP-25D Block', type: 'boys' },
  { id: 'QC-25F', name: 'QC-25F Block', type: 'girls' },
  { id: 'QC-25G', name: 'QC-25G Block', type: 'girls' },
];

const STANDARD_ITEMS = [
  { id: 'maggi_small', name: 'Maggi (Small)', category: 'Food', icon: '🍜', defaultPrice: 12 },
  { id: 'maggi_big', name: 'Maggi (Big)', category: 'Food', icon: '🍜', defaultPrice: 18 },
  { id: 'chocopie', name: 'ChocoPie', category: 'Snack', icon: '🍩', defaultPrice: 10 },
  { id: 'frooti_10', name: 'Frooti (₹10)', category: 'Drink', icon: '🧃', defaultPrice: 10 },
  { id: 'frooti_20', name: 'Frooti (₹20)', category: 'Drink', icon: '🧃', defaultPrice: 20 },
  { id: 'coke_can', name: 'Coke (Can)', category: 'Drink', icon: '🥤', defaultPrice: 40 },
  { id: 'coke_bottle', name: 'Coke (Bottle)', category: 'Drink', icon: '🥤', defaultPrice: 25 },
  { id: 'chips', name: 'Chips', category: 'Snack', icon: '🍟', defaultPrice: 20 },
  { id: 'pen', name: 'Ball Pen', category: 'Stationery', icon: '🖊️', defaultPrice: 5 },
  { id: 'notebook', name: 'Notebook', category: 'Stationery', icon: '📓', defaultPrice: 50 },
];

const INITIAL_SELLERS = [
  { id: 'seller1', name: 'Ayush', hostel: 'KP-25A', room: '182-B', gender: 'Male', username: 'ayush', password: '123' },
  { id: 'seller2', name: 'Ashutosh', hostel: 'KP-25B', room: '181-B', gender: 'Male', username: 'ashutosh', password: '123' },
];

// Initial Inventory
const INITIAL_INVENTORY = [
  { id: 'inv1', sellerId: 'seller1', itemId: 'frooti_20', quantity: 5, price: 22, variantNote: 'Chilled' },
  { id: 'inv2', sellerId: 'seller1', itemId: 'maggi_small', quantity: 3, price: 15, variantNote: 'Masala' },
  { id: 'inv3', sellerId: 'seller1', itemId: 'maggi_small', quantity: 2, price: 15, variantNote: 'Atta' },
  { id: 'inv4', sellerId: 'seller2', itemId: 'coke_bottle', quantity: 10, price: 28, variantNote: 'Chilled' },
  { id: 'inv5', sellerId: 'seller2', itemId: 'chocopie', quantity: 2, price: 12, variantNote: '' },
];

// --- Helper to generate IDs ---
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// --- Components ---

export default function HostelStoreApp() {
  // State
  const [view, setView] = useState('landing');
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Data State
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [sellers, setSellers] = useState(INITIAL_SELLERS);
  const [customItems, setCustomItems] = useState([]); // Stores custom items: { id, name, icon, defaultPrice, creatorId }

  // Modals & Forms
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [activeTab, setActiveTab] = useState('standard'); // 'standard' or 'custom'
  
  // Custom Item Form
  const [customForm, setCustomForm] = useState({ name: '', price: '', icon: '📦' });

  // Login State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Merged Catalog for Lookup
  const fullCatalog = [...customItems, ...STANDARD_ITEMS];

  // --- Helpers ---

  // Get items to display in dashboard (Unique items currently in user's inventory)
  const getUserActiveItems = (userId) => {
    const userInv = inventory.filter(inv => inv.sellerId === userId);
    const uniqueItemIds = [...new Set(userInv.map(inv => inv.itemId))];
    return uniqueItemIds.map(id => fullCatalog.find(item => item.id === id)).filter(Boolean);
  };

  // Get all items available in a specific hostel (Purchaser View)
  const getHostelItems = (hostelId) => {
    const sellersInHostel = sellers.filter(s => s.hostel === hostelId);
    const sellerIds = sellersInHostel.map(s => s.id);
    const hostelInventory = inventory.filter(inv => sellerIds.includes(inv.sellerId) && inv.quantity > 0);
    const uniqueItemIds = [...new Set(hostelInventory.map(inv => inv.itemId))];
    
    return uniqueItemIds.map(itemId => {
      const template = fullCatalog.find(i => i.id === itemId);
      if (!template) return null;
      const itemInstances = hostelInventory.filter(inv => inv.itemId === itemId);
      const minPrice = Math.min(...itemInstances.map(inv => inv.price));
      return { ...template, minPrice };
    }).filter(Boolean);
  };

  const getItemSellers = (hostelId, itemId) => {
    const sellersInHostel = sellers.filter(s => s.hostel === hostelId);
    return sellersInHostel.map(seller => {
      const variants = inventory.filter(inv => inv.sellerId === seller.id && inv.itemId === itemId && inv.quantity > 0);
      if (variants.length > 0) return { ...seller, variants };
      return null;
    }).filter(Boolean);
  };

  // --- Inventory Management Handlers ---

  // Used when adding a NEW Product to dashboard (Initializes first variant)
  const handleAddProductToDashboard = (itemId, initialPrice) => {
    if (!currentUser) return;
    const newItem = {
      id: generateId(),
      sellerId: currentUser.id,
      itemId: itemId,
      quantity: 0, // Start with 0 so they can setup
      price: parseInt(initialPrice) || 0,
      variantNote: ''
    };
    setInventory(prev => [...prev, newItem]);
    setShowAddProductModal(false);
    setCustomForm({ name: '', price: '', icon: '📦' }); // Reset form
  };

  // Used when adding a new VARIANT to an existing product
  const handleAddVariant = (itemId) => {
    if (!currentUser) return;
    const defaultItem = fullCatalog.find(i => i.id === itemId);
    
    const newVariant = {
      id: generateId(),
      sellerId: currentUser.id,
      itemId: itemId,
      quantity: 1,
      price: defaultItem.defaultPrice,
      variantNote: ''
    };

    setInventory(prev => [...prev, newVariant]);
  };

  const handleRemoveVariant = (inventoryId) => {
    setInventory(prev => prev.filter(inv => inv.id !== inventoryId));
  };

  const handleDeleteProduct = (itemId) => {
    // Removes ALL variants of this item for the current user
    if(window.confirm("Are you sure you want to stop selling this product? All variants will be removed.")) {
        setInventory(prev => prev.filter(inv => !(inv.sellerId === currentUser.id && inv.itemId === itemId)));
    }
  };

  const handleUpdateVariant = (inventoryId, field, value) => {
    setInventory(prev => prev.map(inv => {
      if (inv.id === inventoryId) {
        if (field === 'quantity' && value < 0) return inv;
        return { ...inv, [field]: value };
      }
      return inv;
    }));
  };

  const handleCreateCustomItem = (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const userCustomCount = customItems.filter(i => i.creatorId === currentUser.id).length;
    if (userCustomCount >= 5) {
        alert("You can only create up to 5 custom products.");
        return;
    }

    const newId = 'custom_' + generateId();
    const item = {
      id: newId,
      name: customForm.name,
      category: 'Custom',
      icon: customForm.icon,
      defaultPrice: parseInt(customForm.price) || 0,
      creatorId: currentUser.id
    };

    setCustomItems(prev => [...prev, item]);
    handleAddProductToDashboard(newId, item.defaultPrice);
  };

  const checkDuplicateNote = (inventoryId, itemId, note) => {
    if (!currentUser) return false;
    return inventory.some(inv => 
      inv.sellerId === currentUser.id && 
      inv.itemId === itemId && 
      inv.id !== inventoryId && 
      inv.variantNote.trim().toLowerCase() === note.trim().toLowerCase()
    );
  };

  // --- Auth Handlers ---

  const handleLogin = (e) => {
    e.preventDefault();
    const user = sellers.find(s => s.username === loginForm.username && s.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setView('dashboard');
      setLoginError('');
      setLoginForm({ username: '', password: '' });
    } else {
      setLoginError('Invalid credentials. Try ayush/123 or ashutosh/123');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('landing');
  };

  // --- Views ---

  const renderHeader = () => (
    <header className="bg-white text-gray-800 p-4 shadow-md flex justify-between items-center sticky top-0 z-50 border-b border-gray-200">
      <div 
        className="flex items-center gap-2 font-bold text-xl cursor-pointer hover:opacity-80 text-green-600" 
        onClick={() => { setView('landing'); setSelectedHostel(null); }}
      >
        <Store className="w-6 h-6" />
        <span>KIIT MART</span>
      </div>
      
      <div className="flex items-center gap-4">
        {currentUser ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.hostel} • {currentUser.room}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setView('login')}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition ${view === 'login' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <LogIn className="w-4 h-4" /> Seller Login
          </button>
        )}
      </div>
    </header>
  );

  const renderLanding = () => (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <div className="text-center mb-12 pt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Find Food & Essentials in Your Hostel</h1>
        <p className="text-gray-600">Select your hostel block to see what's available right now.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {HOSTELS.map(hostel => {
            const isBoy = hostel.type === 'boys';
            // KIIT Green for Brand, but maintaining Blue for Boys and Pink for Girls for clarity
            const colorClass = isBoy ? 'group-hover:bg-blue-600 group-hover:text-white bg-blue-50 text-blue-600' : 'group-hover:bg-pink-500 group-hover:text-white bg-pink-50 text-pink-500';
            const borderClass = isBoy ? 'hover:border-blue-300' : 'hover:border-pink-300';

            return (
            <div 
                key={hostel.id}
                onClick={() => { setSelectedHostel(hostel.id); setView('hostel-view'); }}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg ${borderClass} transition cursor-pointer group flex flex-col items-center text-center`}
            >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition ${colorClass}`}>
                <Home className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg text-gray-800">{hostel.name}</h3>
                <p className="text-sm text-gray-500 mt-1 capitalize">{hostel.type} Hostel</p>
            </div>
            );
        })}
      </div>
    </div>
  );

  const renderHostelView = () => {
    const hostelData = HOSTELS.find(h => h.id === selectedHostel);
    const items = getHostelItems(selectedHostel);
    // Blue for Boys, Pink for Girls
    const bgLight = hostelData?.type === 'boys' ? 'bg-blue-100' : 'bg-pink-100';
    const textDark = hostelData?.type === 'boys' ? 'text-blue-600' : 'text-pink-600';

    return (
      <div className="max-w-5xl mx-auto p-6">
        <button 
          onClick={() => { setView('landing'); setSelectedHostel(null); }}
          className={`flex items-center gap-2 text-gray-500 hover:${textDark} mb-6 transition`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hostels
        </button>

        <div className="flex items-center gap-3 mb-8">
            <div className={`${bgLight} p-3 rounded-lg`}>
                <MapPin className={`w-6 h-6 ${textDark}`} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{hostelData?.name}</h2>
                <p className="text-gray-500 text-sm">Browsing available items</p>
            </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No items currently listed in this hostel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelectedProduct({ ...item, hostelId: selectedHostel })}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md cursor-pointer transition flex items-center gap-4 group"
              >
                <div className="text-4xl group-hover:scale-110 transition-transform">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{item.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">{item.category}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-gray-400 mb-1">Starts from</p>
                   <span className={`block font-bold text-lg ${textDark}`}>₹{item.minPrice}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProductModal = () => {
    if (!selectedProduct) return null;
    const sellersWithVariants = getItemSellers(selectedProduct.hostelId, selectedProduct.id);
    const hostelData = HOSTELS.find(h => h.id === selectedProduct.hostelId);
    const isBoy = hostelData?.type === 'boys';
    const headerBg = isBoy ? 'bg-blue-50' : 'bg-pink-50';
    const headerBorder = isBoy ? 'border-blue-100' : 'border-pink-100';
    const priceText = isBoy ? 'text-blue-600' : 'text-pink-600';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
          <div className={`${headerBg} p-6 text-center border-b ${headerBorder} shrink-0`}>
            <div className="text-6xl mb-2 drop-shadow-sm">{selectedProduct.icon}</div>
            <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h2>
            <p className="text-gray-500 text-sm mt-1">Available Sellers</p>
          </div>
          
          <div className="p-6 overflow-y-auto">
            <div className="space-y-4">
              {sellersWithVariants.map((s, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg bg-white shadow-sm overflow-hidden">
                    <div className="bg-gray-50 p-3 flex items-center gap-3 border-b border-gray-100">
                        <div className="bg-white p-1.5 rounded-full shadow-sm">
                            <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                            <p className="text-xs text-gray-500">Room {s.room}</p>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                        {s.variants.map((v) => (
                            <div key={v.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">
                                        {v.variantNote ? v.variantNote : 'Standard'}
                                    </span>
                                    <span className="text-xs text-green-600">{v.quantity} in stock</span>
                                </div>
                                <div className={`font-bold ${priceText}`}>
                                    ₹{v.price}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 text-center shrink-0">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="text-gray-600 font-medium hover:text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLogin = () => (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
        <div className="text-center mb-8">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-6 h-6 text-green-600" />
            </div>
          <h2 className="text-2xl font-bold text-gray-800">Seller Login</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              required
              value={loginForm.username}
              onChange={e => setLoginForm({...loginForm, username: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="e.g. ayush"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={loginForm.password}
              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="••••••"
            />
          </div>
          {loginError && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{loginError}</p>}
          <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 transition shadow-sm">Login</button>
        </form>
        
        <div className="mt-6 space-y-4 text-center">
            <p className="text-xs text-gray-400">Demo: ayush / 123</p>
            <div className="border-t border-gray-100 pt-4">
                <button 
                    onClick={() => setView('landing')}
                    className="flex items-center justify-center w-full gap-2 text-sm font-medium text-gray-500 hover:text-green-600 transition"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Purchaser View
                </button>
            </div>
        </div>
      </div>
    </div>
  );

  const renderAddProductModal = () => {
    if (!showAddProductModal) return null;
    
    const activeItems = getUserActiveItems(currentUser.id);
    const availableStandard = STANDARD_ITEMS.filter(si => !activeItems.some(ai => ai.id === si.id));
    const userCustomCount = customItems.filter(i => i.creatorId === currentUser.id).length;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">Add Product to Dashboard</h3>
            <button onClick={() => setShowAddProductModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
          </div>
          
          <div className="flex border-b border-gray-100">
            <button 
                className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'standard' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('standard')}
            >
                Standard List
            </button>
            <button 
                className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'custom' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('custom')}
            >
                Create Custom ({userCustomCount}/5)
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'standard' ? (
                <div className="space-y-2">
                    {availableStandard.length === 0 ? (
                        <p className="text-center text-gray-500 py-4 text-sm">You have added all standard items.</p>
                    ) : (
                        availableStandard.map(item => (
                            <button 
                                key={item.id}
                                onClick={() => handleAddProductToDashboard(item.id, item.defaultPrice)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-100 transition text-left group"
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-400">Default: ₹{item.defaultPrice}</p>
                                </div>
                                <Plus className="w-5 h-5 text-green-400 group-hover:text-green-600" />
                            </button>
                        ))
                    )}
                </div>
            ) : (
                <form onSubmit={handleCreateCustomItem} className="space-y-4">
                    {userCustomCount >= 5 ? (
                         <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                            Maximum limit of 5 custom products reached. Please delete an existing custom product to add a new one.
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                                <input 
                                    type="text" required placeholder="e.g. Homemade Cake"
                                    value={customForm.name} onChange={e => setCustomForm({...customForm, name: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (₹)</label>
                                    <input 
                                        type="number" required min="0" placeholder="50"
                                        value={customForm.price} onChange={e => setCustomForm({...customForm, price: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Icon / Emoji</label>
                                    <input 
                                        type="text" required placeholder="e.g. 🍰" maxLength="2"
                                        value={customForm.icon} onChange={e => setCustomForm({...customForm, icon: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-center"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition mt-2">
                                Create & Add
                            </button>
                        </>
                    )}
                </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!currentUser) return null;

    const myActiveItems = getUserActiveItems(currentUser.id);

    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {currentUser.name}!</h1>
          <div className="flex flex-wrap gap-4 text-green-100 text-sm">
            <span className="flex items-center gap-1"><Home className="w-4 h-4" /> {currentUser.hostel}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Room {currentUser.room}</span>
          </div>
          <div className="mt-4 bg-white/10 p-3 rounded text-xs">
             Items you add here will be visible to buyers in <strong>{currentUser.hostel}</strong>.
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Tag className="w-5 h-5 text-green-600" /> My Inventory
            </h2>
            <button 
                onClick={() => setShowAddProductModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
            >
                <Plus className="w-4 h-4" /> Add Product
            </button>
        </div>
        
        <div className="space-y-6">
            {myActiveItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-600">Your dashboard is empty</h3>
                    <p className="text-gray-400 mb-6">Start by adding products you want to sell.</p>
                    <button 
                        onClick={() => setShowAddProductModal(true)}
                        className="text-green-600 font-bold hover:underline"
                    >
                        Add your first product
                    </button>
                </div>
            ) : (
                myActiveItems.map(item => {
                const myVariants = inventory.filter(inv => inv.sellerId === currentUser.id && inv.itemId === item.id);
                
                return (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    {/* Item Header */}
                    <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">{item.icon}</div>
                            <div>
                            <h3 className="font-bold text-gray-800">{item.name}</h3>
                            <p className="text-xs text-gray-400">Ref: ₹{item.defaultPrice}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handleAddVariant(item.id)}
                                className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-200 transition"
                            >
                                <Plus className="w-3 h-3" /> Add Variant
                            </button>
                            <button 
                                onClick={() => handleDeleteProduct(item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                title="Delete entire product"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Variants List */}
                    <div className="divide-y divide-gray-100">
                        {myVariants.map(variant => {
                            const isDuplicate = checkDuplicateNote(variant.id, item.id, variant.variantNote);
                            
                            return (
                            <div key={variant.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-gray-50 transition">
                                {/* Note Input */}
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 font-bold mb-1 block uppercase">Variant / Note</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Spicy, Cold..."
                                            value={variant.variantNote}
                                            onChange={(e) => handleUpdateVariant(variant.id, 'variantNote', e.target.value)}
                                            className={`w-full px-3 py-1.5 border rounded text-sm outline-none transition ${isDuplicate ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'}`}
                                        />
                                        {isDuplicate && <AlertCircle className="w-4 h-4 text-red-500 absolute right-2 top-1/2 -translate-y-1/2" />}
                                    </div>
                                    {isDuplicate && <p className="text-xs text-red-500 mt-1">This variant name already exists.</p>}
                                </div>

                                {/* Price Input */}
                                <div className="w-full md:w-32">
                                    <label className="text-xs text-gray-500 font-bold mb-1 block uppercase">Price (₹)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={variant.price}
                                        onChange={(e) => handleUpdateVariant(variant.id, 'price', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                    />
                                </div>

                                {/* Quantity Controls */}
                                <div className="w-full md:w-auto flex items-end justify-between md:justify-start gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold mb-1 block uppercase">Quantity</label>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleUpdateVariant(variant.id, 'quantity', variant.quantity - 1)}
                                                disabled={variant.quantity === 0}
                                                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-8 text-center font-bold text-sm">{variant.quantity}</span>
                                            <button 
                                                onClick={() => handleUpdateVariant(variant.id, 'quantity', variant.quantity + 1)}
                                                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Remove Variant Button */}
                                    <button 
                                        onClick={() => handleRemoveVariant(variant.id)}
                                        className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition mb-0.5"
                                        title="Remove this variant"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )})}
                    </div>
                    </div>
                );
                })
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {renderHeader()}
      <main>
        {view === 'landing' && renderLanding()}
        {view === 'hostel-view' && renderHostelView()}
        {view === 'login' && renderLogin()}
        {view === 'dashboard' && renderDashboard()}
      </main>
      {renderProductModal()}
      {renderAddProductModal()}
    </div>
  );
}