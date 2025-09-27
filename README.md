# 🎨 Halora Admin Dashboard

A comprehensive, modern admin dashboard for managing Halora cosmetics e-commerce platform. Built with Next.js 15, TypeScript, and Firebase, featuring real-time data synchronization, advanced inventory management, and beautiful UI components.

![Next.js](https://img.shields.io/badge/Next.js-15.4.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12.0.0-orange?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🔐 Authentication & Authorization

- **Firebase Authentication** with email/password and Google OAuth
- **Role-based access control** (Admin/User)
- **Protected routes** with middleware
- **Session management** with secure cookies

### 📦 Product Management

- **Multi-variant products** with individual pricing
- **Media management** (images/videos) with Cloudinary integration
- **Category organization** with hierarchical structure
- **Brand management** with logo support
- **Real-time inventory tracking**

### 📊 Dashboard & Analytics

- **Interactive revenue charts** with Recharts
- **Real-time order monitoring**
- **Sales analytics** and reporting
- **User activity tracking**
- **Performance metrics**

### 🛒 Order Management

- **Order processing** workflow
- **Status tracking** and updates
- **Customer information** management
- **Order history** and analytics

### 🎟️ Voucher System

- **Discount vouchers** (percentage/fixed amount)
- **Shipping vouchers** management
- **Usage tracking** and limits
- **Expiration management**

### 📱 User Interface

- **Responsive design** for all devices
- **Dark/Light theme** support
- **Modern UI components** with Radix UI
- **Drag & drop** functionality
- **Real-time notifications**

## 🚀 Tech Stack

### Frontend

- **Next.js 15.4.2** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.0** - Type safety
- **Tailwind CSS 4.0** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization

### Backend & Database

- **Firebase Realtime Database** - Real-time data sync
- **Firebase Authentication** - User management
- **Cloudinary** - Media storage and optimization

### UI Components

- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Tabler Icons** - Additional icons
- **Sonner** - Toast notifications
- **Vaul** - Drawer components

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Turbopack** - Fast development builds

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── signup/
├── components/            # Reusable components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication components
│   ├── inventory/        # Inventory management
│   ├── products/         # Product components
│   └── ui/               # Base UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── services/             # Business logic services
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Firebase project
- Cloudinary account

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd admin-halora
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:

   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Admin Configuration
   NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com

   # Cloudinary Configuration
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
   NEXT_PUBLIC_CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Firebase Setup**

   - Create a Firebase project
   - Enable Authentication (Email/Password and Google)
   - Create a Realtime Database
   - Configure security rules
   - Add your domain to authorized domains

5. **Cloudinary Setup**
   - Create a Cloudinary account
   - Get your cloud name, API key, and API secret
   - Configure upload presets if needed

## 🚀 Development

### Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🏗️ Build & Deployment

### Production Build

```bash
npm run build
npm run start
```

### Deploy to Vercel

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Deploy to Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**
- **AWS Amplify**
- **Railway**
- **DigitalOcean App Platform**

## 📊 Key Features Deep Dive

### 🔄 Real-time Synchronization

- **Live inventory updates** across all devices
- **Order status changes** in real-time
- **Revenue tracking** with instant updates
- **User activity monitoring**

### 📦 Advanced Inventory Management

- **Multi-variant products** with individual stock tracking
- **Supplier management** and cost tracking
- **Stock alerts** and low inventory warnings
- **Bulk operations** for efficiency

### 📈 Analytics & Reporting

- **Revenue charts** with interactive filtering
- **Sales performance** metrics
- **User engagement** statistics
- **Product performance** analysis

### 🎨 Modern UI/UX

- **Responsive design** for all screen sizes
- **Accessible components** following WCAG guidelines
- **Smooth animations** and transitions
- **Intuitive navigation** with sidebar

## 🔧 Configuration

### Firebase Security Rules

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "inventory": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    }
  }
}
```

### Cloudinary Upload Presets

Configure upload presets for different media types:

- **Product images**: Auto-optimization, format conversion
- **Brand logos**: Consistent sizing and quality
- **User avatars**: Profile picture optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

- [ ] **Mobile app** integration
- [ ] **Advanced analytics** with custom dashboards
- [ ] **Multi-language** support
- [ ] **API documentation** with Swagger
- [ ] **Automated testing** suite
- [ ] **Performance monitoring** integration

---

**Built with ❤️ for Halora Cosmetics**
