// Enhanced Weather App JavaScript with Modern Best Practices

class WeatherApp {
  constructor() {
    // API Configuration
    this.API_KEY = "5f56d525d1619d0a2cd2eac4ce55588e"; // TODO: Move to environment variables
    this.BASE_URL = "https://api.openweathermap.org/data/2.5";
    this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

    // State management
    this.cache = new Map();
    this.requestController = null;

    // Initialize after DOM is loaded
    this.init();
  }

  // Initialize the application
  init() {
    this.bindElements();
    this.attachEventListeners();
    this.loadFromLocalStorage();
    this.setupKeyboardShortcuts();
  }

  // Bind DOM elements with proper error handling
  bindElements() {
    const elements = {
      cityInput: "city-input",
      getWeatherBtn: "get-weather-btn",
      weatherInfo: "weather-info",
      cityNameDisplay: "city-name",
      temperatureDisplay: "temperature",
      descriptionDisplay: "description",
      errorMessage: "error-message",
    };

    this.elements = {};

    for (const [key, id] of Object.entries(elements)) {
      this.elements[key] = document.getElementById(id);
      if (!this.elements[key]) {
        console.error(`Element with ID '${id}' not found`);
      }
    }
  }

  // Attach all event listeners
  attachEventListeners() {
    // Button click event
    this.elements.getWeatherBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleWeatherRequest();
    });

    // Enter key support
    this.elements.cityInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.handleWeatherRequest();
      }
    });

    // Input validation and suggestions
    this.elements.cityInput?.addEventListener(
      "input",
      this.debounce(this.handleInputChange.bind(this), 300)
    );

    // Clear input button (if you add one later)
    this.elements.cityInput?.addEventListener("focus", () => {
      this.clearError();
    });

    // Handle browser back/forward navigation
    window.addEventListener("popstate", (e) => {
      if (e.state?.city) {
        this.elements.cityInput.value = e.state.city;
        this.fetchWeatherData(e.state.city, false);
      }
    });

    // Handle app visibility change for cache management
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.refreshStaleData();
      }
    });
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        this.elements.cityInput?.focus();
      }

      // Escape to clear search
      if (e.key === "Escape") {
        this.elements.cityInput.value = "";
        this.clearError();
        this.elements.cityInput?.focus();
      }
    });
  }

  // Handle weather request with comprehensive validation
  async handleWeatherRequest() {
    const city = this.elements.cityInput?.value?.trim();

    if (!this.validateInput(city)) return;

    try {
      this.setLoadingState(true);
      await this.fetchWeatherData(city);
      this.saveToLocalStorage(city);
      this.updateBrowserHistory(city);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.setLoadingState(false);
    }
  }

  // Comprehensive input validation
  validateInput(city) {
    if (!city) {
      this.showError("Please enter a city name", "validation");
      this.elements.cityInput?.focus();
      return false;
    }

    if (city.length < 2) {
      this.showError("City name must be at least 2 characters", "validation");
      return false;
    }

    if (city.length > 100) {
      this.showError("City name is too long", "validation");
      return false;
    }

    // Basic sanitization
    if (!/^[a-zA-Z\s\-'.,]+$/.test(city)) {
      this.showError("City name contains invalid characters", "validation");
      return false;
    }

    return true;
  }

  // Enhanced fetch with caching, retry logic, and cancellation
  async fetchWeatherData(city, useCache = true) {
    const cacheKey = city.toLowerCase();

    // Check cache first
    if (useCache && this.isCacheValid(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      this.displayWeatherData(cachedData.data);
      return cachedData.data;
    }

    // Cancel previous request if still pending
    if (this.requestController) {
      this.requestController.abort();
    }

    this.requestController = new AbortController();

    const url = `${this.BASE_URL}/weather?q=${encodeURIComponent(
      city
    )}&units=metric&appid=${this.API_KEY}`;

    try {
      const response = await this.fetchWithRetry(url, {
        signal: this.requestController.signal,
        timeout: 10000, // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(await this.getErrorMessage(response));
      }

      const data = await response.json();

      // Validate API response structure
      if (!this.validateAPIResponse(data)) {
        throw new Error("Invalid weather data received");
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      this.displayWeatherData(data);
      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request cancelled");
        return;
      }
      throw error;
    }
  }

  // Fetch with retry logic and timeout
  async fetchWithRetry(url, options, maxRetries = 3) {
    const { timeout, ...fetchOptions } = options;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        if (attempt === maxRetries) throw error;

        // Exponential backoff: wait 2^attempt seconds
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  // Get user-friendly error messages
  async getErrorMessage(response) {
    try {
      const errorData = await response.json();

      switch (response.status) {
        case 404:
          return `City "${this.elements.cityInput?.value}" not found. Please check the spelling and try again.`;
        case 401:
          return "API key is invalid. Please contact support.";
        case 429:
          return "Too many requests. Please wait a moment and try again.";
        case 500:
          return "Weather service is temporarily unavailable. Please try again later.";
        default:
          return (
            errorData.message ||
            `Error: ${response.status} - ${response.statusText}`
          );
      }
    } catch {
      return `Network error: ${response.status} - ${response.statusText}`;
    }
  }

  // Validate API response structure
  validateAPIResponse(data) {
    const requiredFields = ["name", "main", "weather", "sys"];
    return (
      requiredFields.every((field) => data[field]) &&
      data.main.temp !== undefined &&
      data.weather[0]?.description &&
      Array.isArray(data.weather)
    );
  }

  // Enhanced display with better formatting and error handling
  displayWeatherData(data) {
    try {
      const { name, main, weather, sys, wind = {} } = data;

      // Format and display data with fallbacks
      this.elements.cityNameDisplay.textContent = `${name}${
        sys.country ? `, ${sys.country}` : ""
      }`;
      this.elements.temperatureDisplay.textContent = `${Math.round(
        main.temp
      )}°C`;
      this.elements.descriptionDisplay.textContent = this.capitalizeWords(
        weather[0].description
      );

      // Add additional weather info if elements exist
      this.updateAdditionalInfo({
        feelsLike: main.feels_like,
        humidity: main.humidity,
        pressure: main.pressure,
        windSpeed: wind.speed,
        visibility: data.visibility,
      });

      // Show weather info and hide error
      this.showWeatherInfo();
      this.clearError();

      // Add success animation
      this.elements.weatherInfo?.classList.add("weather-loaded");
      setTimeout(() => {
        this.elements.weatherInfo?.classList.remove("weather-loaded");
      }, 500);
    } catch (error) {
      console.error("Error displaying weather data:", error);
      this.showError("Error displaying weather information");
    }
  }

  // Update additional weather information
  updateAdditionalInfo(info) {
    const infoElements = {
      "feels-like": info.feelsLike ? `${Math.round(info.feelsLike)}°C` : "N/A",
      humidity: info.humidity ? `${info.humidity}%` : "N/A",
      pressure: info.pressure ? `${info.pressure} hPa` : "N/A",
      "wind-speed": info.windSpeed
        ? `${Math.round(info.windSpeed * 3.6)} km/h`
        : "N/A",
      visibility: info.visibility
        ? `${Math.round(info.visibility / 1000)} km`
        : "N/A",
    };

    Object.entries(infoElements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  // Enhanced error handling with categorization
  handleError(error) {
    console.error("Weather App Error:", error);

    let message = "An unexpected error occurred";
    let type = "error";

    if (error.message.includes("not found")) {
      type = "not-found";
    } else if (
      error.message.includes("network") ||
      error.message.includes("fetch")
    ) {
      message = "Network error. Please check your internet connection.";
      type = "network";
    } else if (error.message) {
      message = error.message;
    }

    this.showError(message, type);
  }

  // Improved error display with types
  showError(message, type = "error") {
    if (!this.elements.errorMessage) return;

    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.className = `error-message error-${type}`;
    this.elements.errorMessage.classList.remove("hidden");
    this.elements.weatherInfo?.classList.add("hidden");

    // Auto-hide validation errors
    if (type === "validation") {
      setTimeout(() => this.clearError(), 3000);
    }
  }

  // Clear error messages
  clearError() {
    this.elements.errorMessage?.classList.add("hidden");
  }

  // Show weather information
  showWeatherInfo() {
    this.elements.weatherInfo?.classList.remove("hidden");
  }

  // Enhanced loading state management
  setLoadingState(isLoading) {
    const btn = this.elements.getWeatherBtn;
    if (!btn) return;

    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span> Loading...';
      btn.classList.add("loading-state");
    } else {
      btn.disabled = false;
      btn.textContent = "Get Weather";
      btn.classList.remove("loading-state");
    }
  }

  // Cache management
  isCacheValid(key) {
    const cached = this.cache.get(key);
    return cached && Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  refreshStaleData() {
    const currentCity = this.elements.cityInput?.value?.trim();
    if (currentCity && !this.isCacheValid(currentCity.toLowerCase())) {
      this.fetchWeatherData(currentCity, false);
    }
  }

  clearCache() {
    this.cache.clear();
  }

  // Local storage management
  saveToLocalStorage(city) {
    try {
      const searches = JSON.parse(
        localStorage.getItem("weatherSearches") || "[]"
      );
      const updatedSearches = [
        city,
        ...searches.filter((s) => s !== city),
      ].slice(0, 5);
      localStorage.setItem("weatherSearches", JSON.stringify(updatedSearches));
    } catch (error) {
      console.warn("Could not save to localStorage:", error);
    }
  }

  loadFromLocalStorage() {
    try {
      const searches = JSON.parse(
        localStorage.getItem("weatherSearches") || "[]"
      );
      if (searches.length > 0) {
        // Could implement recent searches dropdown here
        console.log("Recent searches:", searches);
      }
    } catch (error) {
      console.warn("Could not load from localStorage:", error);
    }
  }

  // Browser history management
  updateBrowserHistory(city) {
    const url = new URL(window.location);
    url.searchParams.set("city", city);
    history.pushState({ city }, `Weather for ${city}`, url);
  }

  // Input change handler with debouncing
  handleInputChange(event) {
    const value = event.target.value.trim();

    // Clear error when user starts typing
    if (value) {
      this.clearError();
    }

    // Could add autocomplete suggestions here
    if (value.length >= 2) {
      // Future: Implement city suggestions
      console.log("Could show suggestions for:", value);
    }
  }

  // Utility functions
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  capitalizeWords(str) {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Public methods for external use
  searchCity(city) {
    this.elements.cityInput.value = city;
    this.handleWeatherRequest();
  }

  getCurrentWeather() {
    const cityName = this.elements.cityNameDisplay?.textContent;
    return cityName ? this.cache.get(cityName.toLowerCase())?.data : null;
  }

  // Cleanup method
  destroy() {
    if (this.requestController) {
      this.requestController.abort();
    }
    this.clearCache();
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Global error handling
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    event.preventDefault();
  });

  // Initialize weather app
  window.weatherApp = new WeatherApp();
});

// Service Worker registration for PWA capabilities (future enhancement)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // navigator.serviceWorker.register('/sw.js')
    //   .then(registration => console.log('SW registered'))
    //   .catch(error => console.log('SW registration failed'));
  });
}
