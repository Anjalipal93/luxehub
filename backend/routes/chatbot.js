const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Simple rule-based chatbot responses
const getBotResponse = (message, conversationHistory = []) => {
  const lowerMessage = message.toLowerCase().trim();

  // Greetings
  if (lowerMessage.match(/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/)) {
    return "Hello! I'm your AI business assistant. How can I help you today? I can help with products, sales, inventory, or general questions about the business.";
  }

  // Products
  if (lowerMessage.match(/\b(product|products|inventory|stock|items)\b/)) {
    return "I can help you with product information! You can check the Products page to see all items, add new products, or check stock levels. Would you like to know about a specific product?";
  }

  // Sales
  if (lowerMessage.match(/\b(sale|sales|revenue|income|profit|transaction)\b/)) {
    return "I can help with sales information! Check the Sales page to view all transactions, record new sales, or see revenue statistics. The Dashboard also shows sales trends and analytics.";
  }

  // Inventory/Low Stock
  if (lowerMessage.match(/\b(low stock|out of stock|restock|reorder|inventory low)\b/)) {
    return "I can help you check inventory levels! The system automatically alerts you when products are running low. Check the Products page or Dashboard for low stock alerts. You can also use the AI Forecast feature to predict when you'll need to reorder.";
  }

  // AI/Forecast
  if (lowerMessage.match(/\b(forecast|prediction|ai|predict|future sales|analytics)\b/)) {
    return "Our AI forecasting system can predict future sales and inventory needs! Visit the AI Forecast page to see predictions for each product, get reorder recommendations, and view AI-powered business suggestions.";
  }

  // Communication
  if (lowerMessage.match(/\b(email|whatsapp|message|contact|customer|send)\b/)) {
    return "You can send messages to customers through multiple channels! Use the Communication page to send emails or WhatsApp messages. You can even send group messages to multiple customers at once!";
  }

  // Help
  if (lowerMessage.match(/\b(help|how|what can you do|features|capabilities)\b/)) {
    return "I can help you with:\n• Product and inventory management\n• Sales tracking and analytics\n• AI-powered forecasting\n• Customer communication (email, WhatsApp)\n• Business insights and recommendations\n\nJust ask me about any of these topics!";
  }

  // Thank you
  if (lowerMessage.match(/\b(thank|thanks|appreciate)\b/)) {
    return "You're welcome! Is there anything else I can help you with?";
  }

  // Goodbye
  if (lowerMessage.match(/\b(bye|goodbye|see you|exit|quit)\b/)) {
    return "Goodbye! Feel free to come back anytime if you need assistance. Have a great day!";
  }

  // Questions about the system
  if (lowerMessage.match(/\b(what is|what are|explain|tell me about)\b/)) {
    if (lowerMessage.includes('dashboard')) {
      return "The Dashboard shows you an overview of your business: total revenue, sales statistics, product counts, low stock alerts, and interactive charts. It's your command center!";
    }
    if (lowerMessage.includes('ai forecast')) {
      return "AI Forecast uses machine learning to predict future sales and inventory needs. It analyzes your sales history and suggests when to reorder products, helping you make data-driven decisions.";
    }
    if (lowerMessage.includes('communication')) {
      return "The Communication module lets you send messages to customers via email, WhatsApp, or web chat. You can send to individual customers or groups, making it easy to keep in touch with your customer base.";
    }
  }

  // Default response - try to be helpful
  return "I understand you're asking about: \"" + message + "\". I can help you with:\n• Product and inventory management\n• Sales and revenue tracking\n• AI forecasting and predictions\n• Customer communication\n• Business analytics\n\nCould you be more specific about what you need help with?";
};

// Enhanced response with context awareness
const getContextualResponse = (message, conversationHistory) => {
  // If user is asking follow-up questions, try to maintain context
  if (conversationHistory.length > 0) {
    const lastUserMessage = conversationHistory
      .filter(m => m.role === 'user')
      .slice(-1)[0]?.content?.toLowerCase() || '';

    // If previous conversation was about products
    if (lastUserMessage.includes('product')) {
      if (message.toLowerCase().match(/\b(add|create|new)\b/)) {
        return "To add a new product, go to the Products page and click 'Add Product'. Fill in the product details like name, category, price, quantity, and minimum threshold. The system will automatically alert you when stock runs low!";
      }
      if (message.toLowerCase().match(/\b(edit|update|change|modify)\b/)) {
        return "To edit a product, go to the Products page, find the product you want to edit, and click the edit icon. You can update any product information there.";
      }
    }

    // If previous conversation was about sales
    if (lastUserMessage.includes('sale')) {
      if (message.toLowerCase().match(/\b(record|add|create|new)\b/)) {
        return "To record a new sale, go to the Sales page and click 'New Sale'. Select the products, enter quantities, and add customer information. The system will automatically update inventory!";
      }
      if (message.toLowerCase().match(/\b(view|see|check|show)\b/)) {
        return "You can view all sales on the Sales page. The Dashboard also shows sales statistics, revenue charts, and top-selling products.";
      }
    }
  }

  return getBotResponse(message, conversationHistory);
};

// @route   POST /api/communication/chatbot
// @desc    Chat with AI assistant
// @access  Private
router.post('/chatbot', auth, [
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, conversationHistory = [] } = req.body;

    // Check if OpenAI API is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        // Use OpenAI API for more intelligent responses
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful AI assistant for a business automation system. Help users with products, sales, inventory, forecasting, and customer communication. Be concise and friendly.'
              },
              ...conversationHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
              })),
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 150,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return res.json({
          response: response.data.choices[0].message.content,
          source: 'openai'
        });
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        // Fall back to rule-based if OpenAI fails
      }
    }

    // Use rule-based chatbot as fallback or default
    const response = getContextualResponse(message, conversationHistory);

    res.json({
      response,
      source: 'rule-based'
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

