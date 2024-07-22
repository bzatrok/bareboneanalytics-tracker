
# Amberglass.ProductAnalytics

### What does this script do?

This javascript script will run a client-side event tracker on the website it's embedded on. it's main goal is to provide a lightweight way to track event related to content displayed on the front-end. The script looks for HTML elements with specific attributes and observes changes to these elements.

### What does this script track?
- Impressions: The script tracks when products become visible in the customer's browser window. First impressions are tracked only per customer.
- Clicks: Product interactions are tracked every time they're clicked.

### Where does the script send the data?
The script sends the following data to your backend logging server endpoint:
- clientId: Anonymously dentifies the client storefront using the script.
- userId: Unique identifier for the user (generated and stored in LocalStorage).
- eventType: Indicates the type of event, either impression or click.
- productIds: Array of product IDs (for impressions) or a single product ID (for clicks).
- timestamp: The exact time when the event occurred.

### How can you embed the script?
Before embedding the script, the front-end of the website you want to track needs to be updated. The script expects the following attribute `amberglass-analytics-data-product-id` to be added to your product cards. This is necessary, otherwise the script will not be able to find the your products & track events.

Front-end example:

```html
<div amberglass-analytics-data-product-id="12345" class="product">
    <!-- Product details here -->
</div>
```
 
After front-end changes are done, you can embed the script on your website. It is recommended you put the script behind a CDN.

```html
<script src="https://your-cdn.com/tracking.js?client_id=ABC123&environment=uat" defer></script>
```

The script requires the following parameters:
- client_id: a unique identifier of your customer (required).
- environment: can be 'production' or 'uat' (defaults to 'production').