# 📊 Progress Hub

A modern, lightweight progress-tracking web app built with React, Vite, and Tailwind CSS. Progress Hub helps you plan weekly activities, track habits and streaks, manage daily and pending tasks, set goals, and keep a personal journal all in a single, fast, and responsive interface.

**Status:** Frontend-ready (Vite + Tailwind). Data is currently stored in browser `localStorage`. For multi-device sync and user accounts, see the Full-Stack Roadmap below.

**Live preview:** Use `npm run dev` and open the URL printed by Vite.

**Tech stack:**
- React 18
- Vite
- Tailwind CSS (PostCSS + Autoprefixer)
- Lucide React icons
- Progressive Web App (service worker + manifest)

**Repository:** https://github.com/NoorayFatima/Progress-Hub

## ✨ Features

- 📅 **Weekly Planner** — Track activities across the week with Done/Skip states
- 🎯 **Goal Tracking** — Set and monitor weekly, monthly, and yearly goals
- 🔥 **Habit Tracker** — Build streaks and track daily habits
- ✅ **Task Management** — Organize daily and pending tasks with priority levels
- 📖 **Journal** — Reflect and document your thoughts and experiences
- 💾 **Local Storage** — Data persists in browser (localStorage)
- 📱 **PWA Support** — Install as an app on your device; works offline
- 🎨 **Beautiful UI** — Professional two-color design with smooth animations
- 📊 **Dashboard** — Get an overview of your progress at a glance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/NoorayFatima/Progress-Hub.git
cd Progress-Hub

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser and navigate to the port shown in your terminal.

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Start server (same as dev)
npm start
```


## 🏗️ Project Structure

```
.
├── index.html              # HTML entry point
├── src/
│   ├── main.jsx           # React app entry
│   ├── main.css           # Tailwind CSS
│   └── ProgressPlannerApp.jsx  # Main React component (1100+ lines)
├── public/
│   ├── service-worker.js  # PWA offline support
│   ├── manifest.webmanifest  # PWA manifest
│   └── icons/             # App icons
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── dist/                  # Production build (generated)
```

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#92487A',      // Purple
      secondary: '#E49BA6',    // Pink
    },
  },
}
```

### Activities
Modify the default weekly activities in `src/ProgressPlannerApp.jsx`:

```javascript
const [weeklyActivities, setWeeklyActivities] = useState([
  'SM', 'Namaz', 'Quran', 'Book', 'Typing', 'Course Work'
]);
```

## 💾 Data Storage

Currently, all data is stored in **browser localStorage**:
- Activities and weekly data
- Goals (weekly, monthly, yearly)
- Habits and streaks
- Tasks and pending tasks
- Journal entries

**Note:** Data persists locally on each device but is not synced across devices. To share data between devices, use the browser's sync/backup features or consider deploying the full-stack version (see below).

## 🔄 Full-Stack Version (Coming Soon)

To convert this to a full-stack application with user accounts, data persistence, and multi-device sync:

1. **Backend**: Node + Express + Postgres
2. **Authentication**: JWT tokens or email-based auth
3. **Database**: User accounts, encrypted data storage
4. **Deployment**: Docker + Render, Railway, or DigitalOcean


## 🔐 Security Notes

- Currently frontend-only; no server-side security
- Passwords/sensitive data should NOT be stored in localStorage
- Use HTTPS when deploying
- For sensitive data, implement full-stack with proper backend authentication

## 📝 License

MIT License — feel free to use, modify, and distribute.

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📧 Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check existing issues first

## 🙏 Acknowledgments

- **React** — UI framework
- **Vite** — Build tool
- **Tailwind CSS** — Utility-first CSS framework
- **Lucide React** — Beautiful icon library
- Built with ❤️ by NoorayFatima

---

**Happy tracking! 🚀📊**
