// Splash Screen Logic for EzBill
document.addEventListener('DOMContentLoaded', () => {
    // Check if user has seen splash screen before
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    const splashScreen = document.getElementById('splash-screen');
    
    if (!splashScreen) return;
    
    // Minimum display time for splash screen (in milliseconds)
    const minimumDisplayTime = 3000; // 3 seconds
    const startTime = Date.now();
    
    // Function to hide splash screen
    const hideSplashScreen = () => {
        const currentTime = Date.now();
        const timeElapsed = currentTime - startTime;
        
        if (timeElapsed < minimumDisplayTime) {
            setTimeout(() => {
                splashScreen.style.opacity = '0';
                splashScreen.style.transition = 'opacity 0.5s ease-out';
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                    // Load the main app
                    window.location.href = 'index.html';
                }, 500);
            }, minimumDisplayTime - timeElapsed);
        } else {
            splashScreen.style.opacity = '0';
            splashScreen.style.transition = 'opacity 0.5s ease-out';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                // Load the main app
                window.location.href = 'index.html';
            }, 500);
        }
    };
    
    // Set flag to show splash screen on first load only or every time if desired
    if (!hasSeenSplash) {
        localStorage.setItem('hasSeenSplash', 'true');
    }
    
    // Simulate app initialization or loading
    setTimeout(hideSplashScreen, 2000);
});
