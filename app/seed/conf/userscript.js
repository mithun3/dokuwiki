/**
 * Field Recording Wiki - Custom Scripts
 */

// PayPal Donation Button Injection
// DokuWiki strips external links from wiki syntax, so we inject via JS
(function() {
  jQuery(function($) {
    // Find sidebar and add PayPal button
    var sidebar = document.getElementById('dokuwiki__aside');
    if (sidebar) {
      var paypalDiv = document.createElement('div');
      paypalDiv.id = 'paypal-donate';
      paypalDiv.innerHTML = '<a href="https://paypal.me/mithun3a" target="_blank" rel="noopener" class="paypal-btn">💳 Donate via PayPal</a>';
      
      // Insert at end of sidebar content
      var sidebarContent = sidebar.querySelector('.aside');
      if (sidebarContent) {
        sidebarContent.appendChild(paypalDiv);
      } else {
        sidebar.appendChild(paypalDiv);
      }
      console.log('[PayPal] Button injected into sidebar');
    }
  });
})();
