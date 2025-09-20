# Weather App ⛅

A modern, responsive weather application with a sleek dark theme that provides real-time weather information using the OpenWeatherMap API.

## ✨ Features

- **Real-time Weather Data** - Current weather for any city worldwide
- **Dark Theme UI** - Modern design with smooth animations
- **Responsive Design** - Works on all devices
- **Smart Caching** - Reduces API calls and improves performance
- **Input Validation** - User-friendly error messages
- **Keyboard Shortcuts** - `Ctrl/Cmd + K` to focus search, `Escape` to clear
- **Search History** - Saves recent searches locally
- **Error Handling** - Graceful error handling with retry logic

## 🛠️ Technologies

- HTML5, CSS3, Vanilla JavaScript
- OpenWeatherMap API
- Modern CSS (Grid, Flexbox, Animations)

## 🚀 Quick Start

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/weather-app.git
   cd weather-app
   ```

2. **Get API Key**
   - Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   - Copy your free API key

3. **Add API Key**
   - Open `script.js`
   - Replace `YOUR_API_KEY` with your key:
   ```javascript
   this.API_KEY = "your_api_key_here";
   ```

4. **Run**
   - Open `index.html` in browser
   - Or use local server: `python -m http.server 8000`

## 📁 Structure

```
├── index.html    # Main HTML
├── styles.css    # Styles & animations
├── script.js     # App functionality
└── README.md     # This file
```

## 🎯 Usage

1. Enter city name
2. Click "Get Weather" or press Enter
3. View current weather info

## 🌟 Screenshots

<img width="1639" height="796" alt="Screenshot 2025-09-20 165552" src="https://github.com/user-attachments/assets/ece223fc-0f96-4546-8904-377fc10d71cc" />
<img width="1867" height="882" alt="Screenshot 2025-09-20 165533" src="https://github.com/user-attachments/assets/bc6c7e98-2e94-48c0-bbe2-664201fd4bf3" />


## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🚧 Future Features

- [ ] 5-day forecast
- [ ] Geolocation support
- [ ] Weather maps
- [ ] PWA support

---

⭐ **Star this repo if you found it helpful!** ⭐
