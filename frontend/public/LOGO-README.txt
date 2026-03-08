Use your own Applyn CRM logo
============================

To use your own logo image instead of the default SVG:

1. Save your logo file in this folder (frontend/public/).

2. Name the file exactly:  logo.png
   (Or use logo.svg / logo.webp and set env: NEXT_PUBLIC_LOGO_FILENAME=logo.svg)

3. Recommended size: at least 120x120 px so it stays sharp in the sidebar (28px) and on the login page (56px).

4. Restart the frontend dev server if it's already running:
   cd frontend && npm run dev

The app will show your image in:
- The sidebar (top left)
- The login / register page

If the file is missing or fails to load, the default Applyn CRM SVG logo is shown.
