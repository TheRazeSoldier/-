// ==================== API Configuration ====================
const API_BASE = '';

// ==================== State ====================
let currentUser = null;
let currentToken = null;
let currentProvider = null;
let currentPage = 'home';
let currentPageData = null;
let navigationHistory = [];

// ==================== Helpers ====================
function $(id) { return document.getElementById(id); }

function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = 'Bearer ' + currentToken;
    return fetch(API_BASE + path, { ...options, headers: { ...headers, ...options.headers } })
        .then(r => r.json().then(data => ({ status: r.status, data })));
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN');
}

function showToast(message, type = 'info') {
    const container = $('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span><span class="toast-close" onclick="this.parentElement.remove()">&times;</span>`;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4000);
}

// ==================== Scroll Animations ====================
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navbar scroll effect
let lastScrollY = 0;
function handleNavScroll() {
    const navbar = document.getElementById('navbar');
    const scrollY = window.scrollY;
    if (scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    lastScrollY = scrollY;
}

// Active nav link tracking
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.scrollY + 100;
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
}

// Scroll progress bar
function updateScrollProgress() {
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    const progressBar = document.getElementById('scrollProgress');
    if (progressBar) progressBar.style.width = scrolled + '%';
}

// Back to top visibility
function updateBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    if (window.scrollY > 500) {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
}

// ==================== Bidirectional Scroll Reveal ====================
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // Remove class when scrolling back up past the element
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealElements.forEach(el => observer.observe(el));
}

// ==================== Parallax Effect ====================
function handleParallax() {
    const scrollY = window.scrollY;
    const parallaxElements = document.querySelectorAll('.parallax-slow');
    
    parallaxElements.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        const offset = scrollY * speed;
        el.style.transform = `translateY(${offset}px)`;
    });
}

// Counter animation
function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseFloat(counter.getAttribute('data-target'));
                const duration = 2000;
                const start = performance.now();

                function update(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const current = target * eased;
                    counter.textContent = target >= 100 ? Math.floor(current).toLocaleString() : current.toFixed(1);
                    if (progress < 1) requestAnimationFrame(update);
                }
                requestAnimationFrame(update);
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
}

// ==================== Navigation ====================
function navigateToDefaultPage() {
    // 登录后永远不回到公共首页
    if (currentUser) {
        navigate(currentProvider ? 'providerDashboard' : 'dashboard');
    } else {
        navigate('home');
    }
}

function navigate(page, data) {
    // Record history before changing
    if (currentPage && currentPage !== page) {
        navigationHistory.push({ page: currentPage, data: currentPageData });
    }
    currentPage = page;
    currentPageData = data;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');

    window.scrollTo(0, 0);

    switch(page) {
        case 'home': loadHomePage(); break;
        case 'dashboard': loadDashboard(); break;
        case 'services': loadServices(); break;
        case 'serviceDetail': loadServiceDetail(data); break;
        case 'providers': loadProviders(); break;
        case 'myAppointments': loadMyAppointments(); break;
        case 'notifications': loadNotifications(); break;
        case 'profile': loadProfile(); break;
        case 'coupons': loadUserCoupons(); break;
        case 'providerDashboard': loadProviderDashboard(); break;
        case 'reports': loadReports(); break;
    }
}

function goBack() {
    if (navigationHistory.length > 0) {
        const prev = navigationHistory.pop();
        // Navigate without recording history to avoid loops
        const prevPage = prev.page;
        const prevData = prev.data;
        currentPage = prevPage;
        currentPageData = prevData;

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const pageEl = document.getElementById('page-' + prevPage);
        if (pageEl) pageEl.classList.add('active');
        const homePage = document.getElementById('page-home');
        if (homePage) homePage.classList.toggle('active', prevPage === 'home');
        window.scrollTo(0, 0);

        switch(prevPage) {
            case 'home': loadHomePage(); break;
            case 'dashboard': loadDashboard(); break;
            case 'services': loadServices(); break;
            case 'serviceDetail': loadServiceDetail(prevData); break;
            case 'providers': loadProviders(); break;
            case 'myAppointments': loadMyAppointments(); break;
            case 'notifications': loadNotifications(); break;
            case 'profile': loadProfile(); break;
            case 'coupons': loadUserCoupons(); break;
            case 'providerDashboard': loadProviderDashboard(); break;
        }
    } else {
        // 登录后兜底回到默认页面，不回到公共首页
        navigateToDefaultPage();
    }
}

// ==================== Auth ====================
function validateUsername() {
    const username = $('regUsername').value.trim();
    const statusEl = $('usernameStatus');
    if (!username) {
        statusEl.textContent = '';
        statusEl.className = 'form-status';
        return false;
    }
    if (username.length < 3) {
        statusEl.textContent = '用户名至少3个字符';
        statusEl.className = 'form-status invalid';
        return false;
    }
    if (username.length > 50) {
        statusEl.textContent = '用户名不能超过50个字符';
        statusEl.className = 'form-status invalid';
        return false;
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
        statusEl.textContent = '用户名只支持中英文、数字和下划线';
        statusEl.className = 'form-status invalid';
        return false;
    }
    statusEl.textContent = '✓ 用户名可用';
    statusEl.className = 'form-status valid';
    return true;
}

function validateEmail() {
    const email = $('regEmail').value.trim();
    const statusEl = $('emailStatus');
    if (!email) {
        statusEl.textContent = '';
        statusEl.className = 'form-status';
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        statusEl.textContent = '请输入有效的邮箱地址';
        statusEl.className = 'form-status invalid';
        return false;
    }
    statusEl.textContent = '✓ 邮箱格式正确';
    statusEl.className = 'form-status valid';
    return true;
}

function validatePassword() {
    const password = $('regPassword').value;
    const strength1 = $('strength1');
    const strength2 = $('strength2');
    const strength3 = $('strength3');
    const strength4 = $('strength4');
    const strengthText = $('strengthText');
    
    [strength1, strength2, strength3, strength4].forEach(el => {
        if (el) el.className = 'strength-segment';
    });
    
    if (!password) {
        strengthText.textContent = '请输入密码';
        return 0;
    }
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-zA-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    for (let i = 0; i < Math.min(score, 4); i++) {
        const segments = [strength1, strength2, strength3, strength4];
        if (segments[i]) {
            if (score <= 1) segments[i].className = 'strength-segment weak';
            else if (score <= 2) segments[i].className = 'strength-segment fair';
            else if (score <= 3) segments[i].className = 'strength-segment good';
            else segments[i].className = 'strength-segment strong';
        }
    }
    
    if (score <= 1) strengthText.textContent = '弱 - 建议使用更长的密码';
    else if (score <= 2) strengthText.textContent = '一般 - 建议添加数字';
    else if (score <= 3) strengthText.textContent = '良好 - 建议添加特殊字符';
    else strengthText.textContent = '强 - 密码强度优秀';
    
    return score;
}

function validateConfirmPassword() {
    const password = $('regPassword').value;
    const confirmPassword = $('regConfirmPassword').value;
    const statusEl = $('confirmPasswordStatus');
    
    if (!confirmPassword) {
        statusEl.textContent = '';
        statusEl.className = 'form-status';
        return false;
    }
    
    if (password !== confirmPassword) {
        statusEl.textContent = '两次输入的密码不一致';
        statusEl.className = 'form-status invalid';
        return false;
    }
    
    statusEl.textContent = '✓ 密码一致';
    statusEl.className = 'form-status valid';
    return true;
}

function validatePhone() {
    const phone = $('regPhone').value.trim();
    const statusEl = $('phoneStatus');
    
    if (!phone) {
        statusEl.textContent = '';
        statusEl.className = 'form-status';
        return true;
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        statusEl.textContent = '请输入有效的手机号';
        statusEl.className = 'form-status invalid';
        return false;
    }
    
    statusEl.textContent = '✓ 手机号格式正确';
    statusEl.className = 'form-status valid';
    return true;
}

function onRoleChange() {
    const role = $('regRole').value;
    const phoneHint = $('phoneHint');
    if (role === 'provider') {
        phoneHint.textContent = '服务商请填写真实手机号，便于审核联系';
    } else {
        phoneHint.textContent = '用于接收验证码和通知';
    }
}

function handleRegister(e) {
    e.preventDefault();
    const errorEl = $('registerError');
    errorEl.textContent = '';
    
    const username = $('regUsername').value.trim();
    const email = $('regEmail').value.trim();
    const password = $('regPassword').value;
    const confirmPassword = $('regConfirmPassword').value;
    const phone = $('regPhone').value.trim();
    const role = $('regRole').value;
    const agreeTerms = $('agreeTerms').checked;
    
    if (!validateUsername()) {
        errorEl.textContent = '请检查用户名格式';
        return;
    }
    if (!validateEmail()) {
        errorEl.textContent = '请检查邮箱格式';
        return;
    }
    if (password.length < 6) {
        errorEl.textContent = '密码至少6个字符';
        return;
    }
    if (!validateConfirmPassword()) {
        errorEl.textContent = '两次输入的密码不一致';
        return;
    }
    if (phone && !validatePhone()) {
        errorEl.textContent = '请检查手机号格式';
        return;
    }
    if (!agreeTerms) {
        errorEl.textContent = '请先阅读并同意服务条款';
        return;
    }
    
    const btn = $('registerBtn');
    const btnText = $('registerBtnText');
    const btnLoading = $('registerBtnLoading');
    if (btn) btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline';
    
    const data = {
        username: username,
        email: email,
        password: password,
        phone: phone,
        role: role
    };
    
    api('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }).then(({ status, data: resp }) => {
        if (btn) btn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        
        if (status === 200) {
            currentToken = resp.token;
            currentUser = resp.user;
            localStorage.setItem('token', resp.token);
            localStorage.setItem('user', JSON.stringify(resp.user));
            localStorage.setItem('loginTime', Date.now().toString());
            
            closeModal('registerModal');
            clearRegisterForm();
            updateNavState();
            showToast('注册成功！欢迎加入', 'success');
            if (resp.user.role === 'provider') {
                showModal('providerRegisterModal');
                navigate('providerDashboard');
            } else {
                navigate('dashboard');
            }
        } else {
            errorEl.textContent = resp.error || '注册失败';
        }
    }).catch(err => {
        if (btn) btn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        errorEl.textContent = '网络错误，请稍后重试';
    });
}

function clearRegisterForm() {
    $('regUsername').value = '';
    $('regEmail').value = '';
    $('regPassword').value = '';
    $('regConfirmPassword').value = '';
    $('regPhone').value = '';
    $('regRole').value = 'user';
    $('agreeTerms').checked = false;
    $('usernameStatus').textContent = '';
    $('emailStatus').textContent = '';
    $('confirmPasswordStatus').textContent = '';
    $('phoneStatus').textContent = '';
    $('passwordStrength').querySelector('.strength-text').textContent = '请输入密码';
    ['strength1', 'strength2', 'strength3', 'strength4'].forEach(id => {
        const el = $(id);
        if (el) el.className = 'strength-segment';
    });
}

function handleLogin(e) {
    e.preventDefault();
    const errorEl = $('loginError');
    errorEl.textContent = '';
    
    const username = $('loginUsername').value.trim();
    const password = $('loginPassword').value;
    
    if (!username) {
        errorEl.textContent = '请输入用户名或邮箱';
        return;
    }
    if (!password) {
        errorEl.textContent = '请输入密码';
        return;
    }
    if (password.length < 6) {
        errorEl.textContent = '密码至少6个字符';
        return;
    }
    
    const btn = $('loginBtn');
    const btnText = $('loginBtnText');
    const btnLoading = $('loginBtnLoading');
    if (btn) btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline';
    
    const data = {
        username: username,
        password: password
    };
    
    api('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }).then(({ status, data: resp }) => {
        if (btn) btn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        
        if (status === 200) {
            currentToken = resp.token;
            currentUser = resp.user;
            if (resp.provider) currentProvider = resp.provider;
            
            localStorage.setItem('token', resp.token);
            localStorage.setItem('user', JSON.stringify(resp.user));
            localStorage.setItem('loginTime', Date.now().toString());
            if (resp.provider) localStorage.setItem('provider', JSON.stringify(resp.provider));
            
            const rememberMe = $('rememberMe');
            if (rememberMe && rememberMe.checked) {
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('rememberMe');
            }
            
            closeModal('loginModal');
            clearLoginForm();
            updateNavState();
            showToast('登录成功！', 'success');
            navigate(currentProvider ? 'providerDashboard' : 'dashboard');
        } else {
            errorEl.textContent = resp.error || '登录失败';
        }
    }).catch(err => {
        if (btn) btn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        errorEl.textContent = '网络错误，请稍后重试';
    });
}

function clearLoginForm() {
    $('loginUsername').value = '';
    $('loginPassword').value = '';
    $('rememberMe').checked = false;
}

function logout() {
    currentToken = null; currentUser = null; currentProvider = null;
    localStorage.removeItem('token'); 
    localStorage.removeItem('user'); 
    localStorage.removeItem('provider');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('rememberMe');
    updateNavState();
    showToast('已退出登录', 'info');
    navigate('home');
}

function updateNavState() {
    const navActions = $('navActions');
    const navUser = $('navUser');
    const userNameDisplay = $('userNameDisplay');
    const userAvatar = $('userAvatar');
    const providerLink = $('providerLink');
    const providerFeatureCard = $('providerFeatureCard');
    
    if (currentUser) {
        navActions.style.display = 'none';
        navUser.style.display = 'flex';
        userNameDisplay.textContent = currentUser.username;
        userAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
        if (currentUser.role === 'provider') {
            providerLink.style.display = 'block';
            if (providerFeatureCard) providerFeatureCard.style.display = 'flex';
        } else {
            providerLink.style.display = 'none';
            if (providerFeatureCard) providerFeatureCard.style.display = 'none';
        }
        loadUnreadCount();
    } else {
        navActions.style.display = 'flex';
        navUser.style.display = 'none';
        providerLink.style.display = 'none';
        if (providerFeatureCard) providerFeatureCard.style.display = 'none';
    }
}

function initAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const provider = localStorage.getItem('provider');
    const loginTime = localStorage.getItem('loginTime');
    const rememberMe = localStorage.getItem('rememberMe');
    
    if (!token || !user) {
        return false;
    }
    
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (loginTime) {
        const timeDiff = Date.now() - parseInt(loginTime);
        if (timeDiff > SEVEN_DAYS) {
            logout();
            return false;
        }
    }
    
    if (!rememberMe && loginTime) {
        const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
        const timeDiff = Date.now() - parseInt(loginTime);
        if (timeDiff > SESSION_TIMEOUT) {
            logout();
            return false;
        }
    }
    
    try {
        currentToken = token;
        currentUser = JSON.parse(user);
        if (provider) currentProvider = JSON.parse(provider);
        updateNavState();
        return true;
    } catch (e) {
        logout();
        return false;
    }
}

// ==================== Modal Management ====================
function showModal(id) {
    if (!currentUser && (id === 'appointmentModal' || id === 'reviewModal' || id === 'providerRegisterModal' || id === 'addServiceModal')) {
        showToast('请先登录', 'warning');
        showModal('loginModal');
        return;
    }
    document.getElementById(id).classList.add('show');
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function switchModal(from, to) { closeModal(from); showModal(to); }
function toggleDropdown(id) { document.getElementById(id).classList.toggle('show'); }
function toggleMobileMenu() { document.getElementById('navLinks').classList.toggle('show'); }

document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    }
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// ==================== Contact Form ====================
function handleContactSubmit(e) {
    e.preventDefault();
    const name = $('contactName').value.trim();
    const phone = $('contactPhone').value.trim();
    const email = $('contactEmail').value.trim();
    const type = $('contactType').value;
    const message = $('contactMessage').value.trim();
    
    showToast(`感谢 ${name}，您的咨询已提交，我们将尽快与您联系！`, 'success');
    e.target.reset();
}

// ==================== Home Page ====================
function loadHomePage() {
    // Load featured services
    api('/api/services').then(({ data }) => {
        const container = $('featuredServices');
        if (container && data.services && data.services.length > 0) {
            container.innerHTML = data.services.slice(0, 6).map(s => `
                <div class="service-card reveal" onclick="navigate('serviceDetail', ${s.id})">
                    <div class="service-card-image ${getCategoryClass(s.category)}">
                        <span class="icon-text">${getCategoryIcon(s.category)}</span>
                    </div>
                    <div class="service-card-body">
                        <h3>${escHtml(s.name)}</h3>
                        <p class="service-provider">${escHtml(s.provider_name || '')}</p>
                        <p class="service-desc">${escHtml(s.description).substring(0, 60)}</p>
                        <div class="service-card-meta">
                            <span class="service-price">${s.price > 0 ? '¥' + s.price : '免费'}</span>
                            <span class="service-duration">${s.duration}分钟</span>
                            <span class="service-rating">★ ${(s.avg_rating || 0).toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            initScrollReveal();
        }
    });
}

// ==================== Dashboard (Logged-in Home) ====================
let dashCategory = '';

function loadDashboard() {
    if (!currentUser) {
        navigate('home');
        return;
    }

    const nameEl = document.getElementById('dashUserName');
    if (nameEl) nameEl.textContent = currentUser.username;

    const searchInput = document.getElementById('dashSearch');
    if (searchInput) searchInput.value = '';

    loadPromoServices();
    loadRecommendedServices();
    loadDashHotServices();
    initScrollReveal();
}

function loadPromoServices() {
    const container = document.getElementById('promoServices');
    if (!container) return;
    container.innerHTML = '<div class="loading">加载中</div>';

    const params = new URLSearchParams();
    if (dashCategory) params.append('category', dashCategory);

    api('/api/services?' + params.toString()).then(({ data }) => {
        if (data.services && data.services.length > 0) {
            // Simulate promo: pick 3 services, add fake discount
            const promos = data.services.slice(0, 3).map((s, i) => ({
                ...s,
                originalPrice: s.price > 0 ? (s.price * (1.2 + i * 0.15)).toFixed(2) : 0,
                discount: [20, 30, 25][i]
            }));
            container.innerHTML = promos.map(s => `
                <div class="promo-card reveal" onclick="navigate('serviceDetail', ${s.id})">
                    <div class="promo-card-image ${getCategoryClass(s.category)}">
                        <span class="promo-tag">${s.discount}% OFF</span>
                        <span class="icon-text">${getCategoryIcon(s.category)}</span>
                    </div>
                    <div class="promo-card-body">
                        <h3>${escHtml(s.name)}</h3>
                        <p class="promo-provider">${escHtml(s.provider_name || '')}</p>
                        <p class="promo-desc">${escHtml(s.description)}</p>
                    </div>
                    <div class="promo-card-footer">
                        <div class="promo-price">
                            <span class="current">${s.price > 0 ? '¥' + s.price : '免费'}</span>
                            ${s.originalPrice > 0 ? `<span class="original">¥${s.originalPrice}</span>` : ''}
                        </div>
                        <span class="promo-discount">-${s.discount}%</span>
                    </div>
                </div>
            `).join('');
            initScrollReveal();
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏷</div><h3>暂无优惠服务</h3></div>';
        }
    });
}

function loadRecommendedServices() {
    const container = document.getElementById('dashRecommendedServices');
    if (!container) return;
    container.innerHTML = '<div class="loading">加载中</div>';

    api('/api/recommend/services').then(({ data }) => {
        if (data.services && data.services.length > 0) {
            container.innerHTML = data.services.map(s => `
                <div class="service-card reveal" onclick="navigate('serviceDetail', ${s.id})">
                    <div class="service-card-image ${getCategoryClass(s.category)}">
                        <span class="icon-text">${getCategoryIcon(s.category)}</span>
                        ${s.has_coupon ? '<span class="coupon-badge">券</span>' : ''}
                    </div>
                    <div class="service-card-body">
                        <h3>${escHtml(s.name)}</h3>
                        <p class="service-provider">${escHtml(s.provider_name || '')}</p>
                        <p class="service-desc">${escHtml(s.description).substring(0, 60)}</p>
                        <div class="service-card-meta">
                            <span class="service-price">${s.price > 0 ? '¥' + s.price : '免费'}</span>
                            <span class="service-duration">${s.duration}分钟</span>
                            <span class="service-rating">★ ${(s.avg_rating || 0).toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            initScrollReveal();
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">✨</div><h3>暂无推荐服务</h3></div>';
        }
    });
}

function loadDashHotServices() {
    const container = document.getElementById('dashHotServices');
    if (!container) return;
    container.innerHTML = '<div class="loading">加载中</div>';

    api('/api/recommend/hot').then(({ data }) => {
        if (data.services && data.services.length > 0) {
            const hot = data.services.slice(0, 6);
            container.innerHTML = hot.map(s => `
                <div class="service-card reveal" onclick="navigate('serviceDetail', ${s.id})">
                    <div class="service-card-image ${getCategoryClass(s.category)}">
                        <span class="icon-text">${getCategoryIcon(s.category)}</span>
                    </div>
                    <div class="service-card-body">
                        <h3>${escHtml(s.name)}</h3>
                        <p class="service-provider">${escHtml(s.provider_name || '')}</p>
                        <p class="service-desc">${escHtml(s.description).substring(0, 60)}</p>
                        <div class="service-card-meta">
                            <span class="service-price">${s.price > 0 ? '¥' + s.price : '免费'}</span>
                            <span class="service-duration">${s.duration}分钟</span>
                            <span class="service-rating">★ ${(s.avg_rating || 0).toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            initScrollReveal();
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔥</div><h3>暂无热门服务</h3></div>';
        }
    });
}

function performDashSearch() {
    const keyword = document.getElementById('dashSearch')?.value.trim();
    if (keyword) {
        navigate('services');
        // Set the search input on the services page
        setTimeout(() => {
            const svcSearch = document.getElementById('serviceSearch');
            if (svcSearch) {
                svcSearch.value = keyword;
                loadServices();
            }
        }, 100);
    }
}

function filterDashCategory(category, btn) {
    dashCategory = category;
    document.querySelectorAll('.quick-cat').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    loadPromoServices();
    loadRecommendedServices();
    loadDashHotServices();
}

function clearFilters() {
    $('priceMin').value = '';
    $('priceMax').value = '';
    $('durationMin').value = '';
    $('durationMax').value = '';
    $('sortBy').value = '';
    $('sortOrder').value = 'asc';
    loadServices();
}

// ==================== Services ====================
function loadServices() {
    const keyword = $('serviceSearch')?.value || '';
    const category = $('serviceCategoryFilter')?.value || '';
    const minPrice = $('priceMin')?.value || '';
    const maxPrice = $('priceMax')?.value || '';
    const minDuration = $('durationMin')?.value || '';
    const maxDuration = $('durationMax')?.value || '';
    const sortBy = $('sortBy')?.value || '';
    const sortOrder = $('sortOrder')?.value || '';
    
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (category) params.append('category', category);
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);
    if (minDuration) params.append('min_duration', minDuration);
    if (maxDuration) params.append('max_duration', maxDuration);
    if (sortBy) params.append('sort_by', sortBy);
    if (sortOrder) params.append('sort_order', sortOrder);
    
    const container = document.getElementById('allServices');
    if (!container) return;
    container.innerHTML = '<div class="loading">加载中</div>';
    
    api('/api/services/search?' + params.toString()).then(({ data }) => {
        if (data.services && data.services.length > 0) {
            container.innerHTML = data.services.map(s => `
                <div class="service-card" onclick="navigate('serviceDetail', ${s.id})">
                    <div class="service-card-image ${getCategoryClass(s.category)}">
                        <span class="icon-text">${getCategoryIcon(s.category)}</span>
                        ${s.has_coupon ? '<span class="coupon-badge">券</span>' : ''}
                    </div>
                    <div class="service-card-body">
                        <h3>${escHtml(s.name)}</h3>
                        <p class="service-provider">${escHtml(s.provider_name || '')}</p>
                        <p class="service-desc">${escHtml(s.description).substring(0, 80)}</p>
                        <div class="service-card-meta">
                            <span class="service-price">${s.price > 0 ? '¥' + s.price : '免费'}</span>
                            <span class="service-duration">${s.duration}分钟</span>
                            <span class="service-rating">★ ${(s.avg_rating || 0).toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>没有找到服务</h3><p>试试其他搜索条件</p></div>';
        }
    });
}

function loadServiceDetail(serviceId) {
    const container = $('serviceDetailContent');
    container.innerHTML = '<div class="loading">加载中</div>';
    
    api('/api/services/' + serviceId).then(({ data }) => {
        if (data.service) {
            const s = data.service;
            const p = data.provider;
            container.innerHTML = `
                <div class="service-detail">
                    <button class="page-back" onclick="goBack()">← 返回</button>
                    <div class="service-detail-header">
                        <h1>${escHtml(s.name)}</h1>
                        <p style="color:var(--mid-gray);">${escHtml(s.description)}</p>
                        <div class="service-detail-info">
                            <div><span class="label">价格</span><span class="value" style="color:var(--orange);">${s.price > 0 ? '¥' + s.price : '免费'}</span></div>
                            <div><span class="label">时长</span><span class="value">${s.duration} 分钟</span></div>
                            <div><span class="label">分类</span><span class="value">${escHtml(s.category)}</span></div>
                            <div><span class="label">评分</span><span class="value" style="color:var(--orange);">★ ${(data.avg_rating || 0).toFixed(1)}</span></div>
                        </div>
                        <button class="btn btn-primary" style="margin-top:20px;background:var(--orange);" onclick="openAppointmentModal(${s.id}, '${escHtml(s.name)}')">立即预约</button>
                    </div>
                    <div class="detail-section">
                        <h2>服务商信息</h2>
                        <div style="display:flex;align-items:center;gap:16px;">
                            <div class="profile-avatar-lg" style="width:56px;height:56px;font-size:1.5rem;">${p.name.charAt(0)}</div>
                            <div>
                                <h3 style="margin-bottom:4px;">${escHtml(p.name)}</h3>
                                <span class="profile-role">${escHtml(p.category)}</span>
                                <p style="margin-top:4px;color:var(--mid-gray);">${escHtml(p.description)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h2>用户评价 (${data.reviews ? data.reviews.length : 0})</h2>
                        ${data.reviews && data.reviews.length > 0 ? data.reviews.map(r => `
                            <div style="padding:16px 0;border-bottom:1px solid var(--light-gray);">
                                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                                    <span style="font-weight:600;">${escHtml(r.username)}</span>
                                    <span style="color:var(--orange);">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                                </div>
                                <p style="color:var(--mid-gray);">${escHtml(r.comment) || '用户未留下评论'}</p>
                                <span style="font-size:0.8rem;color:var(--mid-gray);">${formatDateTime(r.created_at)}</span>
                            </div>
                        `).join('') : '<p style="color:var(--mid-gray);">暂无评价</p>'}
                    </div>
                </div>
            `;
            document.getElementById('page-serviceDetail').classList.add('active');
        }
    });
}

// ==================== Providers ====================
function loadProviders() {
    const category = $('providerCategoryFilter')?.value || '';
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    
    const container = document.getElementById('allProviders');
    if (!container) return;
    container.innerHTML = '<div class="loading">加载中</div>';
    
    api('/api/providers?' + params.toString()).then(({ data }) => {
        if (data.providers && data.providers.length > 0) {
            container.innerHTML = data.providers.map(p => `
                <div class="service-card" onclick="navigate('services');$('serviceCategoryFilter').value='${p.category}';loadServices();">
                    <div class="service-card-image ${getCategoryClass(p.category)}">
                        <span class="icon-text">${p.name.charAt(0)}</span>
                    </div>
                    <div class="service-card-body">
                        <h3>${escHtml(p.name)}</h3>
                        <span class="profile-role">${escHtml(p.category)}</span>
                        <p class="service-desc" style="margin-top:8px;">${escHtml(p.description) || '暂无简介'}</p>
                        <p style="color:var(--mid-gray);margin-top:8px;">${escHtml(p.address)}</p>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">👤</div><h3>暂无服务商</h3></div>';
        }
    });
}

// ==================== Appointments ====================
function openAppointmentModal(serviceId, serviceName) {
    if (!currentUser) { showToast('请先登录', 'warning'); showModal('loginModal'); return; }
    $('apptServiceId').value = serviceId;
    $('apptServiceName').value = serviceName;
    $('apptDate').value = '';
    $('apptDate').min = new Date().toISOString().split('T')[0];
    $('apptTime').value = '';
    $('apptNotes').value = '';
    $('appointmentError').textContent = '';
    
    const timeSelect = $('apptTime');
    timeSelect.innerHTML = '<option value="">请选择时间</option>';
    for (let h = 8; h <= 20; h++) {
        for (let m = 0; m < 60; m += 30) {
            const time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
            timeSelect.innerHTML += `<option value="${time}">${time}</option>`;
        }
    }
    showModal('appointmentModal');
}

function handleBookAppointment(e) {
    e.preventDefault();
    const errorEl = $('appointmentError');
    errorEl.textContent = '';
    
    const data = {
        service_id: parseInt($('apptServiceId').value),
        appointment_date: $('apptDate').value,
        appointment_time: $('apptTime').value,
        notes: $('apptNotes').value
    };
    
    api('/api/appointments', { method: 'POST', body: JSON.stringify(data) }).then(({ status, data: resp }) => {
        if (status === 200) { closeModal('appointmentModal'); showToast('预约成功！等待服务商确认', 'success'); }
        else { errorEl.textContent = resp.error || '预约失败'; }
    });
}

function loadMyAppointments() {
    if (!currentUser) { showToast('请先登录', 'warning'); showModal('loginModal'); return; }
    const container = $('myAppointmentsList');
    container.innerHTML = '<div class="loading">加载中</div>';
    
    api('/api/appointments').then(({ data }) => {
        if (data.appointments && data.appointments.length > 0) {
            container.innerHTML = data.appointments.map(a => `
                <div class="appointment-card">
                    <div class="appointment-header">
                        <span class="appointment-title">${escHtml(a.service_name)}</span>
                        <span class="status-badge status-${a.status}">${getStatusText(a.status)}</span>
                    </div>
                    <div class="appointment-info">
                        <span>📅 ${a.appointment_date} ${a.appointment_time}</span>
                        <span>👤 ${escHtml(a.provider_name)}</span>
                        ${currentUser.role === 'provider' ? `<span>用户: ${escHtml(a.user_name)}</span>` : ''}
                        <span>💰 ¥${a.service_price}</span>
                    </div>
                    ${a.notes ? `<p style="color:var(--mid-gray);margin-bottom:8px;">备注: ${escHtml(a.notes)}</p>` : ''}
                    <div class="appointment-actions">
                        ${a.status === 'pending' && currentUser.role === 'provider' ? `<button class="btn btn-primary btn-sm" style="background:var(--blue);" onclick="confirmAppointment(${a.id})">确认预约</button>` : ''}
                        ${a.status === 'confirmed' && currentUser.role === 'provider' ? `<button class="btn btn-primary btn-sm" style="background:var(--green);" onclick="completeAppointment(${a.id})">完成服务</button>` : ''}
                        ${(a.status === 'pending' || a.status === 'confirmed') ? `<button class="btn btn-primary btn-sm" style="background:#EF4444;" onclick="cancelAppointment(${a.id})">取消预约</button>` : ''}
                        ${a.status === 'completed' && currentUser.role === 'user' ? `<button class="btn btn-outline btn-sm" style="color:var(--orange);border-color:var(--orange);" onclick="openReviewModal(${a.id})">评价</button>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><h3>暂无预约</h3><p>去浏览服务并预约吧！</p></div>';
        }
    });
}

function cancelAppointment(id) {
    if (!confirm('确定要取消这个预约吗？')) return;
    api('/api/appointments/' + id + '/cancel', { method: 'POST' }).then(({ status, data }) => {
        if (status === 200) { showToast('预约已取消', 'success'); loadMyAppointments(); }
        else { showToast(data.error || '取消失败', 'error'); }
    });
}

function confirmAppointment(id) {
    api('/api/appointments/' + id + '/confirm', { method: 'POST' }).then(({ status, data }) => {
        if (status === 200) { showToast('预约已确认', 'success'); loadMyAppointments(); }
        else { showToast(data.error || '确认失败', 'error'); }
    });
}

function completeAppointment(id) {
    api('/api/appointments/' + id + '/complete', { method: 'POST' }).then(({ status, data }) => {
        if (status === 200) { showToast('服务已完成', 'success'); loadMyAppointments(); }
        else { showToast(data.error || '操作失败', 'error'); }
    });
}

// ==================== Reviews ====================
let currentRating = 5;
function setRating(rating) {
    currentRating = rating;
    $('reviewRating').value = rating;
    const stars = document.querySelectorAll('#starRating span');
    stars.forEach((s, i) => {
        s.innerHTML = i < rating ? '★' : '☆';
        s.classList.toggle('active', i < rating);
    });
}

function openReviewModal(apptId) {
    $('reviewApptId').value = apptId;
    $('reviewComment').value = '';
    setRating(5);
    $('reviewError').textContent = '';
    showModal('reviewModal');
}

function handleSubmitReview(e) {
    e.preventDefault();
    const errorEl = $('reviewError');
    errorEl.textContent = '';
    const data = { appointment_id: parseInt($('reviewApptId').value), rating: currentRating, comment: $('reviewComment').value };
    api('/api/reviews', { method: 'POST', body: JSON.stringify(data) }).then(({ status, data: resp }) => {
        if (status === 200) { closeModal('reviewModal'); showToast('评价提交成功！', 'success'); loadMyAppointments(); }
        else { errorEl.textContent = resp.error || '评价失败'; }
    });
}

// ==================== Notifications ====================
function loadNotifications() {
    if (!currentUser) { showToast('请先登录', 'warning'); showModal('loginModal'); return; }
    const container = $('notificationsList');
    container.innerHTML = '<div class="loading">加载中</div>';
    api('/api/notifications').then(({ data }) => {
        if (data.notifications && data.notifications.length > 0) {
            container.innerHTML = data.notifications.map(n => `
                <div class="notification-card ${n.is_read ? '' : 'unread'}" onclick="markNotifRead(${n.id})">
                    <div class="notification-title">${escHtml(n.title)}</div>
                    <div class="notification-message">${escHtml(n.message)}</div>
                    <div class="notification-time">${formatDateTime(n.created_at)}</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔔</div><h3>暂无消息</h3></div>';
        }
    });
}

function markNotifRead(id) { api('/api/notifications/' + id + '/read', { method: 'PUT' }).then(() => loadUnreadCount()); }

function loadUnreadCount() {
    if (!currentUser) return;
    api('/api/notifications').then(({ data }) => {
        const badge = $('notifBadge');
        const badgeMenu = $('notifBadgeMenu');
        if (data.unread_count > 0) { badge.style.display = 'inline-flex'; badge.textContent = data.unread_count; badgeMenu.textContent = data.unread_count; }
        else { badge.style.display = 'none'; badgeMenu.textContent = '0'; }
    });
}

// ==================== Profile ====================
function loadProfile() {
    if (!currentUser) { showToast('请先登录', 'warning'); showModal('loginModal'); return; }
    const container = $('profileContent');
    api('/api/auth/profile').then(({ data }) => {
        if (data.user) {
            const u = data.user;
            container.innerHTML = `
                <div class="profile-card">
                    <div class="profile-header">
                        <div class="profile-avatar-lg">${u.username.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="profile-name">${escHtml(u.username)}</div>
                            <span class="profile-role">${u.role === 'provider' ? '服务商' : '普通用户'}</span>
                        </div>
                    </div>
                    <form onsubmit="updateProfile(event)">
                        <div class="form-group"><label>用户名</label><input type="text" id="profileUsername" value="${escHtml(u.username)}" required></div>
                        <div class="form-group"><label>邮箱</label><input type="email" id="profileEmail" value="${escHtml(u.email)}" required></div>
                        <div class="form-group"><label>手机号</label><input type="tel" id="profilePhone" value="${escHtml(u.phone || '')}"></div>
                        <div class="form-group"><label>注册时间</label><input type="text" value="${formatDateTime(u.created_at)}" readonly></div>
                        <button type="submit" class="btn btn-primary">保存修改</button>
                    </form>
                </div>
                ${u.role !== 'provider' ? `
                <div class="profile-card" style="text-align:center;">
                    <h3 style="margin-bottom:16px;">成为服务商</h3>
                    <p style="color:var(--mid-gray);margin-bottom:20px;">发布您的服务，让更多人预约！</p>
                    <button class="btn btn-primary" style="background:var(--orange);" onclick="showModal('providerRegisterModal')">立即成为服务商</button>
                </div>` : ''}
            `;
        }
    });
}

function updateProfile(e) {
    e.preventDefault();
    const data = { username: $('profileUsername').value.trim(), email: $('profileEmail').value.trim(), phone: $('profilePhone').value.trim() };
    api('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }).then(({ status, data: resp }) => {
        if (status === 200) { currentUser = resp.user; localStorage.setItem('user', JSON.stringify(resp.user)); updateNavState(); showToast('资料更新成功！', 'success'); }
        else { showToast(resp.error || '更新失败', 'error'); }
    });
}

// ==================== Provider Registration ====================
function handleProviderRegister(e) {
    e.preventDefault();
    const errorEl = $('providerRegisterError');
    errorEl.textContent = '';
    const data = { name: $('provName').value.trim(), category: $('provCategory').value, description: $('provDescription').value.trim(), address: $('provAddress').value.trim(), phone: $('provPhone').value.trim() };
    api('/api/providers', { method: 'POST', body: JSON.stringify(data) }).then(({ status, data: resp }) => {
        if (status === 200) {
            currentProvider = resp.provider; currentUser.role = 'provider';
            localStorage.setItem('provider', JSON.stringify(resp.provider));
            localStorage.setItem('user', JSON.stringify(currentUser));
            closeModal('providerRegisterModal'); updateNavState();
            showToast('服务商注册成功！', 'success'); navigate('providerDashboard');
        } else { errorEl.textContent = resp.error || '注册失败'; }
    });
}

// ==================== Provider Dashboard ====================
function loadProviderDashboard() {
    if (!currentUser || currentUser.role !== 'provider') { showToast('请先注册为服务商', 'warning'); return; }
    const container = $('providerDashboardContent');
    api('/api/auth/profile').then(({ data }) => {
        if (data.provider) {
            currentProvider = data.provider;
            const p = data.provider;
            api('/api/appointments').then(({ data: apptData }) => {
                const appointments = apptData.appointments || [];
                const pending = appointments.filter(a => a.status === 'pending').length;
                const confirmed = appointments.filter(a => a.status === 'confirmed').length;
                const completed = appointments.filter(a => a.status === 'completed').length;
                api('/api/services').then(({ data: svcData }) => {
                    const myServices = (svcData.services || []).filter(s => s.provider_id === p.id);
                    container.innerHTML = `
                        <div class="provider-dashboard">
                            <div class="dashboard-stats">
                                <div class="dashboard-stat"><div class="stat-value">${myServices.length}</div><div class="stat-label">我的服务</div></div>
                                <div class="dashboard-stat"><div class="stat-value">${pending}</div><div class="stat-label">待确认</div></div>
                                <div class="dashboard-stat"><div class="stat-value">${confirmed}</div><div class="stat-label">已确认</div></div>
                                <div class="dashboard-stat"><div class="stat-value">${completed}</div><div class="stat-label">已完成</div></div>
                            </div>
                            <div class="dashboard-tabs">
                                <button class="dashboard-tab active" onclick="switchDashboardTab('services', this)">我的服务</button>
                                <button class="dashboard-tab" onclick="switchDashboardTab('appointments', this)">预约管理</button>
                                <button class="dashboard-tab" onclick="switchDashboardTab('coupons', this)">优惠券管理</button>
                                <button class="dashboard-tab" onclick="switchDashboardTab('info', this)">服务商信息</button>
                            </div>
                            <div id="dashboardTabContent">
                                <div id="tab-services">
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                                        <h3>我的服务</h3>
                                        <button class="btn btn-primary btn-sm" onclick="openAddServiceModal()">发布新服务</button>
                                    </div>
                                    <div class="services-grid">
                                        ${myServices.length > 0 ? myServices.map(s => `
                                            <div class="service-card">
                                                <div class="service-card-image ${getCategoryClass(s.category)}">
                                                    <span class="icon-text">${getCategoryIcon(s.category)}</span>
                                                </div>
                                                <div class="service-card-body">
                                                    <h3>${escHtml(s.name)}</h3>
                                                    <p class="service-desc">${escHtml(s.description).substring(0, 60)}</p>
                                                    <div class="service-card-meta">
                                                        <span class="service-price">${s.price > 0 ? '¥' + s.price : '免费'}</span>
                                                        <span class="service-duration">${s.duration}分钟</span>
                                                    </div>
                                                    <div style="display:flex;gap:8px;margin-top:12px;">
                                                        <button class="btn btn-outline btn-sm" style="color:var(--orange);border-color:var(--orange);" onclick="editService(${s.id}, '${escHtml(s.name)}', '${escHtml(s.category)}', '${escHtml(s.description)}', ${s.price}, ${s.duration})">编辑</button>
                                                        <button class="btn btn-primary btn-sm" style="background:#EF4444;" onclick="deleteService(${s.id})">删除</button>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('') : '<div class="empty-state"><p>还没有发布服务</p></div>'}
                                    </div>
                                </div>
                                <div id="tab-appointments" style="display:none;">
                                    ${appointments.length > 0 ? appointments.map(a => `
                                        <div class="appointment-card">
                                            <div class="appointment-header">
                                                <span class="appointment-title">${escHtml(a.service_name)} - ${escHtml(a.user_name)}</span>
                                                <span class="status-badge status-${a.status}">${getStatusText(a.status)}</span>
                                            </div>
                                            <div class="appointment-info"><span>📅 ${a.appointment_date} ${a.appointment_time}</span><span>💰 ¥${a.service_price}</span></div>
                                            ${a.notes ? `<p style="color:var(--mid-gray);">备注: ${escHtml(a.notes)}</p>` : ''}
                                            <div class="appointment-actions">
                                                ${a.status === 'pending' ? `<button class="btn btn-primary btn-sm" style="background:var(--blue);" onclick="confirmAppointment(${a.id})">确认</button>` : ''}
                                                ${a.status === 'confirmed' ? `<button class="btn btn-primary btn-sm" style="background:var(--green);" onclick="completeAppointment(${a.id})">完成</button>` : ''}
                                                ${a.status !== 'cancelled' && a.status !== 'completed' ? `<button class="btn btn-primary btn-sm" style="background:#EF4444;" onclick="cancelAppointment(${a.id})">取消</button>` : ''}
                                            </div>
                                        </div>
                                    `).join('') : '<div class="empty-state"><p>暂无预约</p></div>'}
                                </div>
                                <div id="tab-coupons" style="display:none;">
                                    <div id="couponsTabContent"></div>
                                </div>
                                <div id="tab-info" style="display:none;">
                                    <div class="profile-card">
                                        <form onsubmit="updateProviderInfo(event)">
                                            <div class="form-group"><label>服务商名称</label><input type="text" id="dashProvName" value="${escHtml(p.name)}" required></div>
                                            <div class="form-group"><label>分类</label><select id="dashProvCategory">${['医疗','美容','健身','教育','家政','法律'].map(c => `<option value="${c}" ${p.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
                                            <div class="form-group"><label>简介</label><textarea id="dashProvDesc" rows="3">${escHtml(p.description)}</textarea></div>
                                            <div class="form-group"><label>地址</label><input type="text" id="dashProvAddr" value="${escHtml(p.address)}"></div>
                                            <div class="form-group"><label>电话</label><input type="tel" id="dashProvPhone" value="${escHtml(p.phone)}"></div>
                                            <button type="submit" class="btn btn-primary">保存</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
            });
        } else {
            container.innerHTML = `<div class="empty-state" style="padding:80px 24px;"><div class="empty-icon">🏠</div><h3>您还没有注册为服务商</h3><p style="margin-bottom:20px;">注册成为服务商，发布您的服务</p><button class="btn btn-primary" style="background:var(--orange);" onclick="showModal('providerRegisterModal')">成为服务商</button></div>`;
        }
    });
}

function switchDashboardTab(tab, btn) {
    document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-services').style.display = tab === 'services' ? 'block' : 'none';
    document.getElementById('tab-appointments').style.display = tab === 'appointments' ? 'block' : 'none';
    document.getElementById('tab-coupons').style.display = tab === 'coupons' ? 'block' : 'none';
    document.getElementById('tab-info').style.display = tab === 'info' ? 'block' : 'none';
    if (tab === 'coupons') loadProviderCoupons();
}

function updateProviderInfo(e) {
    e.preventDefault();
    const data = { name: $('dashProvName').value.trim(), category: $('dashProvCategory').value, description: $('dashProvDesc').value.trim(), address: $('dashProvAddr').value.trim(), phone: $('dashProvPhone').value.trim() };
    api('/api/providers', { method: 'PUT', body: JSON.stringify(data) }).then(({ status, data: resp }) => {
        if (status === 200) { currentProvider = resp.provider; localStorage.setItem('provider', JSON.stringify(resp.provider)); showToast('信息更新成功！', 'success'); }
        else { showToast(resp.error || '更新失败', 'error'); }
    });
}

// ==================== Service CRUD (Provider) ====================
function openAddServiceModal(editData) {
    if (editData) {
        $('addServiceTitle').textContent = '编辑服务';
        $('editServiceId').value = editData.id;
        $('svcName').value = editData.name;
        $('svcCategory').value = editData.category;
        $('svcDescription').value = editData.description;
        $('svcPrice').value = editData.price;
        $('svcDuration').value = editData.duration;
    } else {
        $('addServiceTitle').textContent = '发布服务';
        $('editServiceId').value = '';
        $('svcName').value = ''; $('svcCategory').value = ''; $('svcDescription').value = '';
        $('svcPrice').value = '0'; $('svcDuration').value = '60';
    }
    $('addServiceError').textContent = '';
    showModal('addServiceModal');
}

function editService(id, name, category, description, price, duration) {
    openAddServiceModal({ id, name, category, description, price, duration });
}

function handleAddService(e) {
    e.preventDefault();
    const errorEl = $('addServiceError');
    errorEl.textContent = '';
    const data = { name: $('svcName').value.trim(), category: $('svcCategory').value, description: $('svcDescription').value.trim(), price: parseFloat($('svcPrice').value) || 0, duration: parseInt($('svcDuration').value) || 60 };
    const editId = $('editServiceId').value;
    const url = editId ? '/api/services/' + editId : '/api/services';
    const method = editId ? 'PUT' : 'POST';
    api(url, { method, body: JSON.stringify(data) }).then(({ status, data: resp }) => {
        if (status === 200) { closeModal('addServiceModal'); showToast(editId ? '服务更新成功！' : '服务发布成功！', 'success'); loadProviderDashboard(); }
        else { errorEl.textContent = resp.error || '操作失败'; }
    });
}

function deleteService(id) {
    if (!confirm('确定要删除这个服务吗？')) return;
    api('/api/services/' + id, { method: 'DELETE' }).then(({ status, data }) => {
        if (status === 200) { showToast('服务已删除', 'success'); loadProviderDashboard(); }
        else { showToast(data.error || '删除失败', 'error'); }
    });
}

// ==================== Coupons ====================
function toggleCouponAmount() {
    const type = $('couponType').value;
    const label = $('couponAmountLabel');
    const input = $('couponAmount');
    if (type === 'fixed') {
        label.textContent = '优惠金额 (元)';
        input.step = '0.01';
    } else {
        label.textContent = '折扣百分比 (%)';
        input.step = '1';
        input.max = '100';
    }
}

function loadProviderCoupons() {
    const container = document.getElementById('couponsTabContent');
    if (!container) return;
    container.innerHTML = '<div class="loading">加载中</div>';
    
    api('/api/coupons/provider').then(({ data }) => {
        if (data.coupons && data.coupons.length > 0) {
            container.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3>我的优惠券</h3>
                    <button class="btn btn-primary btn-sm" onclick="openAddCouponModal()">创建优惠券</button>
                </div>
                <div class="coupons-grid">
                    ${data.coupons.map(c => `
                        <div class="coupon-card">
                            <div class="coupon-left">
                                <span class="coupon-amount">${c.coupon_type === 'fixed' ? '¥' + c.discount_amount : c.discount_percent + '%'}</span>
                                <span class="coupon-condition">满${c.min_amount}可用</span>
                            </div>
                            <div class="coupon-right">
                                <h4>${escHtml(c.name)}</h4>
                                <p>${escHtml(c.description)}</p>
                                <div class="coupon-info">
                                    <span>总量: ${c.total_count}</span>
                                    <span>已用: ${c.used_count}</span>
                                    <span>状态: ${c.status === 'active' ? '生效中' : '已过期'}</span>
                                </div>
                                <div class="coupon-actions">
                                    <button class="btn btn-outline btn-sm" onclick="editCoupon(${c.id})">编辑</button>
                                    <button class="btn btn-primary btn-sm" style="background:#EF4444;" onclick="deleteCoupon(${c.id})">删除</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = `<div class="empty-state"><p>还没有创建优惠券</p><button class="btn btn-primary btn-sm" onclick="openAddCouponModal()">创建优惠券</button></div>`;
        }
    });
}

function openAddCouponModal(couponData) {
    const modal = document.getElementById('addCouponModal');
    if (!modal) return;
    
    if (couponData) {
        $('couponTitle').textContent = '编辑优惠券';
        $('editCouponId').value = couponData.id;
        $('couponName').value = couponData.name;
        $('couponDesc').value = couponData.description;
        $('couponType').value = couponData.coupon_type;
        $('couponAmount').value = couponData.coupon_type === 'fixed' ? couponData.discount_amount : couponData.discount_percent;
        $('couponMinAmount').value = couponData.min_amount;
        $('couponTotalCount').value = couponData.total_count;
        $('couponStartTime').value = couponData.start_time ? couponData.start_time.split(' ')[0] : '';
        $('couponEndTime').value = couponData.end_time ? couponData.end_time.split(' ')[0] : '';
    } else {
        $('couponTitle').textContent = '创建优惠券';
        $('editCouponId').value = '';
        $('couponName').value = '';
        $('couponDesc').value = '';
        $('couponType').value = 'fixed';
        $('couponAmount').value = '';
        $('couponMinAmount').value = '';
        $('couponTotalCount').value = '100';
        const today = new Date().toISOString().split('T')[0];
        $('couponStartTime').value = today;
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        $('couponEndTime').value = nextMonth.toISOString().split('T')[0];
    }
    $('addCouponError').textContent = '';
    showModal('addCouponModal');
}

function editCoupon(id) {
    api('/api/coupons/' + id).then(({ data }) => {
        if (data.coupon) {
            openAddCouponModal(data.coupon);
        }
    });
}

function handleAddCoupon(e) {
    e.preventDefault();
    const errorEl = $('addCouponError');
    errorEl.textContent = '';
    
    const data = {
        name: $('couponName').value.trim(),
        description: $('couponDesc').value.trim(),
        coupon_type: $('couponType').value,
        discount_amount: $('couponType').value === 'fixed' ? parseFloat($('couponAmount').value) || 0 : 0,
        discount_percent: $('couponType').value === 'percent' ? parseInt($('couponAmount').value) || 0 : 0,
        min_amount: parseFloat($('couponMinAmount').value) || 0,
        total_count: parseInt($('couponTotalCount').value) || 100,
        start_time: $('couponStartTime').value,
        end_time: $('couponEndTime').value
    };
    
    const editId = $('editCouponId').value;
    const url = editId ? '/api/coupons/' + editId : '/api/coupons';
    const method = editId ? 'PUT' : 'POST';
    
    api(url, { method, body: JSON.stringify(data) }).then(({ status, data: resp }) => {
        if (status === 200) {
            closeModal('addCouponModal');
            showToast(editId ? '优惠券更新成功！' : '优惠券创建成功！', 'success');
            loadProviderCoupons();
        } else {
            errorEl.textContent = resp.error || '操作失败';
        }
    });
}

function deleteCoupon(id) {
    if (!confirm('确定要删除这个优惠券吗？')) return;
    api('/api/coupons/' + id, { method: 'DELETE' }).then(({ status, data }) => {
        if (status === 200) { showToast('优惠券已删除', 'success'); loadProviderCoupons(); }
        else { showToast(data.error || '删除失败', 'error'); }
    });
}

function loadUserCoupons() {
    const container = document.getElementById('userCouponsContent');
    if (!container) return;
    container.innerHTML = '<div class="loading">加载中</div>';
    
    api('/api/coupons/user').then(({ data }) => {
        if (data.user_coupons && data.user_coupons.length > 0) {
            container.innerHTML = data.user_coupons.map(uc => `
                <div class="coupon-card ${uc.status === 'used' ? 'used' : ''}">
                    <div class="coupon-left">
                        <span class="coupon-amount">${uc.coupon_type === 'fixed' ? '¥' + uc.discount_amount : uc.discount_percent + '%'}</span>
                        <span class="coupon-condition">满${uc.min_amount}可用</span>
                    </div>
                    <div class="coupon-right">
                        <h4>${escHtml(uc.coupon_name)}</h4>
                        <p>${escHtml(uc.provider_name || '')}</p>
                        <div class="coupon-info">
                            <span>有效期: ${formatDate(uc.start_time)} - ${formatDate(uc.end_time)}</span>
                            <span>状态: ${uc.status === 'unused' ? '未使用' : uc.status === 'used' ? '已使用' : '已过期'}</span>
                        </div>
                        ${uc.status === 'unused' ? `<button class="btn btn-primary btn-sm" onclick="useUserCoupon(${uc.id})">去使用</button>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🎫</div><h3>暂无优惠券</h3><p>快去领取优惠券吧！</p></div>';
        }
    });
}

function loadReports() {
    const container = document.getElementById('reportsContent');
    if (!container) return;
    container.innerHTML = '<div class="loading">加载中</div>';

    Promise.all([
        api('/api/stats'),
        api('/api/stats/daily'),
        api('/api/stats/categories'),
        api('/api/stats/providers'),
        api('/api/stats/appointments'),
        api('/api/stats/coupons')
    ]).then(([statsRes, dailyRes, categoriesRes, providersRes, appointmentsRes, couponsRes]) => {
        renderStatsOverview(statsRes.data, couponsRes.data);
        renderTrendChart(dailyRes.data);
        renderCategoryList(categoriesRes.data);
        renderProviderRanking(providersRes.data);
        renderStatusDistribution(appointmentsRes.data);
        renderCouponStats(couponsRes.data);
        container.style.opacity = '1';
    }).catch(err => {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><h3>加载失败</h3><p>请稍后重试</p></div>';
    });
}

function renderStatsOverview(stats, couponStats) {
    $('reportTotalUsers').textContent = stats.total_users || 0;
    $('reportTotalProviders').textContent = stats.total_providers || 0;
    $('reportTotalServices').textContent = stats.total_services || 0;
    $('reportTotalAppointments').textContent = stats.total_appointments || 0;
    $('reportTotalRevenue').textContent = '¥' + (stats.total_revenue || 0).toFixed(2);
    $('reportTotalCoupons').textContent = couponStats.total_coupons || 0;
}

function renderTrendChart(dailyData) {
    const barsContainer = $('trendBars');
    const labelsContainer = $('trendLabels');
    if (!barsContainer || !labelsContainer) return;

    const maxAppointments = Math.max(...dailyData.map(d => d.new_appointments || 0), 1);
    
    barsContainer.innerHTML = dailyData.map(d => {
        const height = ((d.new_appointments || 0) / maxAppointments) * 100;
        return `<div style="display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;"><div class="chart-bar" style="height:${Math.max(height, 5)}%;"></div></div>`;
    }).join('');

    labelsContainer.innerHTML = dailyData.map(d => {
        const date = d.date ? d.date.slice(5) : '';
        return `<div class="chart-label">${date}</div>`;
    }).join('');
}

function renderCategoryList(categories) {
    const container = $('categoryList');
    if (!container) return;

    if (!categories || categories.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:20px;"><p>暂无分类数据</p></div>';
        return;
    }

    const colors = ['var(--blue)', 'var(--green)', 'var(--orange)', 'var(--purple)', 'var(--pink)', 'var(--red)'];
    
    container.innerHTML = categories.map((c, i) => `
        <div class="category-item">
            <div class="category-color" style="background:${colors[i % colors.length]};"></div>
            <div class="category-info">
                <h4>${escHtml(c.category)}</h4>
                <p>${c.service_count}个服务 · ${c.appointment_count}次预约</p>
            </div>
            <div class="category-revenue">¥${(c.revenue || 0).toFixed(0)}</div>
        </div>
    `).join('');
}

function renderProviderRanking(providers) {
    const container = $('providerRanking');
    if (!container) return;

    if (!providers || providers.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:20px;"><p>暂无服务商数据</p></div>';
        return;
    }

    container.innerHTML = providers.map((p, i) => `
        <div class="provider-rank-item">
            <div class="rank-badge ${i < 3 ? 'top3' : ''}">${i + 1}</div>
            <div class="provider-rank-info">
                <h4>${escHtml(p.provider_name)}</h4>
                <p>${p.service_count}个服务 · ${p.appointment_count}次预约</p>
            </div>
            <div class="provider-rank-revenue">¥${(p.revenue || 0).toFixed(0)}</div>
        </div>
    `).join('');
}

function renderStatusDistribution(statusData) {
    const container = $('statusDistribution');
    if (!container) return;

    if (!statusData || statusData.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:20px;"><p>暂无预约数据</p></div>';
        return;
    }

    const total = statusData.reduce((sum, s) => sum + (s.count || 0), 0);
    const statusLabels = { 'pending': '待确认', 'confirmed': '已确认', 'completed': '已完成', 'cancelled': '已取消' };

    container.innerHTML = statusData.map(s => `
        <div class="status-item">
            <span class="status-label">${statusLabels[s.status] || s.status}</span>
            <div class="status-bar-bg">
                <div class="status-bar-fill ${s.status}" style="width:${total > 0 ? (s.count / total * 100) : 0}%;"></div>
            </div>
            <span class="status-count">${s.count}</span>
        </div>
    `).join('');
}

function renderCouponStats(couponStats) {
    const container = $('couponStats');
    if (!container) return;

    container.innerHTML = `
        <div class="coupon-stat-item">
            <div class="stat-value">${couponStats.total_coupons || 0}</div>
            <div class="stat-label">优惠券总数</div>
        </div>
        <div class="coupon-stat-item">
            <div class="stat-value">${couponStats.total_issued || 0}</div>
            <div class="stat-label">已发放</div>
        </div>
        <div class="coupon-stat-item">
            <div class="stat-value">${couponStats.total_used || 0}</div>
            <div class="stat-label">已使用</div>
        </div>
        <div class="coupon-stat-item">
            <div class="stat-value">¥${(couponStats.total_discount || 0).toFixed(0)}</div>
            <div class="stat-label">优惠金额</div>
        </div>
    `;
}

function claimCoupon(couponId) {
    api('/api/coupons/' + couponId + '/claim', { method: 'POST' }).then(({ status, data }) => {
        if (status === 200) {
            showToast('领取成功！', 'success');
            loadUserCoupons();
        } else {
            showToast(data.error || '领取失败', 'error');
        }
    });
}

function useUserCoupon(userCouponId) {
    api('/api/coupons/user/' + userCouponId + '/use', { method: 'POST' }).then(({ status, data }) => {
        if (status === 200) {
            showToast('优惠券使用成功！', 'success');
            loadUserCoupons();
        } else {
            showToast(data.error || '使用失败', 'error');
        }
    });
}

// ==================== Utilities ====================
function getCategoryIcon(category) {
    const icons = { '医疗': '⚤', '美容': '♠', '健身': '♢', '教育': '♣', '家政': '♥', '法律': '♦' };
    return icons[category] || '♦';
}

function getCategoryClass(category) {
    const map = { '医疗': 'medical', '美容': 'beauty', '健身': 'fitness', '教育': 'education', '家政': 'household', '法律': 'legal' };
    return map[category] || 'medical';
}

function getStatusText(status) {
    const map = { 'pending': '待确认', 'confirmed': '已确认', 'completed': '已完成', 'cancelled': '已取消' };
    return map[status] || status;
}

function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==================== Init ====================
document.addEventListener('DOMContentLoaded', () => {
    const loggedIn = initAuth();
    if (loggedIn) {
        navigateToDefaultPage();
    } else {
        currentPage = 'home';
        loadHomePage();
    }
    initScrollReveal();
    animateCounters();

    // Combined scroll handler for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleNavScroll();
                updateActiveNavLink();
                updateScrollProgress();
                updateBackToTop();
                handleParallax();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Initial nav check
    handleNavScroll();
    updateScrollProgress();
    updateBackToTop();
});