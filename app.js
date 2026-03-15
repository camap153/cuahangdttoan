const products = [
    {
        id: 1,
        name: "iPhone 15 Pro Max",
        price: 32990000,
        image: "iphone15.png",
        category: "Apple"
    },
    {
        id: 2,
        name: "Samsung Galaxy S24 Ultra",
        price: 30990000,
        image: "s24.png",
        category: "Samsung"
    },
    {
        id: 3,
        name: "Xiaomi 14 Pro",
        price: 18990000,
        image: "xiaomi14.png",
        category: "Xiaomi"
    },
    {
        id: 4,
        name: "Oppo Find X7 Ultra",
        price: 21990000,
        image: "oppo.png",
        category: "Oppo"
    }
];

let cart = [];

function init() {
    renderProducts();
    setupEventListeners();
}

function renderProducts() {
    const productList = document.getElementById('product-list');
    productList.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" style="width: 100%; margin-bottom: 1rem;">
            <h3>${product.name}</h3>
            <p style="color: var(--primary); font-weight: 700; font-size: 1.25rem; margin-bottom: 1rem;">
                ${product.price.toLocaleString('vi-VN')}đ
            </p>
            <button onclick="addToCart(${product.id})" class="btn btn-primary full-width">Thêm vào giỏ</button>
        </div>
    `).join('');
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
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    cart.push(product);
    updateCart();
}

function updateCart() {
    const cartCount = document.querySelector('.cart-count');
    cartCount.innerText = cart.length;
}

init();
