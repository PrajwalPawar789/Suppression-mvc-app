// public/disableInspect.js

// Disable right-click context menu
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  });
  
  // Disable keyboard shortcuts for developer tools
  document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.shiftKey && e.key === 'J') || (e.ctrlKey && e.key === 'U')) {
      e.preventDefault();
    }
  });
  