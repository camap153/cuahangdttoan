import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, push, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let products = [];
let cart = [];
let currentCategory = 'all';

function init() {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('phoneShopCart');
    console.log("Loading cart from storage:", savedCart);
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            console.error("Error parsing saved cart:", e);
            cart = [];
        }
    }

    listenToProducts();
    setupEventListeners();
    setupCategoryFilters();
    setupCartActions();
    updateCart(); // Render initial cart
}

function listenToProducts() {
    const productsRef = ref(db, 'phone_products');
    onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            products = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        } else {
            products = [];
        }
        renderProducts();
    });
}

function renderProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;
    
    const filteredProducts = currentCategory === 'all' 
        ? products 
        : products.filter(p => p.category === currentCategory);

    productList.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <div class="product-img-wrapper" style="background: #f1f5f9; border-radius: 8px; margin-bottom: 1rem; padding: 1rem;">
                <img src="${product.image ? (product.image.startsWith('http') ? product.image : 'hinhsanpham/' + product.image) : ''}" alt="${product.name}" style="width: 100%; height: 200px; object-fit: contain;">
            </div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${product.name}</h3>
            <p style="color: var(--primary); font-weight: 700; font-size: 1.25rem; margin-bottom: 1.5rem;">
                ${(product.price || 0).toLocaleString('vi-VN')}đ
            </p>
            <button class="btn btn-primary full-width add-to-cart-btn" data-id="${product.id}" style="justify-content: center; width: 100%;">
                <i data-lucide="shopping-cart" style="width: 18px; margin-right: 8px;"></i> Thêm vào giỏ
            </button>
        </div>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
    
    // Add event listeners to newly created buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            addToCart(id);
        });
    });
}

function setupEventListeners() {
    // Header Scroll Effect
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (window.scrollY > 50) {
            header.style.padding = '0';
            header.style.boxShadow = 'var(--shadow)';
        } else {
            header.style.padding = '10px 0';
            header.style.boxShadow = 'none';
        }
    });

    // Modal Logic
    const repairModal = document.getElementById('repair-modal');
    const closeRepair = document.getElementById('close-modal');
    const serviceBtns = document.querySelectorAll('.btn-secondary[href="#services"], .service-card');

    serviceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            repairModal.classList.add('active');
            
            // If it's a service card, pre-fill the service field
            if (btn.classList.contains('service-card')) {
                const serviceName = btn.querySelector('h3').innerText;
                const serviceInput = document.getElementById('service');
                if (serviceInput) serviceInput.value = serviceName;
            }
        });
    });

    if (closeRepair) {
        closeRepair.addEventListener('click', () => {
            repairModal.classList.remove('active');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === repairModal) repairModal.classList.remove('active');
    });

    // Form Submit
    const repairForm = document.getElementById('repair-form');
    if (repairForm) {
        repairForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                service: document.getElementById('service').value,
                message: document.getElementById('message').value,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            try {
                const bookingsRef = ref(db, 'bookings');
                const newBookingRef = push(bookingsRef);
                await set(newBookingRef, formData);
                
                alert('Cảm ơn bạn! Chúng tôi đã nhận được yêu cầu và sẽ liên hệ trong ít phút.');
                repairModal.classList.remove('active');
                repairForm.reset();
            } catch (error) {
                console.error("Error saving booking:", error);
                alert('Có lỗi xảy ra, vui lòng thử lại sau.');
            }
        });
    }

    // Cart Sidebar Toggle
    const cartBtn = document.getElementById('cart-btn');
    const closeCart = document.getElementById('close-cart');
    const sidebar = document.getElementById('cart-sidebar');

    if (cartBtn) cartBtn.addEventListener('click', () => sidebar.classList.add('active'));
    if (closeCart) closeCart.addEventListener('click', () => sidebar.classList.remove('active'));
}

function setupCartActions() {
    // Add custom service
    const addCustomBtn = document.getElementById('add-custom-btn');
    if (addCustomBtn) {
        addCustomBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('custom-name');
            const priceInput = document.getElementById('custom-price');
            
            const name = nameInput.value.trim();
            const price = parseInt(priceInput.value);
            
            if (name && !isNaN(price)) {
                const customItem = {
                    id: 'custom-' + Date.now(),
                    name: name,
                    price: price,
                    image: 'phone.png', // Default icon/image
                    isCustom: true
                };
                cart.push(customItem);
                updateCart();
                nameInput.value = '';
                priceInput.value = '';
            } else {
                alert('Vui lòng nhập đầy đủ tên dịch vụ và giá tiền hợp lệ.');
            }
        });
    }

    // Checkout and Print
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Giỏ hàng đang trống!');
                return;
            }
            printBill();
        });
    }
}

function printBill() {
    const billContainer = document.getElementById('bill-template');
    const billDate = document.getElementById('bill-date');
    const billItems = document.getElementById('bill-items');
    const billTotal = document.getElementById('bill-total');
    const billCustomer = document.getElementById('bill-customer-name');
    const customerInput = document.getElementById('customer-name');
    
    if (!billContainer || !billDate || !billItems || !billTotal || !billCustomer) return;
    
    // Set customer name
    const customerName = customerInput ? customerInput.value.trim() : "";
    billCustomer.innerText = customerName || "Khách lẻ";

    // Set date and ID
    const now = new Date();
    billDate.innerText = `Ngày: ${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN')}`;
    const billIdDisplay = document.getElementById('bill-id-display');
    if (billIdDisplay) billIdDisplay.innerText = `Số HĐ: ${Math.floor(now.getTime() / 1000)}`;
    
    // Group items by ID or Name+Price
    const groupedItems = cart.reduce((acc, item) => {
        const key = item.id || (item.name + item.price);
        if (!acc[key]) {
            acc[key] = { ...item, quantity: 1 };
        } else {
            acc[key].quantity += 1;
        }
        return acc;
    }, {});
    
    const itemsArray = Object.values(groupedItems);
    
    // Set items in bill
    billItems.innerHTML = itemsArray.map(item => {
        const pStr = (item.price || 0).toLocaleString('vi-VN');
        const tStr = ((item.price || 0) * item.quantity).toLocaleString('vi-VN');
        
        // Adaptive font size based on string length
        const getFontSize = (str) => {
            if (str.length > 10) return '10px';
            if (str.length > 8) return '11.5px';
            return '13px';
        };

        return `
        <tr style="border-bottom: 1px dashed #000;">
            <td style="padding: 10px 0; width: 42%; vertical-align: top; overflow-wrap: break-word; line-height: 1.2; font-size: 13px;">${item.name}</td>
            <td style="text-align: center; padding: 10px 0; width: 8%; vertical-align: top; font-size: 11px;">${item.quantity}</td>
            <td style="text-align: right; padding: 10px 0; width: 25%; vertical-align: top; white-space: nowrap; font-size: ${getFontSize(pStr)};">${pStr}</td>
            <td style="text-align: right; padding: 10px 0; width: 25%; vertical-align: top; font-weight: bold; white-space: nowrap; font-size: ${getFontSize(tStr)};">${tStr}</td>
        </tr>
    `}).join('');
    
    // Set total
    const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    billTotal.innerText = total.toLocaleString('vi-VN') + 'đ';
    
    // Capture and Download as Image
    billContainer.style.display = 'block'; // Briefly show for capture
    
    html2canvas(billContainer.querySelector('div'), {
        backgroundColor: "#ffffff",
        scale: 2 // Higher quality
    }).then(async canvas => {
        const link = document.createElement('a');
        link.download = `Bill-2TMobile-${now.getTime()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        billContainer.style.display = 'none'; // Hide back

        // Save Order to Firebase with grouped items
        await saveOrderToFirebase(itemsArray, total, customerName);

        // Clear cart after successful checkout
        cart = [];
        if (customerInput) customerInput.value = '';
        saveCartToStorage();
        updateCart();
        alert("Đã lưu đơn hàng và xuất hóa đơn thành công!");
    }).catch(err => {
        console.error("Error capturing bill:", err);
        alert("Có lỗi khi tạo ảnh hóa đơn.");
        billContainer.style.display = 'none';
    });
}

async function saveOrderToFirebase(items, total, customerName) {
    try {
        console.log("Saving order to Firebase...", items, total, customerName);
        const ordersRef = ref(db, 'orders');
        const newOrderRef = push(ordersRef);
        await set(newOrderRef, {
            customer: customerName || "Khách lẻ",
            items: items.map(i => ({ 
                name: i.name, 
                price: i.price, 
                quantity: i.quantity 
            })),
            total: total,
            createdAt: new Date().toISOString(),
            status: 'pending' // Default to pending
        });
        console.log("Order saved successfully!");
    } catch (error) {
        console.error("Error saving order:", error);
        alert("Lỗi khi lưu đơn hàng vào hệ thống: " + error.message);
    }
}

function saveCartToStorage() {
    console.log("Saving cart to storage:", cart);
    localStorage.setItem('phoneShopCart', JSON.stringify(cart));
}

function setupCategoryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Set category and re-render
            currentCategory = btn.getAttribute('data-category');
            renderProducts();
        });
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push({...product});
        saveCartToStorage();
        updateCart();
        document.getElementById('cart-sidebar').classList.add('active');
    }
}

function updateCart() {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    // Update cart count
    if (cartCount) cartCount.innerText = cart.length;

    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Giỏ hàng trống</p>';
        } else {
            // Group items for display
            const grouped = cart.reduce((acc, item) => {
                const key = item.id || (item.name + item.price);
                if (!acc[key]) {
                    acc[key] = { ...item, displayQty: 1, originalIndices: [cart.indexOf(item)] };
                } else {
                    acc[key].displayQty += 1;
                }
                return acc;
            }, {});

            cartItems.innerHTML = Object.values(grouped).map((item) => {
                const itemKey = item.id || (item.name + item.price);
                return `
                <div class="cart-item" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                    <img src="${item.image ? (item.image.startsWith('http') ? item.image : 'hinhsanpham/' + item.image) : ''}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: contain; background: #f8fafc; border-radius: 8px;">
                    <div style="flex: 1;">
                        <h4 style="font-size: 0.9rem;">${item.name}</h4>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <input type="number" class="price-edit-input" data-key="${itemKey}" value="${item.price}" 
                                    style="width: 85px; font-size: 0.85rem; padding: 2px 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-weight: 600; color: var(--primary); text-align: right;">
                                <span style="font-size: 0.8rem; font-weight: 600; color: var(--primary);">đ</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; background: #f1f5f9; padding: 2px 4px; border-radius: 8px;">
                                <span style="font-size: 0.75rem; color: #64748b;">SL:</span>
                                <input type="number" class="qty-edit-input" data-key="${itemKey}" value="${item.displayQty}" 
                                    style="width: 45px; font-size: 0.85rem; padding: 0 2px; border: none; background: transparent; text-align: center; font-weight: 600;">
                            </div>
                        </div>
                    </div>
                    <button class="remove-btn" data-key="${itemKey}" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                        <i data-lucide="trash-2" style="width: 18px;"></i>
                    </button>
                </div>
            `}).join('');
            
            // Add price edit listeners
            document.querySelectorAll('.price-edit-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const key = e.target.getAttribute('data-key');
                    const newPrice = parseInt(e.target.value) || 0;
                    updateItemPrice(key, newPrice);
                });
            });

            // Add qty edit listeners
            document.querySelectorAll('.qty-edit-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const key = e.target.getAttribute('data-key');
                    const newQty = parseInt(e.target.value) || 1;
                    updateItemQuantity(key, newQty);
                });
            });

            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.getAttribute('data-key');
                    removeGroupFromCart(key);
                });
            });
        }
    }

    const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    if (cartTotal) cartTotal.innerText = total.toLocaleString('vi-VN') + 'đ';
    if (window.lucide) lucide.createIcons();
}

function updateItemQuantity(key, newQty) {
    if (newQty < 1) newQty = 1;
    
    // Find first occurrence to keep as reference
    const index = cart.findIndex(item => (item.id || (item.name + item.price)) === key);
    if (index === -1) return;
    
    const baseItem = { ...cart[index] };
    
    // Remove all old versions of this group
    cart = cart.filter(item => (item.id || (item.name + item.price)) !== key);
    
    // Add back the new quantity
    for (let i = 0; i < newQty; i++) {
        cart.push({ ...baseItem });
    }
    
    saveCartToStorage();
    updateCart();
}

function updateItemPrice(key, newPrice) {
    cart.forEach(item => {
        const itemKey = item.id || (item.name + item.price);
        if (itemKey === key) {
            item.price = newPrice;
        }
    });
    saveCartToStorage();
    updateCart();
}

function removeGroupFromCart(key) {
    // Remove all items with this key
    cart = cart.filter(item => (item.id || (item.name + item.price)) !== key);
    saveCartToStorage();
    updateCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCartToStorage();
    updateCart();
}

// Global functions for inline handlers if needed (but we moved to event listeners)
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;

init();
