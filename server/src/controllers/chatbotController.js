const chatbotService = require('../services/chatbotService');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc    Send message to chatbot
// @route   POST /api/chatbot/message
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const response = await chatbotService.getResponse(message, req.user._id);

    res.status(200).json({
      success: true,
      data: {
        userMessage: message,
        botResponse: response
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chatbot response'
    });
  }
};

// @desc    Get chatbot conversation history
// @route   GET /api/chatbot/history
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const history = await chatbotService.getHistory(req.user._id);

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get chatbot history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history'
    });
  }
};

// @desc    Clear chatbot conversation history
// @route   DELETE /api/chatbot/history
// @access  Private
exports.clearHistory = async (req, res) => {
  try {
    await chatbotService.clearHistory(req.user._id);

    res.status(200).json({
      success: true,
      message: 'History cleared'
    });
  } catch (error) {
    console.error('Clear chatbot history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear history'
    });
  }
};

// @desc    Get chatbot capabilities
// @route   GET /api/chatbot/capabilities
// @access  Private
exports.getCapabilities = async (req, res) => {
  try {
    const capabilities = chatbotService.getCapabilities();

    res.status(200).json({
      success: true,
      data: capabilities
    });
  } catch (error) {
    console.error('Get capabilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get capabilities'
    });
  }
};