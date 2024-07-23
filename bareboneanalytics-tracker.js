(function() {
    const logUrl = 'https://your-server/api/track';
    const observers = [];
    const trackedElements = new Set();

    // Retrieve client ID and environment from script URL query parameters
    function getParamsFromScript() {
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.src.includes('bareboneanalytics-tracker.js')) {
                const urlParams = new URLSearchParams(script.src.split('?')[1]);
                const params = {
                    clientId: urlParams.get('client_id'),
                    environment: urlParams.get('environment') || 'production'
                };
                console.log('Barebone Analytics: Parameters:', params);
                return params;
            }
        }
        console.warn('Barebone Analytics: Script "bareboneanalyticstracker.js" not found.');
        return { clientId: null, environment: 'production' };
    }

    const { clientId, environment } = getParamsFromScript();

    // If no clientId is provided, do not proceed
    if (!clientId) {
        console.warn('Barebone Analytics: Tracking script disabled: client_id is missing.');
        return;
    }

    function trackEvent(eventType, data) {
        console.log(`Barebone Analytics: Logging ${eventType}:`, data);
        const bodyData = {
            clientId: clientId,
            userId: getUserId(),
            eventType: eventType,
            environment: environment,
            timestamp: new Date().toISOString()
        };
        
        if (eventType === 'impression')
            bodyData.productIds = data;
        else if (eventType === 'click')
            bodyData.productIds = [data];
    
        fetch(logUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        })
        .catch(error => console.error(`Barebone Analytics: Error logging ${eventType}:`, error));
    }
    
    function trackImpressions(productIds) {
        trackEvent('impression', productIds);
    }
    
    function trackClicks(productId) {
        trackEvent('click', productId);
    }

    function getUserId() {
        console.log('Barebone Analytics: Getting user ID from local storage: ', localStorage.getItem('userId'));
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = generateUUID();
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function handleClick(event) {
        const productId = event.currentTarget.getAttribute('barebone-analytics-data-product-id');
        trackClicks(productId);
    }

    function observeNewElements(observer) {
        const mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const productElements = node.querySelectorAll('[barebone-analytics-data-product-id]');
                        if (node.hasAttribute('barebone-analytics-data-product-id')) {
                            observer.observe(node);
                            node.addEventListener('click', handleClick);
                            trackedElements.add({ element: node, event: handleClick });
                        }
                        productElements.forEach(product => {
                            observer.observe(product);
                            product.addEventListener('click', handleClick);
                            trackedElements.add({ element: product, event: handleClick });
                        });
                    }
                });

                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const productElements = node.querySelectorAll('[barebone-analytics-data-product-id]');
                        if (node.hasAttribute('barebone-analytics-data-product-id')) {
                            node.removeEventListener('click', handleClick);
                            trackedElements.delete({ element: node, event: handleClick });
                        }
                        productElements.forEach(product => {
                            product.removeEventListener('click', handleClick);
                            trackedElements.delete({ element: product, event: handleClick });
                        });
                    }
                });
            });
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        observers.push(mutationObserver);
    }

    function initTracking() {
        console.log('Barebone Analytics: Initializing tracking...');
        const products = document.querySelectorAll('[barebone-analytics-data-product-id]');
        const impressionsLogged = new Set();

        console.log('Barebone Analytics: Found products:', products);

        const observer = new IntersectionObserver((entries) => {
            const visibleProducts = [];

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const productId = entry.target.getAttribute('barebone-analytics-data-product-id');
                    console.log('Barebone Analytics: Product visible:', productId);
                    if (!impressionsLogged.has(productId)) {
                        visibleProducts.push(productId);
                        impressionsLogged.add(productId);
                    }
                }
            });

            if (visibleProducts.length > 0) {
                console.log('Barebone Analytics: Visible products:', visibleProducts);
                trackImpressions(visibleProducts);
            }
        }, {
            root: null,
            rootMargin: '0px',
            threshold: 0.5  // Trigger when 50% of the product is visible
        });

        products.forEach(product => {
            observer.observe(product);
            product.addEventListener('click', handleClick);
            trackedElements.add({ element: product, event: handleClick });
        });

        observers.push(observer);
        observeNewElements(observer);
    }

    function cleanup() {
        console.log('Barebone Analytics: Cleaning up tracking...');
        observers.forEach(observer => observer.disconnect());
        trackedElements.forEach(({ element, event }) => {
            element.removeEventListener('click', event);
        });
        trackedElements.clear();
    }

    document.addEventListener('DOMContentLoaded', initTracking);

    // Expose cleanup function to the global scope for testing purposes
    window.trackingCleanup = cleanup;
})();
