# Sample inventory CSV files

These files contain fictional Canadian B2B supplier and stockroom data for testing the app's CSV import flow. Contact emails use reserved `example.com` domains and phone numbers use fictional 555-01xx numbers.

- `suppliers.csv`: 24 suppliers
- `products.csv`: 192 products across 12 categories

## Import order and supplier IDs

Import `suppliers.csv` first from the Suppliers page, then import `products.csv` from the Products page. The product rows refer to supplier IDs 1 through 24, matching the order in `suppliers.csv` when it is imported into an empty supplier table with a fresh ID sequence.

The app's supplier CSV format does not import IDs. If your database already has suppliers or its supplier ID sequence has advanced, do not import the product file as-is: its supplier IDs may point to different suppliers or may not exist. The app appends imported rows and rejects duplicate SKUs, so import each sample file only once unless you first remove the prior sample records and restore the expected IDs.

All files use the exact CSV headers expected by the application. No data has been inserted into your database.
