=== GLOBAL DESIGN SYSTEM ===
App: Pet Shop ERP – Pet Shop Management System
Language: English
Platform: Web application, desktop-first, breakpoint 1440px

COLOR PALETTE:
- Primary (Coral/Earthy Orange): #F97316
- Primary Dark (hover): #EA6C0A
- Primary Light (tint): #FFF0E6
- Background (page): #F9FAFB
- Surface (card/table): #FFFFFF
- Border/Divider: #E5E7EB
- Success (Green): #10B981
- Warning (Amber): #F59E0B
- Danger (Red): #EF4444
- Info (Blue): #3B82F6
- Text Primary: #111827
- Text Secondary: #6B7280
- Text Disabled: #D1D5DB
- Sidebar BG: #1C1C2E (dark navy)
- Sidebar Active: #F97316
- Sidebar Text: #CBD5E1

TYPOGRAPHY:
- Headings / Menu / Labels: Nunito (Google Font), weight 600–800
- Body / Table data / Input: Roboto (Google Font), weight 400–500
- H1: Nunito 28px Bold | H2: Nunito 22px SemiBold | H3: Nunito 18px SemiBold
- Body: Roboto 14px Regular | Small: Roboto 12px Regular | Button: Nunito 14px SemiBold

COMPONENT STYLE:
- Border radius: Cards=12px, Buttons=8px, Inputs=8px, Badges=99px (pill), Modal=16px
- Shadow (card): 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)
- Shadow (modal): 0 8px 32px rgba(0,0,0,0.14)
- Sidebar width: 240px (expanded), 64px (collapsed/icon-only)
- Header height: 64px
- Spacing unit: 8px base (use 8, 16, 24, 32, 48)

BRAND LOGO: Paw print icon (minimalist flat style, #F97316) + text "PetERP" in Nunito Bold

STATUS BADGES (pill shape, small):
- Active / In Stock / Paid → bg:#D1FAE5, text:#065F46
- Warning / Low Stock / Pending → bg:#FEF3C7, text:#92400E
- Out of Stock / Cancelled / Rejected → bg:#FEE2E2, text:#991B1B
- Info / Processing → bg:#DBEAFE, text:#1E40AF

OVERALL STYLE: Soft Modern / Friendly Minimalist ERP
- Clean, airy layout with generous whitespace
- Soft drop shadows to separate content zones
- Rounded corners throughout for a friendly, approachable feel
- Primary coral color used sparingly as accent for CTAs and active states
Design a Login screen for "PetERP" – a pet shop ERP management system.

LAYOUT:
- Full-screen layout, vertically and horizontally centered card
- Left panel (50%): Brand panel with coral gradient background (#F97316 → #EA6C0A),
  large paw print illustration (white, semi-transparent), tagline "Smarter pet shop
  management" in white Nunito font, decorative scattered small paw icons
- Right panel (50%): White form panel

FORM PANEL CONTENT:
- Logo: paw print icon + "PetERP" text (Nunito Bold, #F97316)
- Heading: "Welcome back 👋" (Nunito 28px Bold, #111827)
- Subtext: "Log in to continue managing the system" (Roboto 14px, #6B7280)
- Input: "Username" with user icon prefix
- Input: "Password" with lock icon + eye-toggle visibility suffix
- Checkbox: "Remember me"
- Primary button (full width): "LOGIN" (#F97316, Nunito SemiBold, 16px, height 48px, radius 8px)
- Forgot password link below button

STATES:
- Default: clean empty form
- Error state: Input border turns #EF4444, red error message below "Incorrect username or password"
- Loading state: Button shows spinner, text "Logging in..."

DESIGN SYSTEM: [paste Global Design System above]
Style: Soft Modern, friendly, professional
Design a Dashboard screen for "PetERP" pet shop ERP.

GLOBAL LAYOUT:
- Left: Dark navy sidebar (240px) with paw print logo at top, vertical nav menu:
  [Dashboard ✦ active, Sales, Products, Customers, Pets, Inventory, HR,
  Attendance, Leave, Payroll], user avatar + name at bottom
- Top header (64px): Page title "Dashboard", date display, notification bell icon,
  user avatar with dropdown
- Main content: #F9FAFB background, 24px padding all sides

MAIN CONTENT LAYOUT (top to bottom):

ROW 1 – KPI CARDS (4 cards, equal width, horizontal row):
  Card 1 – Today's Revenue: big number "12,450,000 ₫", trend "+8.2% vs yesterday",
            icon: trending-up (green), accent border-left #F97316
  Card 2 – Today's Orders: "24 orders", "+3 vs yesterday", icon: shopping-bag (blue)
  Card 3 – New Customers: "7 Customers", icon: users (purple)
  Card 4 – Inventory Alert: "5 products almost out of stock", icon: alert-triangle (#F59E0B), highlight card

ROW 2 – CHARTS (2 columns, 60/40 split):
  Left (60%): Bar chart "Revenue last 7 days", X-axis = days of week,
              bars in #F97316 with rounded tops, hover tooltip showing revenue
  Right (40%): Donut chart "Order Classification" with legend:
               Paid (green), Processing (amber), Cancelled (red)

ROW 3 – DATA TABLES + ALERT (2 columns, 50/50):
  Left: Card "Top selling products" — table with rank badge, product name,
        thumbnail image, quantity sold, revenue. 5 rows max.
  Right: Card "Low stock alert" — table listing products with stock < 5.
         Each row has product name, current stock (red bold), warning badge.
         Alert banner at top of card: amber background "5 products need restocking"

DESIGN SYSTEM: [paste Global Design System above]
Design a Point-of-Sale (POS) screen for "PetERP" pet shop.
This is a dedicated full-page layout (no standard sidebar – only a top bar).

TOP BAR (64px, white, shadow):
- Left: Back arrow + "Sales" title (Nunito Bold)
- Center: Search bar "Search product by name or code..." (full-width, prominent)
- Right: Current cashier name + avatar

MAIN LAYOUT (2 panels, horizontal split):

LEFT PANEL (70% width, #F9FAFB background):
  - Category filter tabs (horizontal scroll): All | Food | Accessories | Services | Medicine
  - Product grid (4 columns of cards):
    Each product card (white, shadow, radius 12px):
      - Product image (square, rounded 8px)
      - Product name (Nunito SemiBold, 2 lines max)
      - Price (bold, #F97316)
      - Stock badge (green "In stock" / red "Out of stock")
      - [+ Add] button at bottom (coral, full-width)
  - Out-of-stock cards: 50% opacity, disabled state

RIGHT PANEL (30% width, white, left border #E5E7EB):
  TOP SECTION – Customer Search:
    - Label: "Customer"
    - Search input: "Search by phone number..." with phone icon
    - When found: customer card shows name, loyalty tier badge (Bronze/Silver/Gold),
      accumulated points, membership number

  MIDDLE SECTION – Cart (scrollable):
    - Title: "Cart (3 items)"
    - Each cart item row: product thumbnail + name + price + quantity stepper (−/+) + delete icon
    - Empty cart state: paw print icon + "No products yet"

  BOTTOM SECTION – Order Summary (fixed, coral accent):
    - Subtotal row
    - Discount row (if applicable, input field for discount code)
    - Divider
    - TOTAL row (large, Nunito Bold 24px, #F97316)
    - Payment method selector: [Cash] [Bank Transfer] [Card Swipe] (toggle buttons)
    - Big CTA button: "PAY" (full-width, 52px height, #F97316, Nunito Bold)

DESIGN SYSTEM: [paste Global Design System above]
Design a Product Management screen for "PetERP" pet shop ERP.

LAYOUT: Standard sidebar + content area layout.

PAGE HEADER (inside content area):
- Left: Title "Products" (H1), subtext "Manage all store merchandise"
- Right: [+ Add product] button (#F97316, Nunito SemiBold, icon: plus)

FILTER BAR (below header, card white):
- Search input: "Search by name, product code..." (width 320px)
- Dropdown: "Product Type" (Food / Accessories / Medicine / Services)
- Dropdown: "Status" (All / In stock / Out of stock / Discontinued)
- [Filter] button (outline style)

DATA TABLE (white card, full width, with shadow):
Columns (8):
  1. Checkbox (multi-select)
  2. Image (40x40 thumbnail, rounded 6px)
  3. Product Name (bold, + SKU code in small gray text below)
  4. Category (category badge, blue pill)
  5. Selling Price (formatted "150,000 ₫", right-aligned)
  6. Stock (number; if < 5 show red bold + warning icon; if 0 show "Out of stock" badge)
  7. Can sell (toggle switch, green when on)
  8. Actions (✏️ Edit | 🗑️ Delete, icon buttons)

Table features:
- Sticky header row
- Alternating row background (#FAFAFA for even rows)
- Hover row: light coral tint (#FFF0E6)
- Pagination: "Showing 1–10 of 48 products" + prev/next buttons + page size selector

MODAL – ADD / EDIT PRODUCT (overlay, centered, width 560px):
- Title: "Add new product" / "Edit product"
- Image upload zone: dashed border, paw icon, "Drag and drop image or click to select"
  (shows preview thumbnail after upload)
- Form fields (2-column grid):
  - Product name (full width, required)
  - SKU Code | Product type (dropdown)
  - Import price | Selling price
  - Current stock | Minimum stock (warn when below threshold)
  - Can buy in (toggle) | Can sell out (toggle)
  - Description (textarea, full width)
- Footer: [Cancel] (outline) + [Save product] (#F97316)

DESIGN SYSTEM: [paste Global Design System above]
Design a Customer Management screen for "PetERP" pet shop ERP.

PAGE HEADER:
- Title: "Customers", subtext "Manage profiles and categorize customers"
- [+ Add customer] button (coral)

STATS ROW (4 mini-cards above table):
- Total customers: "248"
- Gold Customers: "32" (badge gold #F59E0B)
- Silver Customers: "87" (badge silver #94A3B8)
- Bronze Customers: "129" (badge bronze #CD7F32)

FILTER BAR:
- Search: "Search by name, Phone..."
- Dropdown: Customer tier (All / Bronze / Silver / Gold)
- Dropdown: Status

DATA TABLE columns:
  1. Checkbox
  2. Customer (avatar initials circle + full name + phone below)
  3. Tier (loyalty tier badge):
     - 🥇 Gold → gold bg badge
     - 🥈 Silver → silver bg badge
     - 🥉 Bronze → bronze bg badge
  4. Accumulated points (number with star icon ⭐)
  5. Total spend (formatted currency, #F97316 color for big spenders)
  6. Total orders
  7. Registration date (DD/MM/YYYY)
  8. Status (badge: Active green / Locked red)
  9. Actions (👁 View | ✏️ Edit)

CUSTOMER DETAIL DRAWER (slides in from right, 480px wide):
- Customer header: large avatar, name (H2), tier badge, join date
- Stats row: Total spend | Orders | Points | Last visit
- Tabs: [Information] [Pets] [Purchase History]
  Tab 1: contact info, address, notes
  Tab 2: list of pets (name, species, gender)
  Tab 3: order history table

DESIGN SYSTEM: [paste Global Design System above]
Design a Pet Management screen for "PetERP" pet shop ERP.

PAGE HEADER:
- Title "Pets", subtext "Customer's pet profiles"
- [+ Add pet] button (coral)

LAYOUT: 2-column split

LEFT (35%): Customer Owner Card
- Search customer: "Search owner by Phone or name..."
- When selected, show Customer Info Card (white card, shadow):
  - Avatar + Customer name (H3) + phone
  - Loyalty badge
  - Stats: "Number of pets: 3" | "Total spend: 2,400,000 ₫"
  - [View customer profile] link

RIGHT (65%): Pet List Table
- Title: "Pets of [Nguyen Van A]" (or "All pets" when no filter)
- DATA TABLE columns:
  1. # (number)
  2. Pet image (cute thumbnail or species avatar icon)
  3. Pet name (bold)
  4. Species (Dog / Cat / Rabbit… with species icon)
  5. Breed
  6. Gender (♂ Male blue tag / ♀ Female pink tag)
  7. Date of birth (+ calculated age "2 years old")
  8. Owner (link to customer)
  9. Actions (✏️ Edit | 🗑️ Delete)

MODAL – ADD PET (width 480px):
- Pet photo upload (circle avatar style)
- Fields: Name | Species (dropdown) | Breed | Gender (radio ♂/♀) | Date of birth (date picker)
  | Fur color | Weight (kg) | Health notes
- Owner: searchable dropdown linked to customer list

DESIGN SYSTEM: [paste Global Design System above]
Design an Inventory Management screen for "PetERP" pet shop ERP.

PAGE HEADER:
- Title "Inventory Management", subtext "Track stock, import goods and inventory count"
- Right: [📥 Import goods] + [📋 Export report] buttons

3 HORIZONTAL TABS (below header):
[Inventory] [Import] [Inventory Count]

--- TAB 1: INVENTORY ---
Alert banner (amber): "⚠️ 5 products have stock below minimum level – Need restocking immediately"
Filter: search + category dropdown + stock status filter
DATA TABLE:
  - Columns: # | Image | Product Name | Category | Current Stock | Minimum Stock |
             Import Price | Warehouse Location | Status
  - CRITICAL: Rows with stock < 5 → ENTIRE ROW has light red bg (#FEF2F2),
             stock number shown in bold red #EF4444 with alert icon ⚠️
  - Rows with stock = 0 → "Out of stock" badge (red pill), row slightly dimmed
  - Rows with stock ≥ 10 → stock shown in green #10B981

--- TAB 2: IMPORT ---
Form card "Goods Receipt Note" (white, shadow):
  - Supplier (searchable dropdown) | Import date (date picker)
  - Notes
  - Product list to import (add rows):
    | Product | Quantity | Import Unit Price | Total Amount |
    [+ Add product] button at bottom of table rows
  - Summary: Total import amount (large, coral)
  - [Cancel] + [Confirm import] buttons

Import history table below (collapsible): date | supplier | items | total | status badge

--- TAB 3: INVENTORY COUNT (Inventory Count) ---
Info banner (blue): "Enter actual quantity in the 'Actual' box. The system will auto-calculate the variance."
INLINE EDIT TABLE (Excel-like, click to edit cells directly):
  - Columns: Product | System Stock | Actual (editable, blue border when editing) |
             Variance (auto-calculated: positive=green, negative=red) | Notes
  - [Save inventory count] button (coral, fixed at bottom right)

DESIGN SYSTEM: [paste Global Design System above]
Design an HR (Human Resources) Management screen for "PetERP" pet shop ERP.

PAGE HEADER:
- Title "Human Resources", subtext "Manage employee profiles and roles"
- [+ Add employee] button (coral)

STATS CARDS ROW (4 cards):
- Total employees: "18"
- Currently working: "16" (green)
- On leave today: "2" (amber)
- New this month: "1" (blue)

LAYOUT: 2-panel (left 60% main table, right 40% weekly attendance quick view)

LEFT – EMPLOYEE TABLE:
Filter: search + role dropdown + status dropdown
Columns:
  1. Checkbox
  2. Employee (avatar circle with initials + full name + employee code below)
  3. Role badge (color-coded pills):
     - Admin → purple
     - Manager → blue
     - Sales Staff → coral (#F97316 tint)
     - Warehouse Staff → teal
     - Accountant → indigo
  4. Phone
  5. Start date
  6. Base salary (formatted)
  7. Status (badge: Working / On Leave / Resigned)
  8. Actions (👁 | ✏️ | 🗑️)

RIGHT – WEEKLY ATTENDANCE QUICK VIEW (white card):
Title: "Attendance this week (May 12–18)"
Table:
  - Rows = each employee (name + avatar)
  - Columns = days of week (Mon Tue Wed Thu Fri Sat Sun)
  - Each cell: ✅ (checked in, green) or ❌ (absent, red) or — (day off)
  - Clickable to toggle for quick update

EMPLOYEE DETAIL DRAWER (480px from right):
- Header: large avatar + name + role badge + status
- TABS: [Personal Info] [Salary & Insurance] [Attendance] [Leave]

DESIGN SYSTEM: [paste Global Design System above]
Design an Attendance / Time Tracking screen for "PetERP" pet shop ERP.

PAGE HEADER:
- Title "Attendance", subtext "Record employee work hours"

TOP SECTION – CHECK-IN/OUT CLOCK (centered card, prominent):
- Large digital clock display: "09:42:15" (Nunito Bold 56px, #111827)
- Current date below: "Wednesday, May 14, 2025"
- Current user's status: "You haven't clocked in today" or "Currently on shift – Clocked in at 08:30"
- 2 large CTA buttons side by side:
  [🟢 CLOCK IN] (green #10B981, 160px wide, 56px tall, Nunito Bold 16px)
  [🔴 CLOCK OUT] (red #EF4444, same size) — disabled until checked in
- After check-in: show today's summary card:
  "Time in: 08:30 | Time worked so far: 1h 12m"

MIDDLE SECTION – FILTER BAR:
- Month picker (current month default)
- Employee dropdown (for managers to view others)
- [Export Excel] button

BOTTOM SECTION – ATTENDANCE DETAIL TABLE (white card):
Title: "Attendance Table May 2025"
Columns:
  1. Date (date, weekends in gray italic)
  2. Day (day of week)
  3. Time in (time, or "–" if absent)
  4. Time out (time, or "–" if absent)
  5. Hours worked (calculated, e.g. "8.5h")
  6. Overtime (overtime hours, shown in #F97316 if > 0)
  7. Notes (Late / On time / Absent / On leave badge)
  8. Status (badge)

Summary footer row: Total hours worked | Total overtime | Days present/total

DESIGN SYSTEM: [paste Global Design System above]
Design a Leave Request Management screen for "PetERP" pet shop ERP.

PAGE HEADER:
- Title "Leave Requests", subtext "Manage leave applications and leave balances"

TOP ROW – LEAVE BALANCE CARDS (3 cards):
  Card 1 "Remaining leave days":
    - Big number: "8 days" (Nunito Bold 40px, #F97316)
    - Subtext: "Used 4/12 days in 2025"
    - Progress bar (coral, showing used portion)
  Card 2 "Pending approval": "2 requests" (amber color, clock icon)
  Card 3 "Approved this year": "4 requests" (green, check icon)

LAYOUT: 2-column below cards

LEFT (55%) – LEAVE HISTORY TABLE:
Filter: search + status dropdown + date range picker
Columns:
  1. # 
  2. Leave Type (Annual Leave / Sick / Unpaid / Personal)
  3. From date → To date
  4. Number of days
  5. Reason (truncated, hover to see full)
  6. Creation date
  7. Status BADGE (very important):
     - "Pending" → amber pill
     - "Approved" → green pill with ✓
     - "Rejected" → red pill with ✗
  8. Actions (View | Cancel — only for pending ones)

RIGHT (45%) – CREATE LEAVE REQUEST FORM (white card, always visible):
Title: "Create leave request"
Fields:
  - Leave type (select dropdown)
  - From date (date picker)
  - To date (date picker)
  - Auto-calculated: "Duration: 2 working days"
  - Reason (textarea, required)
  - Notes for manager (optional textarea)
- [Submit request] button (coral, full-width)
- Note below: "Requests will be reviewed by management within 24h"

DESIGN SYSTEM: [paste Global Design System above]
Design a Payroll Management screen for "PetERP" pet shop ERP.

PAGE HEADER:
- Title "Payroll", subtext "Manage payslips and employee salary profiles"
- Right: Month/Year picker (May 2025) + [📥 Calculate monthly payroll] button (coral) +
  [📤 Export Excel] button (outline)

TABS: [Monthly Payroll] [Employee Salary Profiles]

--- TAB 1: MONTHLY PAYROLL ---
Summary cards row (4):
- Total payroll fund: "85,000,000 ₫" (large, coral)
- Paid: "12/18 employees" (green)
- Unpaid: "6" (amber)
- Total deductions: "12,300,000 ₫" (gray)

PAYROLL TABLE (white card, shadow):
Columns:
  1. Employee (avatar + name)
  2. Base Salary (Gross)
  3. Allowance (Allowance)
  4. Work days | Actual days
  5. Bonus (if any, green)
  6. SI (social insurance, deduction)
  7. HI (health insurance, deduction)
  8. UI (unemployment insurance, deduction)
  9. PIT (PIT tax deduction)
  10. Net Pay (Net pay) — BOLD, larger font, #F97316
  11. Status (Paid green / Unpaid amber)
  12. Actions (👁 View payslip | ✏️ Edit | ✉️ Send payslip)

Row hover shows detailed breakdown tooltip

--- TAB 2: SALARY PROFILES ---
Left (40%): Employee list (searchable, click to select)
Right (60%): Selected employee salary profile form:
  - Base Salary (Gross)
  - Salary multiplier | Position allowance | Meal allowance | Gas allowance
  - SI rate (%) | HI rate (%) | UI rate (%)
  - PIT (auto-calculated or manual override)
  - Bank account (bank name + account number)
  - [Update salary profile] button (coral)

PAYSLIP MODAL (when clicking "View payslip"):
Clean, printable-style white layout:
  - Header: PetERP logo + "PAYSLIP" title + Month/Year
  - Employee info: name, ID, role, department
  - Two-column table: Income (left) | Deductions (right)
  - NET PAY box (large, coral background, white text): "Net Pay: 12,850,000 ₫"
  - [Print payslip] + [Send email] buttons

