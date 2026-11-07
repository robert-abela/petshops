# LAS3024 Programming in Python

A buildless, dependency-free static site for GitHub Pages. Open index.html directly or serve this directory with any static HTTP server. All paths are relative, so project Pages sites work under /repository-name/. No external fonts, APIs, images, or CDN scripts are required.

## Publish on GitHub Pages

1. Create a GitHub repository and upload the **contents** of this folder to its root (index.html must be at the root). Include .nojekyll.
2. In repository Settings → Pages, select Deploy from a branch.
3. Select your branch (usually main) and / (root), then Save.
4. GitHub provides the Pages URL after deployment.

## Stores and data

Store A: store-a/index.html — article cards, definition lists, and Schema.org Product/Offer microdata.
Store B: store-b/index.html — a semantic table with caption, column headers and product rows.
Each store has 100 items, including shared lines and different names, prices, and stock. Prices are fictional EUR examples. No purchases or payments are processed.

Each product includes ID, name, price, currency, pack size, explicit Yes/No availability, description, local SVG placeholder, pet, category, and food subtype where applicable. Each store has four static HTML pages with exactly 25 products per page: index.html, page-2.html, page-3.html and page-4.html. Follow the links in nav.pagination to scrape the full catalog without JavaScript. Page size is fixed. JavaScript searches and sorts the full catalog, then shows up to 25 matching products per page; filters persist in pagination URLs. Product markup for the full catalog is embedded as JSON for this enhancement, without fetch requests or a backend. Both stores expose a catalog.json download.

### Scraping

Store A: select article.product-card; read data-id, data-pet, data-category, data-food, data-price and data-stock. Name: h3; description: .description; pack size: the definition list. Schema.org microdata is also included.
Store B: select tbody#products > tr.inventory-row; the same data attributes are available. Columns are product/description, pet/category, pack size, price and stock. Name: h3; description: .description; ID: .sku.
All prices also use a data element with a machine-readable value. Stock attributes use yes/no. catalog.json provides every field without HTML parsing.

## Applicability

Dogs and cats cover all seven categories, including wet, dry and treat foods. Rodents have dry foods and treats, toys, cages/transport, grooming, litter/bedding and supplements. Wet food and flea/tick treatments are omitted for rodents; listings distinguish hamster, guinea pig and chinchilla use. Training pads cover the dog litter category. Medicine and supplement entries are illustrative and require product-specific professional advice.

## Editing

Edit the static HTML and the matching catalog.json together. CSS and the progressive-enhancement filter script are in assets/. The supplied local SVG drawings are original placeholders, not product photography. The accompanying source generator build.cjs reproduces the full site, including CSS from styles.json; run node tools/build.cjs from this directory after editing its catalog definitions, tools/extra-products.json or tools/styles.json. Run node tools/check.cjs to validate the generated site. Pagination generation lives in tools/paginate.cjs; browser filtering and pagination are in tools/catalog-runtime.js.
