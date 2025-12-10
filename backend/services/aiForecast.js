// AI Forecasting Service using Exponential Smoothing
// Can be extended with TensorFlow.js for more advanced predictions

class AIForecastService {
  /**
   * Exponential Smoothing Forecast
   * Simple but effective forecasting method
   */
  exponentialSmoothing(data, alpha = 0.3) {
    if (data.length === 0) return 0;
    if (data.length === 1) return data[0];

    let forecast = data[0];
    for (let i = 1; i < data.length; i++) {
      forecast = alpha * data[i] + (1 - alpha) * forecast;
    }
    return Math.round(forecast);
  }

  /**
   * Moving Average Forecast
   */
  movingAverage(data, period = 3) {
    if (data.length === 0) return 0;
    if (data.length < period) {
      const sum = data.reduce((a, b) => a + b, 0);
      return Math.round(sum / data.length);
    }

    const recent = data.slice(-period);
    const sum = recent.reduce((a, b) => a + b, 0);
    return Math.round(sum / period);
  }

  /**
   * Forecast next month's sales for a product
   */
  async forecastProductSales(productId, historicalSales) {
    if (historicalSales.length === 0) {
      return {
        forecast: 0,
        confidence: 'low',
        method: 'no_data'
      };
    }

    // Use exponential smoothing for forecast
    const forecast = this.exponentialSmoothing(historicalSales);
    
    // Calculate confidence based on data variance
    const avg = historicalSales.reduce((a, b) => a + b, 0) / historicalSales.length;
    const variance = historicalSales.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / historicalSales.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avg;

    let confidence = 'medium';
    if (coefficientOfVariation < 0.2) confidence = 'high';
    else if (coefficientOfVariation > 0.5) confidence = 'low';

    return {
      forecast,
      confidence,
      method: 'exponential_smoothing',
      historicalAverage: Math.round(avg),
      recommendation: forecast > 0 ? `Expected to sell ${forecast} units next month` : 'No sales expected'
    };
  }

  /**
   * Forecast inventory needs
   */
  async forecastInventory(product, salesForecast, currentStock) {
    const leadTime = 7; // days (can be configured per product)
    const safetyStock = product.minThreshold || 10;
    
    const dailyForecast = salesForecast / 30; // Assuming monthly forecast
    const neededDuringLeadTime = Math.ceil(dailyForecast * leadTime);
    const recommendedStock = neededDuringLeadTime + safetyStock;
    const reorderQuantity = Math.max(0, recommendedStock - currentStock);

    return {
      currentStock,
      recommendedStock,
      reorderQuantity,
      daysUntilStockout: currentStock > 0 ? Math.floor(currentStock / dailyForecast) : 0,
      urgency: reorderQuantity > 0 ? (reorderQuantity > safetyStock * 2 ? 'high' : 'medium') : 'low'
    };
  }

  /**
   * Generate AI suggestions based on data analysis
   */
  generateSuggestions(products, salesData, forecasts) {
    const suggestions = [];

    // Low stock suggestions
    products.filter(p => p.lowStockAlert).forEach(product => {
      const forecast = forecasts.find(f => f.productId === product._id.toString());
      if (forecast && forecast.reorderQuantity > 0) {
        suggestions.push({
          type: 'restock',
          priority: 'high',
          message: `Reorder ${forecast.reorderQuantity} units of ${product.name}`,
          productId: product._id,
          action: 'restock'
        });
      }
    });

    // Top selling products - suggest promotion
    const topProducts = salesData.slice(0, 3);
    topProducts.forEach((product, index) => {
      suggestions.push({
        type: 'promotion',
        priority: 'medium',
        message: `Consider promoting ${product.productName} - it's a top seller`,
        productId: product.productId,
        action: 'promote'
      });
    });

    // Slow moving products
    const slowProducts = products.filter(p => {
      const sales = salesData.find(s => s.productId === p._id.toString());
      return !sales || sales.totalQuantity < 5;
    });

    if (slowProducts.length > 0) {
      suggestions.push({
        type: 'markdown',
        priority: 'low',
        message: `Consider discounts for ${slowProducts.length} slow-moving products`,
        action: 'review'
      });
    }

    return suggestions;
  }
}

module.exports = new AIForecastService();

