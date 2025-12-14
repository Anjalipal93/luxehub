const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');

const router = express.Router();

// Enhanced rule-based chatbot responses for business automation project
const getBotResponse = (message, conversationHistory = []) => {
  const lowerMessage = message.toLowerCase().trim();

  // Greetings
  if (lowerMessage.match(/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/)) {
    return "Hello! I'm your AI project assistant for the Business Automation System. I can help you with any questions about your project, including code structure, features, setup, deployment, and technical implementation. What would you like to know?";
  }

  // Project Overview
  if (lowerMessage.match(/\b(project|system|application|business automation)\b/) && lowerMessage.match(/\b(what is|overview|about|tell me)\b/)) {
    return "This is a comprehensive Business Automation System built with React (frontend) and Node.js/Express (backend) with MongoDB. It includes:\n\n• Product & Inventory Management\n• Sales Tracking & Analytics\n• AI-Powered Forecasting\n• Multi-channel Customer Communication\n• Team Performance Monitoring\n• Real-time Notifications\n\nThe system uses modern technologies like Material-UI, Chart.js, Socket.io, and integrates with external services (email, WhatsApp via Twilio).";
  }

  // Technology Stack
  if (lowerMessage.match(/\b(tech|technology|stack|framework|built with|uses)\b/)) {
    return "Technology Stack:\n\nFrontend:\n• React.js with Material-UI\n• Axios for API calls\n• Socket.io for real-time features\n• React Router for navigation\n• Chart.js for analytics\n\nBackend:\n• Node.js with Express.js\n• MongoDB with Mongoose\n• JWT for authentication\n• Multer for file uploads\n• Nodemailer for emails\n• Twilio for WhatsApp\n\nDeployment:\n• Vercel for frontend\n• Railway/Heroku for backend";
  }

  // Setup/Installation
  if (lowerMessage.match(/\b(setup|install|run|start|deploy|get started)\b/)) {
    return "To set up the project:\n\n1. Clone the repository\n2. Install dependencies: `npm install` in both frontend and backend\n3. Set up environment variables in backend/.env\n4. Start MongoDB\n5. Run backend: `npm start` in backend folder\n6. Run frontend: `npm start` in frontend folder\n\nCheck SETUP_EMAIL_WHATSAPP.md and QUICKSTART.md for detailed instructions.";
  }

  // Features
  if (lowerMessage.match(/\b(feature|features|functionality|what can|capabilities)\b/)) {
    return "Key Features:\n\n📊 Dashboard - Business overview with charts\n📦 Products - Inventory management\n💰 Sales - Transaction tracking\n🤖 AI Forecast - Predictive analytics\n📧 Communication - Multi-channel messaging\n👥 Team Performance - User analytics\n🔔 Notifications - Real-time alerts\n🔐 Authentication - Secure login system\n\nAll features support both voice and text interaction!";
  }

  // Voice Features
  if (lowerMessage.match(/\b(voice|speech|microphone|talk|speak|audio)\b/)) {
    return "Voice Features:\n\n• Voice input using Web Speech API\n• Text-to-speech responses\n• Real-time speech recognition\n• Multi-language support\n• Hands-free operation\n\nClick the microphone button to speak, and the AI will respond both with voice and text. Make sure to allow microphone permissions in your browser.";
  }

  // API/Backend
  if (lowerMessage.match(/\b(api|backend|server|endpoint|route)\b/)) {
    return "Backend API Structure:\n\nAuthentication: /api/auth/*\nProducts: /api/products/*\nSales: /api/sales/*\nAI Forecast: /api/ai/*\nCommunication: /api/communication/*\nUsers: /api/users/*\n\nAll endpoints require JWT authentication. The server runs on port 5000 by default and uses MongoDB for data storage.";
  }

  // Database
  if (lowerMessage.match(/\b(database|mongodb|data|storage|model)\b/)) {
    return "Database Models:\n\n• User - Authentication & profiles\n• Product - Inventory items\n• Sale - Transactions\n• Message - Communication logs\n• Notification - System alerts\n• CustomerMessage - Customer interactions\n\nUses MongoDB with Mongoose ODM. All models include timestamps and proper validation.";
  }

  // AI Features
  if (lowerMessage.match(/\b(ai|forecast|prediction|analytics|machine learning)\b/)) {
    return "AI Features:\n\n• Sales forecasting using historical data\n• Inventory prediction algorithms\n• Reorder point recommendations\n• Trend analysis with Chart.js\n• OpenAI integration for intelligent responses\n• Automated business insights\n\nThe AI analyzes patterns in your sales data to predict future demand and suggest optimal inventory levels.";
  }

  // Communication
  if (lowerMessage.match(/\b(email|whatsapp|message|contact|customer|send|communication)\b/)) {
    return "Communication System:\n\n• Email integration via SMTP/OAuth2\n• WhatsApp via Twilio API\n• Voice chatbot with speech recognition\n• Group messaging capabilities\n• Customer database integration\n• Message history and analytics\n\nCurrently configured for AI voice chatbot only - email and WhatsApp features are available but require additional setup.";
  }

  // Products
  if (lowerMessage.match(/\b(product|products|inventory|stock|items)\b/)) {
    return "Product Management:\n\n• Add/edit/delete products\n• Stock level tracking\n• Category organization\n• Price management\n• Low stock alerts\n• QR code generation\n• Image upload support\n\nEach product tracks quantity, minimum threshold, and generates automatic reorder alerts.";
  }

  // Sales
  if (lowerMessage.match(/\b(sale|sales|revenue|income|profit|transaction)\b/)) {
    return "Sales Management:\n\n• Record new transactions\n• Customer information tracking\n• Revenue analytics\n• Sales history\n• Product performance\n• Date range filtering\n• Export capabilities\n\nAutomatically updates inventory when sales are recorded.";
  }

  // Help
  if (lowerMessage.match(/\b(help|how|what can you do|assist|support)\b/)) {
    return "I can help you with:\n\n🛠️ Technical questions about the codebase\n📋 Feature explanations and usage\n⚙️ Setup and deployment guidance\n🐛 Troubleshooting and debugging\n💡 Project architecture and design\n🎯 Best practices and recommendations\n\nAsk me anything about your business automation project!";
  }

  // Thank you
  if (lowerMessage.match(/\b(thank|thanks|appreciate)\b/)) {
    return "You're welcome! I'm here to help with any questions about your business automation project. Feel free to ask about code, features, setup, or anything else!";
  }

  // Goodbye
  if (lowerMessage.match(/\b(bye|goodbye|see you|exit|quit)\b/)) {
    return "Goodbye! Remember, I'm always here to help with your business automation project. Have a great day!";
  }

  // Code/File Structure
  if (lowerMessage.match(/\b(code|file|structure|folder|directory|component)\b/)) {
    return "Project Structure:\n\nFrontend (React):\n• src/components/ - Reusable components\n• src/pages/ - Main application pages\n• src/context/ - React context providers\n• src/services/ - API service functions\n\nBackend (Node.js):\n• routes/ - API endpoint handlers\n• models/ - MongoDB schemas\n• middleware/ - Authentication & uploads\n• services/ - External integrations\n\nThe architecture follows modern best practices with separation of concerns.";
  }

  // Default response
  return "I understand you're asking about your business automation project. I can help with:\n\n• Technical questions about the codebase\n• Feature explanations and usage\n• Setup and deployment guidance\n• Project architecture\n• Troubleshooting\n\nCould you be more specific? For example: 'How do I set up the project?', 'What technologies are used?', or 'How does the AI forecasting work?'";
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
router.post('/chatbot', [
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
                content: 'You are a helpful AI assistant for a Business Automation System project. Help users with technical questions about the codebase, features, setup, deployment, and implementation details. The system is built with React frontend, Node.js/Express backend, MongoDB database, and includes features like product management, sales tracking, AI forecasting, voice chat, and multi-channel communication. Provide detailed, accurate technical information and be friendly and helpful.'
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

