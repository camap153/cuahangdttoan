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
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
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
    
    if (!billContainer || !billDate || !billItems || !billTotal) return;
    
    // Set date
    const now = new Date();
    billDate.innerText = `Ngày: ${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN')}`;
    
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
    billItems.innerHTML = itemsArray.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0;">${item.name}</td>
            <td style="text-align: center; padding: 10px 0;">${item.quantity}</td>
            <td style="text-align: right; padding: 10px 0;">${(item.price || 0).toLocaleString('vi-VN')}đ</td>
        </tr>
    `).join('');
    
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
        link.download = `Bill-ToanStore-${now.getTime()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        billContainer.style.display = 'none'; // Hide back

        // Save Order to Firebase with grouped items
        await saveOrderToFirebase(itemsArray, total);

        // Clear cart after successful checkout
        cart = [];
        saveCartToStorage();
        updateCart();
        alert("Đã lưu đơn hàng và xuất hóa đơn thành công!");
    }).catch(err => {
        console.error("Error capturing bill:", err);
        alert("Có lỗi khi tạo ảnh hóa đơn.");
        billContainer.style.display = 'none';
    });
}

async function saveOrderToFirebase(items, total) {
    try {
        const ordersRef = ref(db, 'orders');
        const newOrderRef = push(ordersRef);
        await set(newOrderRef, {
            items: items.map(i => ({ 
                name: i.name, 
                price: i.price, 
                quantity: i.quantity 
            })),
            total: total,
            createdAt: new Date().toISOString(),
            status: 'completed'
        });
    } catch (error) {
        console.error("Error saving order:", error);
        alert("Lỗi khi lưu đơn hàng vào hệ thống: " + error.message);
    }
}

function saveCartToStorage() {
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
    if (cartCount) cartCount.innerText = cart.length;

    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Giỏ hàng trống</p>';
        } else {
            cartItems.innerHTML = cart.map((item, index) => `
                <div class="cart-item" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                    <img src="${item.image ? (item.image.startsWith('http') ? item.image : 'hinhsanpham/' + item.image) : ''}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: contain; background: #f8fafc; border-radius: 8px;">
                    <div style="flex: 1;">
                        <h4 style="font-size: 0.9rem;">${item.name}</h4>
                        <p style="color: var(--primary); font-weight: 600;">${(item.price || 0).toLocaleString('vi-VN')}đ</p>
                    </div>
                    <button class="remove-btn" data-index="${index}" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                        <i data-lucide="trash-2" style="width: 18px;"></i>
                    </button>
                </div>
            `).join('');
            
            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.getAttribute('data-index'));
                    removeFromCart(idx);
                });
            });
        }
    }

    const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    if (cartTotal) cartTotal.innerText = total.toLocaleString('vi-VN') + 'đ';
    if (window.lucide) lucide.createIcons();
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
