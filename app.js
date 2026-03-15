const PHONE_PRODUCTS_URL = "https://giavinh123-default-rtdb.asia-southeast1.firebasedatabase.app/phone_products.json";

let products = [];
let cart = [];

async function init() {
    await fetchProducts();
    setupEventListeners();
}

async function fetchProducts() {
    try {
        const res = await fetch(PHONE_PRODUCTS_URL);
        const data = await res.json();
        if (data) {
            products = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        }
        renderProducts();
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

function renderProducts() {
    const productList = document.getElementById('product-list');
    productList.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-img-wrapper" style="background: #f1f5f9; border-radius: 8px; margin-bottom: 1rem; padding: 1rem;">
                <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 200px; object-fit: contain;">
            </div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${product.name}</h3>
            <p style="color: var(--primary); font-weight: 700; font-size: 1.25rem; margin-bottom: 1.5rem;">
                ${product.price.toLocaleString('vi-VN')}đ
            </p>
            <button onclick="addToCart(${product.id})" class="btn btn-primary full-width" style="justify-content: center; width: 100%;">
                <i data-lucide="shopping-cart" style="width: 18px; margin-right: 8px;"></i> Thêm vào giỏ
            </button>
        </div>
    `).join('');
    lucide.createIcons();
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
    const serviceBtns = document.querySelectorAll('.btn-secondary[href="#services"]');

    serviceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            repairModal.classList.add('active');
        });
    });

    closeRepair.addEventListener('click', () => {
        repairModal.classList.remove('active');
    });

    window.addEventListener('click', (e) => {
        if (e.target === repairModal) repairModal.classList.remove('active');
    });

    // Form Submit
    const repairForm = document.getElementById('repair-form');
    repairForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Cảm ơn bạn! Chúng tôi sẽ liên hệ trong ít phút để xác nhận yêu cầu sửa chữa.');
        repairModal.classList.remove('active');
        repairForm.reset();
    });

    // Cart Sidebar Toggle
    const cartBtn = document.getElementById('cart-btn');
    const closeCart = document.getElementById('close-cart');
    const sidebar = document.getElementById('cart-sidebar');

    cartBtn.addEventListener('click', () => sidebar.classList.add('active'));
    closeCart.addEventListener('click', () => sidebar.classList.remove('active'));
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    cart.push(product);
    updateCart();
    document.getElementById('cart-sidebar').classList.add('active');
}

function updateCart() {
    const cartCount = document.querySelector('.cart-count');
    cartCount.innerText = cart.length;

    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Giỏ hàng trống</p>';
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: contain; background: #f8fafc; border-radius: 8px;">
                <div style="flex: 1;">
                    <h4 style="font-size: 0.9rem;">${item.name}</h4>
                    <p style="color: var(--primary); font-weight: 600;">${item.price.toLocaleString('vi-VN')}đ</p>
                </div>
                <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                    <i data-lucide="trash-2" style="width: 18px;"></i>
                </button>
            </div>
        `).join('');
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.innerText = total.toLocaleString('vi-VN') + 'đ';
    lucide.createIcons();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

init();
