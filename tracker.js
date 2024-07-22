(function() {
    const logUrl = 'https://your-tracking-server.com/log';

    // Retrieve client ID and environment from script URL query parameters
    function getParamsFromScript() {
        const scripts = document.getElementsByTagName('script');
        const currentScript = scripts[scripts.length - 1];
        const urlParams = new URLSearchParams(currentScript.src.split('?')[1]);
        return {
            clientId: urlParams.get('client_id'),
            environment: urlParams.get('environment') || 'production'
        };
    }

    const { clientId, environment } = getParamsFromScript();

    // If no clientId is provided, do not proceed
    if (!clientId) {
        console.warn('Tracking script disabled: client_id is missing.');
        return;
    }

    function trackImpressions(productIds) {
        fetch(logUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientId: clientId,
                userId: getUserId(),
                eventType: 'impression',
                productIds: productIds,
                environment: environment,
                timestamp: new Date().toISOString()
            })
        })
        .catch(error => console.error('Error logging impression:', error));
    }

    function trackClicks(productId) {
        fetch(logUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientId: clientId,
                userId: getUserId(),
                eventType: 'click',
                productId: productId,
                environment: environment,
                timestamp: new Date().toISOString()
            })
        })
        .catch(error => console.error('Error logging click:', error));
    }

    function getUserId() {
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

    function initTracking() {
        const products = document.querySelectorAll('[barebone-analytics-data-product-id]');
        const impressionsLogged = new Set();

        const observer = new IntersectionObserver((entries, observer) => {
            const visibleProducts = [];

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const productId = entry.target.getAttribute('barebone-analytics-data-product-id');
                    if (!impressionsLogged.has(productId)) {
                        visibleProducts.push(productId);
                        impressionsLogged.add(productId);
                    }
                }
            });

            if (visibleProducts.length > 0) {
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
        });

        const mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const productElements = node.querySelectorAll('[barebone-analytics-data-product-id]');
                        if (node.hasAttribute('barebone-analytics-data-product-id')) {
                            productElements.push(node);
                        }
                        productElements.forEach(product => {
                            observer.observe(product);
                            product.addEventListener('click', handleClick);
                        });
                    }
                });

                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const productElements = node.querySelectorAll('[barebone-analytics-data-product-id]');
                        if (node.hasAttribute('barebone-analytics-data-product-id')) {
                            productElements.push(node);
                        }
                        productElements.forEach(product => {
                            product.removeEventListener('click', handleClick);
                        });
                    }
                });
            });
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function handleClick(event) {
        const productId = event.currentTarget.getAttribute('barebone-analytics-data-product-id');
        trackClicks(productId);
    }

    document.addEventListener('DOMContentLoaded', initTracking);
})();