// Narhari Jewellery Store Website - Main JS Logic

// Global WhatsApp base number (including country code)
const WHATSAPP_BASE_NUM = "919226251524";

// State Management
let cart = JSON.parse(localStorage.getItem('narhari_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('narhari_wishlist')) || [];

document.addEventListener('DOMContentLoaded', () => {
  initCommonUI();
  initCartAndWishlist();
  initSearch();
  initWhatsAppWidget();
  
  // Dynamic page elements loader
  loadDynamicElements();
});

// --- Common UI Functions ---
function initCommonUI() {
  // Sticky Navigation Header
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Mobile Navigation Drawer Toggle (Simple Slide Menu)
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('nav.nav-menu');
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
      // Style toggle spans
      const spans = menuToggle.querySelectorAll('span');
      if (navMenu.classList.contains('active')) {
        navMenu.style.display = 'flex';
        navMenu.style.flexDirection = 'column';
        navMenu.style.position = 'fixed';
        navMenu.style.top = '0';
        navMenu.style.right = '0';
        navMenu.style.width = '280px';
        navMenu.style.height = '100vh';
        navMenu.style.backgroundColor = 'var(--dark-accent)';
        navMenu.style.padding = '100px 30px';
        navMenu.style.boxShadow = 'var(--shadow-dark)';
        navMenu.style.zIndex = '999';
        navMenu.style.gap = '25px';
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        navMenu.removeAttribute('style');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }

  // Setup standard drawers trigger (Cart and Wishlist close / open)
  const overlay = document.querySelector('.drawer-overlay');
  const cartDrawer = document.getElementById('cart-drawer');
  const wishlistDrawer = document.getElementById('wishlist-drawer');

  // Trigger buttons
  const cartTriggers = document.querySelectorAll('.cart-trigger');
  const wishlistTriggers = document.querySelectorAll('.wishlist-trigger');
  const drawerCloses = document.querySelectorAll('.drawer-close-btn');

  const closeDrawers = () => {
    overlay?.classList.remove('active');
    cartDrawer?.classList.remove('active');
    wishlistDrawer?.classList.remove('active');
  };

  cartTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawers();
      overlay?.classList.add('active');
      cartDrawer?.classList.add('active');
      renderCartItems();
    });
  });

  wishlistTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawers();
      overlay?.classList.add('active');
      wishlistDrawer?.classList.add('active');
      renderWishlistItems();
    });
  });

  drawerCloses.forEach(btn => btn.addEventListener('click', closeDrawers));
  overlay?.addEventListener('click', closeDrawers);

  // Setup Contact Form if exists
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cf-name').value;
      const email = document.getElementById('cf-email').value;
      const message = document.getElementById('cf-message').value;

      showToast(`Thank you, ${name}! Your message has been sent successfully.`);
      contactForm.reset();
    });
  }

  // Setup Newsletter form if exists
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input');
      showToast(`Successfully subscribed with ${emailInput.value}!`);
      emailInput.value = '';
    });
  }
}

// --- Cart and Wishlist Logic ---
function initCartAndWishlist() {
  updateBadges();
}

function updateBadges() {
  const cartBadges = document.querySelectorAll('.cart-badge');
  const wishlistBadges = document.querySelectorAll('.wishlist-badge');

  const totalCartQty = cart.reduce((total, item) => total + item.quantity, 0);

  cartBadges.forEach(badge => {
    badge.textContent = totalCartQty;
    badge.style.display = totalCartQty > 0 ? 'flex' : 'none';
  });

  wishlistBadges.forEach(badge => {
    badge.textContent = wishlist.length;
    badge.style.display = wishlist.length > 0 ? 'flex' : 'none';
  });
}

function addToCart(productId, quantity = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existingItemIndex = cart.findIndex(item => item.id === productId);
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }

  localStorage.setItem('narhari_cart', JSON.stringify(cart));
  updateBadges();
  showToast(`Added "${product.name}" to cart.`);
  renderCartItems();
}

function toggleWishlist(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existingIndex = wishlist.findIndex(item => item.id === productId);
  let added = false;
  if (existingIndex > -1) {
    wishlist.splice(existingIndex, 1);
  } else {
    wishlist.push(product);
    added = true;
  }

  localStorage.setItem('narhari_wishlist', JSON.stringify(wishlist));
  updateBadges();
  
  if (added) {
    showToast(`Added "${product.name}" to wishlist.`);
  } else {
    showToast(`Removed "${product.name}" from wishlist.`, true);
  }

  // Update active state of hearts in current viewport
  const heartBtns = document.querySelectorAll(`.wishlist-btn[data-id="${productId}"]`);
  heartBtns.forEach(btn => {
    btn.classList.toggle('active', added);
  });

  renderWishlistItems();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('narhari_cart', JSON.stringify(cart));
  updateBadges();
  renderCartItems();
}

function updateCartQty(productId, delta) {
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
    localStorage.setItem('narhari_cart', JSON.stringify(cart));
    updateBadges();
    renderCartItems();
  }
}

// Render list of cart items in the drawer
function renderCartItems() {
  const cartListContainer = document.getElementById('cart-items-list');
  const cartTotalValue = document.getElementById('cart-total-value');
  
  if (!cartListContainer) return;

  if (cart.length === 0) {
    cartListContainer.innerHTML = '<p class="empty-drawer-msg">Your shopping cart is empty.</p>';
    if (cartTotalValue) cartTotalValue.textContent = '₹0';
    return;
  }

  let html = '';
  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    html += `
      <div class="drawer-item">
        <img src="${item.image}" alt="${item.name}" class="drawer-item-img">
        <div class="drawer-item-details">
          <h4>${item.name}</h4>
          <p class="item-price">₹${item.price.toLocaleString('en-IN')}</p>
          <div class="qty-controls">
            <span class="qty-btn" onclick="updateCartQty('${item.id}', -1)">-</span>
            <span class="qty-val">${item.quantity}</span>
            <span class="qty-btn" onclick="updateCartQty('${item.id}', 1)">+</span>
          </div>
        </div>
        <span class="drawer-item-remove" onclick="removeFromCart('${item.id}')">
          <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </span>
      </div>
    `;
  });

  cartListContainer.innerHTML = html;
  if (cartTotalValue) cartTotalValue.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
}

// Render list of wishlist items in the drawer
function renderWishlistItems() {
  const wishlistListContainer = document.getElementById('wishlist-items-list');
  if (!wishlistListContainer) return;

  if (wishlist.length === 0) {
    wishlistListContainer.innerHTML = '<p class="empty-drawer-msg">Your wishlist is empty.</p>';
    return;
  }

  let html = '';
  wishlist.forEach(item => {
    html += `
      <div class="drawer-item">
        <img src="${item.image}" alt="${item.name}" class="drawer-item-img">
        <div class="drawer-item-details">
          <h4>${item.name}</h4>
          <p class="item-price">₹${item.price.toLocaleString('en-IN')}</p>
          <button class="btn-gold" style="padding: 6px 12px; font-size: 0.65rem;" onclick="addToCart('${item.id}'); toggleWishlist('${item.id}');">Move to Cart</button>
        </div>
        <span class="drawer-item-remove" onclick="toggleWishlist('${item.id}')">
          <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      </div>
    `;
  });

  wishlistListContainer.innerHTML = html;
}

// Mock Checkout Function
function checkout() {
  if (cart.length === 0) {
    showToast("Your cart is empty!", true);
    return;
  }
  
  // Format items for a custom WhatsApp template checkout
  let message = `Hello Narhari Jewellery, I would like to place an order:\n\n`;
  let subtotal = 0;
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    message += `• ${item.name} (${item.quantity}x) - ₹${(item.price * item.quantity).toLocaleString('en-IN')}\n`;
  });
  message += `\nTotal Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n`;
  message += `Please confirm availability. Thank you!`;

  const encodedMsg = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_BASE_NUM}?text=${encodedMsg}`;
  
  showToast("Redirecting to WhatsApp Checkout...");
  setTimeout(() => {
    window.open(whatsappUrl, '_blank');
  }, 1000);
}

// --- Search Modal Overlay Logic ---
function initSearch() {
  const searchTrigger = document.querySelector('.search-trigger');
  const searchOverlay = document.getElementById('search-overlay');
  const searchClose = document.getElementById('search-close');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results-list');

  if (!searchTrigger || !searchOverlay) return;

  const openSearch = (e) => {
    e.preventDefault();
    searchOverlay.classList.add('active');
    setTimeout(() => searchInput?.focus(), 300);
  };

  const closeSearch = () => {
    searchOverlay.classList.remove('active');
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
  };

  searchTrigger.addEventListener('click', openSearch);
  searchClose?.addEventListener('click', closeSearch);

  // Close search on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
      closeSearch();
    }
  });

  // Handle Search Input matching
  searchInput?.addEventListener('keyup', () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
      searchResults.innerHTML = '';
      return;
    }

    const filtered = PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      searchResults.innerHTML = '<p class="empty-drawer-msg" style="color:#fff;">No jewelry matches your query.</p>';
      return;
    }

    let html = '';
    filtered.forEach(item => {
      html += `
        <div class="search-result-item" onclick="handleSearchResultClick('${item.id}')">
          <img src="${item.image}" alt="${item.name}" class="search-result-item-img">
          <div class="search-result-item-details">
            <h4>${item.name}</h4>
            <p>₹${item.price.toLocaleString('en-IN')}</p>
          </div>
        </div>
      `;
    });
    searchResults.innerHTML = html;
  });
}

function handleSearchResultClick(productId) {
  // Directly add to cart & open cart drawer as navigation helper
  addToCart(productId);
  const searchOverlay = document.getElementById('search-overlay');
  searchOverlay.classList.remove('active');
  
  // Open Cart drawer after a tiny delay
  setTimeout(() => {
    const overlay = document.querySelector('.drawer-overlay');
    const cartDrawer = document.getElementById('cart-drawer');
    overlay?.classList.add('active');
    cartDrawer?.classList.add('active');
    renderCartItems();
  }, 300);
}

// --- WhatsApp Chat Widget Logic ---
function initWhatsAppWidget() {
  const waBtn = document.getElementById('wa-btn-float');
  const waChat = document.getElementById('wa-chatbox');

  if (!waBtn || !waChat) return;

  waBtn.addEventListener('click', () => {
    waChat.classList.toggle('active');
  });

  // Close widget if clicked outside
  document.addEventListener('click', (e) => {
    if (!waBtn.contains(e.target) && !waChat.contains(e.target)) {
      waChat.classList.remove('active');
    }
  });
}

function sendWhatsAppMessage(templateText) {
  const url = `https://wa.me/${WHATSAPP_BASE_NUM}?text=${encodeURIComponent(templateText)}`;
  window.open(url, '_blank');
  
  // Close chatbox
  const waChat = document.getElementById('wa-chatbox');
  waChat?.classList.remove('active');
}

// --- Toast Notification helper ---
function showToast(message, isRemove = false) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${isRemove ? 'toast-remove' : ''}`;
  
  const icon = isRemove 
    ? `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`
    : `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(-120%)';
    toast.style.transition = 'transform 0.5s ease-in-out';
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

// --- Dynamic elements loader on page visits ---
function loadDynamicElements() {
  // 1. Home Page Bestsellers
  const bestSellersContainer = document.querySelector('.js-best-sellers');
  if (bestSellersContainer) {
    const bestSellers = PRODUCTS.filter(p => p.isBestseller);
    bestSellersContainer.innerHTML = generateProductsGridHtml(bestSellers);
  }

  // 2. Collection Page Catalog Loader
  const productsCatalog = document.querySelector('.js-products-catalog');
  if (productsCatalog) {
    setupCatalogFiltering(productsCatalog);
  }

  // 3. Category Specific Page Catalog Loaders
  // Look for elements requesting a hardcoded category filter
  const categoryContainer = document.querySelector('.js-category-products');
  if (categoryContainer) {
    const catType = categoryContainer.dataset.category;
    if (catType) {
      let filtered = [];
      if (catType === 'traditional') {
        filtered = PRODUCTS.filter(p => p.isTraditional);
      } else if (catType === 'daily-wear') {
        filtered = PRODUCTS.filter(p => p.isDailywear);
      } else {
        filtered = PRODUCTS.filter(p => p.category === catType);
      }
      categoryContainer.innerHTML = generateProductsGridHtml(filtered);
    }
  }
}

// Generate the product card elements dynamically
function generateProductsGridHtml(productList) {
  if (productList.length === 0) {
    return '<p class="empty-drawer-msg" style="grid-column: 1/-1;">No products found in this category.</p>';
  }

  return productList.map(item => {
    const inWishlist = wishlist.some(w => w.id === item.id);
    return `
      <div class="product-card">
        <div class="product-image-wrapper">
          ${item.isBestseller ? '<span class="badge-gold">Bestseller</span>' : ''}
          <button class="wishlist-btn ${inWishlist ? 'active' : ''}" data-id="${item.id}" onclick="toggleWishlist('${item.id}')">
            <svg style="width: 18px; height: 18px;" fill="${inWishlist ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="product-info">
          <span class="product-cat">${item.category.replace('-', ' ')}</span>
          <h3 class="product-title">${item.name}</h3>
          <div class="product-rating">
            <span>★★★★★</span>
            <span class="rating-count">(${item.reviews})</span>
          </div>
          <div class="product-price-row">
            <span class="price">₹${item.price.toLocaleString('en-IN')}</span>
            <span class="original-price">₹${item.originalPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div class="product-card-actions">
          <button class="add-to-cart-btn" onclick="addToCart('${item.id}')">
            <svg style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Add To Cart
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Catalog filtering logic for collections.html
function setupCatalogFiltering(container) {
  // Checkboxes
  const filters = {
    categories: [],
    types: [],
    price: 'all',
    sort: 'default'
  };

  // Find all category filters checkboxes
  const catCheckboxes = document.querySelectorAll('.js-filter-category');
  const typeCheckboxes = document.querySelectorAll('.js-filter-type');
  const priceSelect = document.getElementById('filter-price-select');
  const sortSelect = document.getElementById('sort-select');
  const resultCount = document.getElementById('results-count-num');

  const filterAndRender = () => {
    let list = [...PRODUCTS];

    // Filter categories
    if (filters.categories.length > 0) {
      list = list.filter(item => filters.categories.includes(item.category));
    }

    // Filter type (necklace, ring, etc.)
    if (filters.types.length > 0) {
      list = list.filter(item => filters.types.includes(item.type));
    }

    // Filter price ranges
    if (filters.price !== 'all') {
      const [min, max] = filters.price.split('-').map(Number);
      if (max) {
        list = list.filter(item => item.price >= min && item.price <= max);
      } else {
        list = list.filter(item => item.price >= min);
      }
    }

    // Sorting
    if (filters.sort === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (filters.sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    container.innerHTML = generateProductsGridHtml(list);
    if (resultCount) resultCount.textContent = list.length;
  };

  catCheckboxes.forEach(chk => {
    chk.addEventListener('change', () => {
      if (chk.checked) {
        filters.categories.push(chk.value);
      } else {
        filters.categories = filters.categories.filter(c => c !== chk.value);
      }
      filterAndRender();
    });
  });

  typeCheckboxes.forEach(chk => {
    chk.addEventListener('change', () => {
      if (chk.checked) {
        filters.types.push(chk.value);
      } else {
        filters.types = filters.types.filter(t => t !== chk.value);
      }
      filterAndRender();
    });
  });

  priceSelect?.addEventListener('change', (e) => {
    filters.price = e.target.value;
    filterAndRender();
  });

  sortSelect?.addEventListener('change', (e) => {
    filters.sort = e.target.value;
    filterAndRender();
  });

  // Check URL query parameters for active filter triggers
  const params = new URLSearchParams(window.location.search);
  const urlCategory = params.get('category');
  if (urlCategory) {
    const targetCheckbox = Array.from(catCheckboxes).find(c => c.value === urlCategory);
    if (targetCheckbox) {
      targetCheckbox.checked = true;
      filters.categories.push(urlCategory);
    }
  }

  // Trigger initial render
  filterAndRender();
}

// Global functions for inline HTML event handling (e.g. onclick)
window.updateCartQty = updateCartQty;
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;
window.toggleWishlist = toggleWishlist;
window.checkout = checkout;
window.sendWhatsAppMessage = sendWhatsAppMessage;
window.handleSearchResultClick = handleSearchResultClick;
