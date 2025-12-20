// Simple chatbot without external API - uses pattern matching and predefined responses

// In-memory storage for conversation history (use database in production)
const conversationHistory = new Map();

const greetings = [
  "Hello! How can I help you today?",
  "Hi there! What can I do for you?",
  "Hey! I'm here to help. What do you need?",
  "Greetings! How may I assist you?"
];

const farewells = [
  "Goodbye! Have a great day!",
  "See you later! Take care!",
  "Bye! Feel free to come back anytime!",
  "Until next time! Stay awesome!"
];

const helpResponses = [
  "I can help you with various things! Try asking me about:\n- The weather\n- Jokes\n- Facts\n- Time\n- Calculations\n- Or just chat with me!",
  "Here's what I can do:\n• Answer questions\n• Tell jokes\n• Share interesting facts\n• Help with basic math\n• Have a friendly conversation"
];

const jokes = [
  "Why don't scientists trust atoms? Because they make up everything! 😄",
  "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
  "I told my wife she was drawing her eyebrows too high. She looked surprised! 😮",
  "Why don't eggs tell jokes? They'd crack each other up! 🥚",
  "What do you call a fake noodle? An impasta! 🍝",
  "Why did the bicycle fall over? Because it was two-tired! 🚲",
  "What do you call a bear with no teeth? A gummy bear! 🐻",
  "Why can't you give Elsa a balloon? Because she will let it go! ❄️"
];

const facts = [
  "Did you know? Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible! 🍯",
  "Fun fact: Octopuses have three hearts and blue blood! 🐙",
  "Interesting: A day on Venus is longer than a year on Venus! 🌟",
  "Did you know? Bananas are berries, but strawberries aren't! 🍌",
  "Amazing fact: The shortest war in history lasted only 38-45 minutes! ⚔️",
  "Cool fact: A group of flamingos is called a 'flamboyance'! 🦩",
  "Did you know? The inventor of the Pringles can is buried in one! 🥔"
];

const motivationalQuotes = [
  "Believe you can and you're halfway there! 💪",
  "The only way to do great work is to love what you do. - Steve Jobs ✨",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. 🌟",
  "The future belongs to those who believe in the beauty of their dreams. 🚀",
  "Don't watch the clock; do what it does. Keep going! ⏰"
];

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

const patterns = [
  {
    patterns: [/^(hi|hello|hey|greetings|howdy)/i],
    handler: () => getRandomItem(greetings)
  },
  {
    patterns: [/^(bye|goodbye|see you|farewell|later)/i],
    handler: () => getRandomItem(farewells)
  },
  {
    patterns: [/(help|what can you do|capabilities)/i],
    handler: () => getRandomItem(helpResponses)
  },
  {
    patterns: [/(joke|funny|laugh|humor)/i],
    handler: () => getRandomItem(jokes)
  },
  {
    patterns: [/(fact|interesting|did you know|tell me something)/i],
    handler: () => getRandomItem(facts)
  },
  {
    patterns: [/(motivat|inspir|encourage|quote)/i],
    handler: () => getRandomItem(motivationalQuotes)
  },
  {
    patterns: [/(time|what time|current time)/i],
    handler: () => `The current time is ${new Date().toLocaleTimeString()}. ⏰`
  },
  {
    patterns: [/(date|what day|today)/i],
    handler: () => `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. 📅`
  },
  {
    patterns: [/how are you/i],
    handler: () => "I'm doing great, thanks for asking! How about you? 😊"
  },
  {
    patterns: [/(thank|thanks|appreciate)/i],
    handler: () => "You're welcome! Happy to help! 😊"
  },
  {
    patterns: [/(who are you|what are you|your name)/i],
    handler: () => "I'm a friendly chatbot assistant! I'm here to help you with questions, tell jokes, share facts, and have a nice conversation. 🤖"
  },
  {
    patterns: [/weather/i],
    handler: () => "I'm sorry, I don't have access to real-time weather data. You can check weather.com or your local weather app for accurate forecasts! 🌤️"
  },
  {
    patterns: [/(calculate|math|\d+\s*[\+\-\*\/]\s*\d+)/i],
    handler: (message) => {
      try {
        const mathMatch = message.match(/(\d+\.?\d*)\s*([\+\-\*\/])\s*(\d+\.?\d*)/);
        if (mathMatch) {
          const [, num1, operator, num2] = mathMatch;
          let result;
          switch (operator) {
            case '+': result = parseFloat(num1) + parseFloat(num2); break;
            case '-': result = parseFloat(num1) - parseFloat(num2); break;
            case '*': result = parseFloat(num1) * parseFloat(num2); break;
            case '/': 
              if (parseFloat(num2) === 0) return "Cannot divide by zero! 🚫";
              result = parseFloat(num1) / parseFloat(num2); 
              break;
          }
          return `${num1} ${operator} ${num2} = ${result} 🔢`;
        }
        return "Please provide a calculation in the format: number operator number (e.g., 5 + 3)";
      } catch {
        return "I couldn't calculate that. Please try again with a simpler expression.";
      }
    }
  },
  {
    patterns: [/(love|like you)/i],
    handler: () => "Aww, that's sweet! I appreciate our conversations too! 💝"
  },
  {
    patterns: [/(sad|depressed|unhappy|feeling down)/i],
    handler: () => "I'm sorry to hear you're feeling down. Remember, tough times don't last, but tough people do! Would you like to hear a joke to cheer you up? 🤗"
  },
  {
    patterns: [/(bored|boring)/i],
    handler: () => "Bored? Let me help! I can tell you a joke, share an interesting fact, or we can just chat! What would you prefer? 🎭"
  }
];

const defaultResponses = [
  "That's interesting! Tell me more about it. 🤔",
  "I see! Is there anything specific you'd like to know? 💭",
  "Hmm, I'm not sure I understand. Could you rephrase that? 🤷",
  "That's a good point! What else is on your mind? 💡",
  "Interesting! I'm here if you want to chat more about it. 😊",
  "I appreciate you sharing that with me! Anything else? 🙏"
];

class ChatbotService {
  getResponse(message, userId) {
    // Store message in history
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }
    
    const history = conversationHistory.get(userId);
    history.push({ role: 'user', content: message, timestamp: new Date() });
    
    // Keep only last 50 messages
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    // Find matching pattern
    for (const pattern of patterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(message)) {
          const response = pattern.handler(message);
          history.push({ role: 'bot', content: response, timestamp: new Date() });
          return response;
        }
      }
    }

    // Default response
    const response = getRandomItem(defaultResponses);
    history.push({ role: 'bot', content: response, timestamp: new Date() });
    return response;
  }

  getHistory(userId) {
    return conversationHistory.get(userId) || [];
  }

  clearHistory(userId) {
    conversationHistory.delete(userId);
  }

  getCapabilities() {
    return {
      features: [
        'Greetings and farewells',
        'Tell jokes',
        'Share interesting facts',
        'Motivational quotes',
        'Current time and date',
        'Basic math calculations',
        'General conversation'
      ],
      examples: [
        'Tell me a joke',
        'What time is it?',
        'Share an interesting fact',
        'Calculate 25 + 17',
        'Give me some motivation'
      ]
    };
  }
}

module.exports = new ChatbotService();