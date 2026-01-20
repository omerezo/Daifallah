# **App Name**: UmmaTech Aid

## Core Features:

- Dashboard: Display key performance indicators (KPIs) such as total collected this month, total expenses, net balance and active members. Provides a quick overview of the charity's financial status.
- Payment Recording: Modal to record a payment. Supports multiple currencies (USD, SAR, EGP, SDG) and stores payment information in the Supabase database.
- Monthly & Yearly Reports: Generates monthly and yearly financial reports with visual charts (Bar/Pie) comparing income and expenses. Allows users to export reports to PDF.
- Payment Management: Allows CRUD operations on payments. Includes features to generate and export receipts to CSV and PDF. Uses Supabase database.
- Participants Management: Manages participant data. Includes features to add, edit, activate/deactivate, and delete participants. Export participant lists to CSV.
- Expenses Management: Allows adding, editing, and deleting expenses. Supports exporting expenses to CSV/PDF. Uses Supabase database.
- Role-Based Access Control: Implements different user roles (Admin, Manager, Collector, Viewer) with specific permissions and capabilities.

## Style Guidelines:

- Primary color: Earthy brown (#A68B64), evoking a sense of grounding and community.
- Background color: Light beige (#F5F5DC), providing a neutral and calming backdrop.
- Accent color: Soft green (#90EE90), symbolizing growth and aid.
- Body font: 'PT Sans', sans-serif, for body text.
- Headline font: 'Playfair', modern serif, suitable for headlines. Paired with PT Sans for longer text.
- Lucide-React icons for a clean, consistent, and modern UI.
- Responsive design supporting both Light and Dark modes. RTL layout support for Arabic language.