# Solar Edge LLC storefront

Responsive Vite storefront for Solar Edge LLC, rebuilt from the pages at solarvistaenergyllc.com. Tailwind CSS v4 powers the visual layer in `src/index.css`.

## Run locally

```sh
npm install
npm run dev
```

Build with `npm run build`.

## Routes

The site uses hash routes: `#/`, `#/shop`, `#/shop/:category`, `#/p/:sku`, `#/trade`, `#/about`, `#/faq`, `#/contact`, `#/checkout`, `#/privacy`, `#/terms`, `#/shipping`, `#/returns`, and `#/warranty`.

## Store data and requests

Products and business details live in `public/data.js`. The cart and pricing mode are saved in the visitor's browser. Contact, trade, and order forms prepare an email to `support@solaredge-llc.com`; no online payment or server-side form processing is connected. Product listings are illustrative and should be verified against inventory and supplier specifications before live sales.

