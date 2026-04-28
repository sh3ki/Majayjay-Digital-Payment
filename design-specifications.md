# 🎨 Design Specifications

**Development of a QR-Enabled Integrated Payment System with Transactional Analytics Dashboard for Government Fees of Majayjay, Laguna**

---

## 🌈 Color Palette (Green Theme)

### Primary Colors

#### Primary Green
```
Hex: #00873E
RGB: (0, 135, 62)
HSL: (147°, 100%, 27%)
Usage: Main buttons, active elements, primary CTAs
Applications: Login button, Pay button, Success states
```

#### Light Green
```
Hex: #E8F5E9
RGB: (232, 245, 233)
HSL: (135°, 62%, 94%)
Usage: Backgrounds, subtle accents, hover states
Applications: Card backgrounds, section dividers, success alerts
```

#### Dark Green
```
Hex: #004D2E
RGB: (0, 77, 46)
HSL: (147°, 100%, 15%)
Usage: Text, dark accents, navigation elements
Applications: Headers, main text, navigation bar
```

#### Accent Green
```
Hex: #26A69A
RGB: (38, 166, 154)
HSL: (172°, 63%, 40%)
Usage: Secondary buttons, links, minor accents
Applications: Secondary CTAs, breadcrumbs, links
```

### Secondary Colors

#### Light Gray
```
Hex: #F5F5F5
RGB: (245, 245, 245)
HSL: (0°, 0%, 96%)
Usage: Page backgrounds, neutral areas
Applications: Main background, section backgrounds
```

#### Medium Gray
```
Hex: #BDBDBD
RGB: (189, 189, 189)
HSL: (0°, 0%, 74%)
Usage: Borders, disabled states, dividers
Applications: Input borders (inactive), divider lines, disabled buttons
```

#### Dark Gray
```
Hex: #424242
RGB: (66, 66, 66)
HSL: (0°, 0%, 26%)
Usage: Primary text, strong accents
Applications: Body text, headers, labels
```

### Status Colors

#### Success
```
Hex: #4CAF50
RGB: (76, 175, 80)
HSL: (120°, 61%, 49%)
Usage: Successful transactions, paid status
Applications: Success alerts, paid badges, checkmarks
```

#### Warning
```
Hex: #FFC107
RGB: (255, 193, 7)
HSL: (45°, 100%, 51%)
Usage: Pending payments, overdue notices
Applications: Pending badges, warning alerts, attention messages
```

#### Error
```
Hex: #F44336
RGB: (244, 67, 54)
HSL: (4°, 90%, 58%)
Usage: Failed transactions, errors
Applications: Error alerts, failed badges, cancel actions
```

#### Info
```
Hex: #2196F3
RGB: (33, 150, 243)
HSL: (207°, 89%, 54%)
Usage: Information messages, confirmations
Applications: Info alerts, notification messages, tooltips
```

---

## 🖼️ Visual Design System

### Typography

#### Font Families
- **Primary Font**: Inter, Segoe UI, Roboto (sans-serif)
- **Fallback**: System fonts
- **Code Font**: Fira Code, Courier New (monospace)

#### Typography Scale
```
H1 (Page Title)
- Font size: 32px
- Font weight: 700 (Bold)
- Line height: 1.2
- Color: #004D2E

H2 (Section Title)
- Font size: 24px
- Font weight: 600 (Semibold)
- Line height: 1.3
- Color: #004D2E

H3 (Subsection Title)
- Font size: 20px
- Font weight: 600 (Semibold)
- Line height: 1.3
- Color: #004D2E

H4 (Card Title)
- Font size: 16px
- Font weight: 600 (Semibold)
- Line height: 1.4
- Color: #004D2E

Body (Regular Text)
- Font size: 14px
- Font weight: 400 (Regular)
- Line height: 1.5
- Color: #424242

Small (Caption, Label)
- Font size: 12px
- Font weight: 500 (Medium)
- Line height: 1.4
- Color: #757575

Button Text
- Font size: 14px
- Font weight: 600 (Semibold)
- Letter spacing: 0.5px
- Text transform: Uppercase (optional)
```

### Spacing System

#### Base Unit: 8px
```
XS:  4px   (minor spacing)
SM:  8px   (small spacing)
MD:  16px  (standard spacing)
LG:  24px  (large spacing)
XL:  32px  (extra large spacing)
2XL: 48px  (double extra large)
3XL: 64px  (triple extra large)
```

#### Application Examples
- Button padding: 12px 24px (SM+MD)
- Card padding: 24px (LG)
- Section margin: 32px (XL)
- Component gap: 16px (MD)

### Border Radius

```
Minimal: 2px
Small:   4px
Medium:  8px (default for cards, inputs)
Large:   12px (buttons)
Extra Large: 16px (large containers)
Full:    50% (for circles, pills)
```

---

## 📱 Layout Components

### Navigation Bar

#### Desktop Navigation
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Bills │ Payments │ Reports        │
│                                        [Profile ▼]     │
└─────────────────────────────────────────────────────────┘

- Background: #00873E (Primary Green)
- Height: 64px
- Text: White
- Fixed positioning: top
- Shadow: 0 2px 4px rgba(0,0,0,0.1)
```

#### Mobile Navigation (Hamburger Menu)
```
- Hamburger icon on left
- Logo in center
- User profile icon on right
- Sliding menu on left side
- Background: #00873E
```

#### Sidebar Navigation (Admin Dashboard)
```
┌──────────────┐
│   [Logo]     │
├──────────────┤
│ Dashboard    │
│ Bills        │
│ Payments     │
│ Reports      │
│ Users        │ (Admin only)
│ Settings     │ (Admin only)
└──────────────┘

- Width: 256px (desktop), 0px (mobile)
- Background: #F5F5F5
- Text: #004D2E
- Active item background: #E8F5E9
- Active item border-left: 4px #00873E
```

### Cards

#### Standard Card
```
┌─────────────────────────────────┐
│  Card Title                      │
├─────────────────────────────────┤
│                                  │
│  Card Content                    │
│                                  │
└─────────────────────────────────┘

- Background: White
- Border: 1px #BDBDBD
- Border radius: 8px
- Padding: 24px
- Box shadow: 0 1px 3px rgba(0,0,0,0.12)
- Hover shadow: 0 4px 6px rgba(0,0,0,0.15)
```

#### Compact Card (for lists)
```
┌─────────────────────────────────┐
│ Title              Amount  >    │
│ Subtitle                        │
└─────────────────────────────────┘

- Padding: 16px
- Height: 80px
- Clickable/Hoverable
```

### Buttons

#### Primary Button
```
┌─────────────┐
│  PAY NOW    │
└─────────────┘

- Background: #00873E
- Text: White
- Padding: 12px 32px
- Border radius: 8px
- Font weight: 600
- Hover: #006E33 (darker green)
- Active: #004D2E
- Disabled: #BDBDBD
- Transition: 200ms ease
```

#### Secondary Button
```
┌─────────────┐
│  CANCEL     │
└─────────────┘

- Background: Transparent
- Border: 2px #00873E
- Text: #00873E
- Padding: 12px 32px
- Border radius: 8px
- Hover: #E8F5E9 (light green background)
- Active: #F5F5F5
- Transition: 200ms ease
```

#### Tertiary Button (Text-only)
```
Cancel  (or Forgot Password?)

- Background: Transparent
- Text: #26A69A
- Font weight: 500
- Hover: Text color: #004D2E
- Underline on hover: Yes
```

#### Icon Button
```
┌───┐
│ 🔔 │
└───┘

- Size: 40px × 40px
- Background: Transparent
- Border radius: 50%
- Hover background: #E8F5E9
- Icon color: #00873E
```

### Forms & Inputs

#### Text Input
```
Label *
┌─────────────────────────────┐
│ Placeholder text            │
└─────────────────────────────┘

- Height: 40px
- Padding: 12px 16px
- Border: 1px #BDBDBD
- Border radius: 4px
- Font size: 14px
- Focus: Border color #00873E, box-shadow: 0 0 0 3px #E8F5E9
- Error: Border color #F44336
- Disabled: Background #F5F5F5, color #BDBDBD
```

#### Select Dropdown
```
Label *
┌─────────────────────────────┐
│ Select Option         ▼     │
└─────────────────────────────┘

- Same styling as text input
- Dropdown arrow: #00873E
- Options background: #F5F5F5
- Hover option background: #E8F5E9
- Selected option: Background #00873E, text white
```

#### Checkbox
```
☑  Remember Me

- Size: 20px × 20px
- Border: 2px #BDBDBD
- Checked: Background #00873E, checkmark white
- Border radius: 4px
- Cursor: pointer
- Focus: Box shadow 0 0 0 3px #E8F5E9
```

#### Radio Button
```
◯  Option 1
◉  Option 2

- Size: 20px diameter
- Border: 2px #BDBDBD
- Inner circle (selected): 8px diameter, #00873E
- Border radius: 50%
- Spacing between: 12px
```

#### Toggle Switch
```
Off                      On
┌─────────┐         ┌─────────┐
│ ◯       │         │       ◉ │
└─────────┘         └─────────┘

- Width: 48px, Height: 24px
- Background (off): #BDBDBD
- Background (on): #00873E
- Circle: 20px, white, position animated
- Border radius: 12px (pill shape)
- Transition: 300ms ease
```

#### Text Area
```
Notes or Description
┌─────────────────────┐
│                     │
│                     │
│                     │
└─────────────────────┘

- Min height: 100px
- Padding: 12px 16px
- Resize: Vertical only
- Same border/focus styling as text input
- Line height: 1.5
```

### Alerts & Notifications

#### Success Alert
```
┌─────────────────────────────────────────────┐
│ ✓ Payment successful! Receipt sent via SMS  │
└─────────────────────────────────────────────┘

- Background: #E8F5E9
- Border-left: 4px #4CAF50
- Icon: ✓ (green #4CAF50)
- Text: #004D2E
- Padding: 16px
- Border radius: 4px
- Close button: X
```

#### Error Alert
```
┌─────────────────────────────────────────────┐
│ ✗ Payment failed. Please try again.         │
└─────────────────────────────────────────────┘

- Background: #FFEBEE
- Border-left: 4px #F44336
- Icon: ✗ (red #F44336)
- Text: #C62828
- Padding: 16px
- Border radius: 4px
```

#### Warning Alert
```
┌─────────────────────────────────────────────┐
│ ⚠ Payment overdue. Penalties apply.         │
└─────────────────────────────────────────────┘

- Background: #FFF8E1
- Border-left: 4px #FFC107
- Icon: ⚠ (yellow #FFC107)
- Text: #F57F17
- Padding: 16px
- Border radius: 4px
```

#### Info Alert
```
┌─────────────────────────────────────────────┐
│ ℹ Your bill is due on May 31, 2026.         │
└─────────────────────────────────────────────┘

- Background: #E3F2FD
- Border-left: 4px #2196F3
- Icon: ℹ (blue #2196F3)
- Text: #0D47A1
- Padding: 16px
- Border radius: 4px
```

### Tables

#### Data Table
```
┌─────────────────────────────────────────────┐
│ Bill Date │ Amount │ Status │ Action       │
├─────────────────────────────────────────────┤
│ 2026-04-15│ 5000  │ ✓ PAID │ View Receipt│
│ 2026-05-15│ 3500  │ ⏳ PENDING │ Pay    │
│ 2026-06-15│ 4200  │ ⚠ OVERDUE │ Pay Now│
└─────────────────────────────────────────────┘

- Header background: #004D2E
- Header text: White
- Alternate row backgrounds: #F5F5F5, White
- Border: 1px #BDBDBD
- Padding: 16px (cells)
- Font size: 14px
- Hover row: #E8F5E9
- Sortable columns: Indicator arrow (▲▼) in header
- Status icons: Color-coded (✓ green, ⏳ yellow, ⚠ red)
```

### Badges & Tags

#### Status Badges
```
PAID          PENDING        OVERDUE       CANCELLED
┌──────┐     ┌──────┐     ┌──────┐     ┌──────┐
│ ✓    │     │ ⏳   │     │ ⚠    │     │ ✗    │
└──────┘     └──────┘     └──────┘     └──────┘

Success:   Background #E8F5E9, Text #004D2E, Icon #4CAF50
Pending:   Background #FFF8E1, Text #F57F17, Icon #FFC107
Overdue:   Background #FFEBEE, Text #C62828, Icon #F44336
Cancelled: Background #F5F5F5, Text #757575, Icon #BDBDBD

- Padding: 8px 12px
- Border radius: 20px (pill shape)
- Font size: 12px
- Font weight: 600
- Inline-block display
```

### Modals & Dialogs

#### Confirmation Modal
```
╔═════════════════════════════════╗
║  Confirm Payment               │
╠═════════════════════════════════╣
║                                 ║
║  Total Amount: ₱ 5,250.00       ║
║  Payment Method: GCash          ║
║                                 ║
║  Are you sure you want to pay?  ║
║                                 ║
╠═════════════════════════════════╣
║  [Cancel]              [Pay]    ║
╚═════════════════════════════════╝

- Backdrop: Black with 50% opacity
- Modal background: White
- Modal width: 400px (max 90% on mobile)
- Border radius: 8px
- Padding: 32px
- Box shadow: 0 8px 32px rgba(0,0,0,0.15)
- Title: H3 (20px)
- Content padding: 24px 0
- Buttons: Full width, stacked on mobile
- Button height: 40px
```

---

## 🎨 Page Layouts

### Login Page
```
┌─────────────────────────────────┐
│                                 │
│         [Logo]                  │
│    Majayjay Payment System      │
│                                 │
│   Email                         │
│   ┌─────────────────────┐      │
│   │                     │      │
│   └─────────────────────┘      │
│                                 │
│   Password                      │
│   ┌─────────────────────┐      │
│   │                     │      │
│   └─────────────────────┘      │
│   Forgot Password?              │
│                                 │
│   [  LOGIN  ]                   │
│   [ LOGIN WITH GOOGLE ]         │
│                                 │
│   No account? Register here     │
│                                 │
└─────────────────────────────────┘

- Background: White
- Form container: Centered, max-width 400px
- Colors: Primary green buttons, dark text
```

### Dashboard Page
```
┌─────────────────────────────────────────────┐
│ Navigation Bar                              │
├────────┬────────────────────────────────────┤
│        │  Dashboard                         │
│ Sidebar├────────────────────────────────────┤
│        │ ┌────────────┐  ┌────────────┐   │
│        │ │ KPI Card   │  │ KPI Card   │   │
│        │ └────────────┘  └────────────┘   │
│        │                                    │
│        │ ┌────────────────────────────┐   │
│        │ │  Chart / Graph             │   │
│        │ └────────────────────────────┘   │
│        │                                    │
│        │ ┌────────────────────────────┐   │
│        │ │  Transaction Table         │   │
│        │ └────────────────────────────┘   │
└────────┴────────────────────────────────────┘
```

### Payment Page
```
┌──────────────────────────────────┐
│ Bill Details                     │
├──────────────────────────────────┤
│ Payer: Juan Dela Cruz            │
│ Bill Reference: RPT_2024_001     │
│ Due Date: May 31, 2026           │
├──────────────────────────────────┤
│ Amount Breakdown:                │
│  Base Amount ....... P 5,000.00  │
│  Penalties ......... P   250.00  │
│  ─────────────────────────────── │
│  Total Due ......... P 5,250.00  │
├──────────────────────────────────┤
│ Payment Method:                  │
│ ○ GCash  ● Maya  ○ Bank Transfer│
├──────────────────────────────────┤
│     [QR Code Image]              │
│                                  │
│  Scan with your mobile wallet    │
│                                  │
│  or                              │
│                                  │
│    [  PROCEED TO PAYMENT  ]      │
└──────────────────────────────────┘
```

### Receipt Page
```
┌────────────────────────────────────┐
│     OFFICIAL RECEIPT               │
│  OR-2026-04-28-001                │
│────────────────────────────────────┤
│                                    │
│ Date: April 28, 2026              │
│ Time: 10:30 AM                    │
│                                    │
│ Payer: Juan Dela Cruz             │
│ Reference: RPT_2024_001           │
│                                    │
│────────────────────────────────────│
│                                    │
│ Real Property Tax ... P 5,000.00  │
│ Late Penalty ........ P   250.00  │
│ ────────────────────────────────  │
│ Total Paid ......... P 5,250.00  │
│                                    │
│ Payment Method: GCash             │
│                                    │
│────────────────────────────────────│
│           [QR Code]               │
│                                    │
│  [Download PDF]  [Print]  [Share] │
└────────────────────────────────────┘
```

---

## 📱 Responsive Design

### Breakpoints
```
Mobile:     320px - 640px
Tablet:     641px - 1024px
Desktop:   1025px - 1920px
Large:     1921px+
```

### Responsive Adjustments
- Mobile: Single column, full width, navigation drawer
- Tablet: 2-column grid, flexible spacing
- Desktop: Full multi-column layout
- Large: Max-width container (1400px), centered

### Mobile-First Approach
- Design for mobile first
- Progressive enhancement for larger screens
- Touch-friendly: Minimum 44px click targets
- Vertical scrolling optimized
- Landscape orientation supported

---

## 🎯 Accessibility (WCAG 2.1 AA Compliance)

### Color Contrast
- Text: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- UI components: Minimum 3:1 ratio

### Interactive Elements
- Minimum 44px × 44px touch target
- Focus indicators visible
- Keyboard navigation supported
- Screen reader friendly

### Typography
- Font size minimum 12px
- Line height minimum 1.5
- Letter spacing minimum 0.12em
- Not relying on color alone

---

## 🎬 Animations & Transitions

### Transition Effects
- Button hover: 200ms ease
- Modal open/close: 300ms ease-out
- Fade in/out: 200ms ease
- Slide animations: 300ms ease

### Loading States
- Spinner animation: Smooth rotation
- Skeleton loader: Pulse animation (1.5s)
- Progress bar: Linear animation

### Accessibility
- Respect `prefers-reduced-motion` setting
- Animations optional, not essential

---

## 🖨️ Print Styles

### Receipt Printing
- Black text on white background
- Minimal styling
- Full page width usage
- Large font for readability
- Remove navigation/buttons
- Optimize for thermal printer (80mm width)

### Report Printing
- Page breaks handled properly
- Headers/footers on each page
- Color printing supported
- Optimize for A4 paper size

---

## 🌙 Dark Mode (Future Enhancement)

### Dark Mode Colors
- Background: #121212
- Surface: #1E1E1E
- Primary Green: #66BB6A
- Text: #FFFFFF

---

## 📐 Component Grid

### 8px Grid System
- All components snap to 8px grid
- Padding/margin: Multiples of 8px (8, 16, 24, 32, etc.)
- Border radius: Multiples of 4px
- Font sizes: Not strictly enforced but aligned where possible

---

## 🎨 Brand Assets

### Logo Variations
- Full logo: Horizontal layout, 200px minimum width
- Icon only: Square format, 64px × 64px minimum
- Monochrome: For restricted backgrounds
- With tagline: "Majayjay Digital Payments"

### Color Codes for Design Tools

**Figma/Adobe XD Variables:**
```
Primary Green:    #00873E
Light Green:      #E8F5E9
Dark Green:       #004D2E
Accent Green:     #26A69A
Light Gray:       #F5F5F5
Medium Gray:      #BDBDBD
Dark Gray:        #424242
Success:          #4CAF50
Warning:          #FFC107
Error:            #F44336
Info:             #2196F3
```

---

## ✅ Design Checklist

- [ ] All elements use green color palette
- [ ] Consistent typography hierarchy
- [ ] Proper spacing (8px grid system)
- [ ] Accessible color contrast (4.5:1)
- [ ] Touch-friendly (44px minimum targets)
- [ ] Responsive on all breakpoints
- [ ] Consistent border radius
- [ ] Proper button states (hover, active, disabled)
- [ ] Loading states implemented
- [ ] Error states clearly marked
- [ ] Success states clearly marked
- [ ] Keyboard navigation supported
- [ ] Focus indicators visible
- [ ] Mobile menu implementation
- [ ] Print styles optimized

---

**Design Status**: Ready for Implementation  
**Last Updated**: April 28, 2026  
**Version**: 1.0
