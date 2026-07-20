// 为所有HTML页面添加新标签页打开功能
document.addEventListener('DOMContentLoaded', function() {
    // 查找所有导航链接
    const navLinks = document.querySelectorAll('.md-nav__link');
    
    navLinks.forEach(function(link) {
        // 检查链接的href属性是否以.html结尾
        const href = link.getAttribute('href');
        if (href && href.endsWith('.html')) {
            // 为HTML页面链接添加target="_blank"属性
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
});