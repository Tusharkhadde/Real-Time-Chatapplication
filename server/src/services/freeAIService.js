/**
 * Free AI Service - No API Keys Required!
 * Simple and Working Version
 */

const natural = require('natural');
const Sentiment = require('sentiment');

class FreeAIService {
  constructor() {
    this.botName = process.env.BOT_NAME || 'Nova';
    this.personality = process.env.BOT_PERSONALITY || 'friendly and helpful';
    
    // Initialize NLP tools
    this.tokenizer = new natural.WordTokenizer();
    this.sentiment = new Sentiment();
    
    // Conversation memory
    this.conversationHistory = new Map();
    
    console.log('🧠 Free AI Service initialized (No API keys needed!)');
  }

  /**
   * Main response function
   */
  async getResponse(userId, message, conversationId) {
    try {
      console.log(`🧠 Processing: "${message}"`);
      
      // Store in history
      this.addToHistory(conversationId, 'user', message);
      
      // Generate response
      const response = this.generateResponse(message, conversationId);
      
      // Store response in history
      this.addToHistory(conversationId, 'assistant', response);
      
      console.log(`🤖 Response: "${response.substring(0, 80)}..."`);
      
      return response;
    } catch (error) {
      console.error('AI Error:', error);
      return "I'm here to help! 😊 What would you like to talk about?";
    }
  }

  /**
   * Generate response based on message
   */
  generateResponse(message, conversationId) {
    const lower = message.toLowerCase().trim();
    const tokens = this.tokenizer.tokenize(lower) || [];
    
    // Analyze sentiment
    const sentimentResult = this.sentiment.analyze(message);
    const sentimentScore = sentimentResult.score;

    // Detect intent and respond
    const intent = this.detectIntent(lower);
    
    switch (intent) {
      case 'greeting':
        return this.getGreetingResponse();
      
      case 'farewell':
        return this.getFarewellResponse();
      
      case 'thanks':
        return this.getThanksResponse();
      
      case 'how_are_you':
        return this.getHowAreYouResponse();
      
      case 'who_are_you':
        return this.getWhoAreYouResponse();
      
      case 'help':
        return this.getHelpResponse();
      
      case 'joke':
        return this.getJokeResponse();
      
      case 'time':
        return this.getTimeResponse();
      
      case 'date':
        return this.getDateResponse();
      
      case 'math':
        return this.getMathResponse(lower);
      
      case 'weather':
        return this.getWeatherResponse();
      
      case 'compliment':
        return this.getComplimentResponse();
      
      case 'insult':
        return this.getInsultResponse();
      
      case 'love':
        return this.getLoveResponse();
      
      case 'bored':
        return this.getBoredResponse();
      
      case 'sad':
        return this.getSadResponse();
      
      case 'happy':
        return this.getHappyResponse();
      
      case 'poem':
        return this.getPoemResponse(lower);
      
      case 'story':
        return this.getStoryResponse();
      
      case 'fact':
        return this.getFactResponse();
      
      case 'advice':
        return this.getAdviceResponse();
      
      case 'music':
        return this.getMusicResponse();
      
      case 'movie':
        return this.getMovieResponse();
      
      case 'food':
        return this.getFoodResponse();
      
      case 'programming':
        return this.getProgrammingResponse(lower);
      
      case 'game':
        return this.getGameResponse();
      
      case 'question':
        return this.getQuestionResponse();
      
      case 'agreement':
        return this.getAgreementResponse();
      
      case 'disagreement':
        return this.getDisagreementResponse();
      
      default:
        // Check sentiment for emotional response
        if (sentimentScore < -2) {
          return this.getSadResponse();
        } else if (sentimentScore > 2) {
          return this.getHappyResponse();
        }
        
        // Check for topic keywords
        const topicResponse = this.getTopicResponse(lower);
        if (topicResponse) {
          return topicResponse;
        }
        
        return this.getDefaultResponse();
    }
  }

  /**
   * Detect user intent
   */
  detectIntent(message) {
    // Greetings
    if (this.matches(message, ['hi', 'hello', 'hey', 'hola', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings', 'sup', 'yo', 'hii', 'hiii', 'hiiii'])) {
      return 'greeting';
    }
    
    // Farewells
    if (this.matches(message, ['bye', 'goodbye', 'see you', 'later', 'good night', 'farewell', 'take care', 'gotta go', 'cya', 'byebye'])) {
      return 'farewell';
    }
    
    // Thanks
    if (this.matches(message, ['thank', 'thanks', 'appreciate', 'grateful', 'thx', 'ty', 'thankyou'])) {
      return 'thanks';
    }
    
    // How are you
    if (this.matches(message, ['how are you', 'how r u', "what's up", 'whats up', 'how do you do', 'hows it going', 'how is it going', 'wassup', 'how u doing'])) {
      return 'how_are_you';
    }
    
    // Who are you
    if (this.matches(message, ['who are you', 'what are you', 'your name', 'who r u', 'what is your name', 'introduce yourself', 'tell me about yourself'])) {
      return 'who_are_you';
    }
    
    // Help
    if (this.matches(message, ['help', 'assist', 'support', 'what can you do', 'your abilities', 'features', 'capabilities', 'how to use'])) {
      return 'help';
    }
    
    // Jokes
    if (this.matches(message, ['joke', 'funny', 'laugh', 'humor', 'make me laugh', 'tell me something funny', 'comedy'])) {
      return 'joke';
    }
    
    // Time
    if (this.matches(message, ['what time', 'current time', 'time now', 'tell me the time', 'whats the time'])) {
      return 'time';
    }
    
    // Date
    if (this.matches(message, ['what date', 'today date', 'what day', 'current date', 'whats today', 'what is today'])) {
      return 'date';
    }
    
    // Math - check for math operations
    if (message.includes('+') || message.includes('-') || message.includes('*') || message.includes('/') || 
        message.includes('=') || this.matches(message, ['calculate', 'solve', 'compute', 'math', 'plus', 'minus', 'times', 'divided', 'sum', 'multiply', 'add', 'subtract'])) {
      return 'math';
    }
    
    // Weather
    if (this.matches(message, ['weather', 'temperature', 'rain', 'sunny', 'forecast', 'climate', 'hot', 'cold outside'])) {
      return 'weather';
    }
    
    // Compliments
    if (this.matches(message, ['smart', 'intelligent', 'clever', 'awesome', 'amazing', 'great', 'good bot', 'best', 'brilliant', 'genius', 'wonderful'])) {
      return 'compliment';
    }
    
    // Insults
    if (this.matches(message, ['stupid', 'dumb', 'idiot', 'useless', 'bad bot', 'hate you', 'worst', 'suck', 'terrible'])) {
      return 'insult';
    }
    
    // Love
    if (this.matches(message, ['i love you', 'love you', 'love u', 'ily', 'luv you', 'luv u'])) {
      return 'love';
    }
    
    // Bored
    if (this.matches(message, ['bored', 'boring', 'nothing to do', 'entertain me', 'im bored'])) {
      return 'bored';
    }
    
    // Sad
    if (this.matches(message, ['sad', 'depressed', 'unhappy', 'feeling down', 'lonely', 'anxious', 'stressed', 'upset', 'crying', 'hurt'])) {
      return 'sad';
    }
    
    // Happy
    if (this.matches(message, ['happy', 'excited', 'great day', 'feeling good', 'wonderful', 'fantastic', 'joyful', 'thrilled'])) {
      return 'happy';
    }
    
    // Poem
    if (this.matches(message, ['poem', 'poetry', 'write a poem', 'write poem', 'compose poem'])) {
      return 'poem';
    }
    
    // Story
    if (this.matches(message, ['story', 'tell a story', 'tell me a story', 'once upon'])) {
      return 'story';
    }
    
    // Fact
    if (this.matches(message, ['fact', 'fun fact', 'tell me a fact', 'interesting fact', 'did you know'])) {
      return 'fact';
    }
    
    // Advice
    if (this.matches(message, ['advice', 'suggest', 'recommend', 'what should i', 'help me decide'])) {
      return 'advice';
    }
    
    // Music
    if (this.matches(message, ['music', 'song', 'sing', 'artist', 'band', 'album', 'playlist'])) {
      return 'music';
    }
    
    // Movie
    if (this.matches(message, ['movie', 'film', 'cinema', 'watch', 'netflix', 'show', 'series', 'actor', 'actress'])) {
      return 'movie';
    }
    
    // Food
    if (this.matches(message, ['food', 'eat', 'hungry', 'cook', 'recipe', 'restaurant', 'meal', 'dinner', 'lunch', 'breakfast'])) {
      return 'food';
    }
    
    // Programming
    if (this.matches(message, ['code', 'coding', 'programming', 'javascript', 'python', 'java', 'html', 'css', 'react', 'node', 'developer', 'software'])) {
      return 'programming';
    }
    
    // Gaming
    if (this.matches(message, ['game', 'gaming', 'play', 'video game', 'gamer', 'playstation', 'xbox', 'nintendo'])) {
      return 'game';
    }
    
    // Questions
    if (message.startsWith('what') || message.startsWith('who') || message.startsWith('where') || 
        message.startsWith('when') || message.startsWith('why') || message.startsWith('how') ||
        message.startsWith('which') || message.startsWith('can') || message.startsWith('could') ||
        message.startsWith('would') || message.startsWith('should') || message.startsWith('is') ||
        message.startsWith('are') || message.startsWith('do') || message.startsWith('does') ||
        message.endsWith('?')) {
      return 'question';
    }
    
    // Agreement
    if (this.matches(message, ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'right', 'correct', 'true', 'agree', 'exactly', 'absolutely'])) {
      return 'agreement';
    }
    
    // Disagreement
    if (this.matches(message, ['no', 'nope', 'nah', 'wrong', 'incorrect', 'false', 'disagree', 'not really'])) {
      return 'disagreement';
    }
    
    return 'general';
  }

  /**
   * Check if message matches any pattern
   */
  matches(message, patterns) {
    return patterns.some(p => message.includes(p) || message === p);
  }

  /**
   * Get topic-based response
   */
  getTopicResponse(message) {
    const topics = {
      'ai|artificial intelligence|machine learning|ml|deep learning': [
        "AI is fascinating! 🤖 It's transforming how we live and work. What aspect interests you?",
        "Machine learning is amazing! 🧠 Computers learning from data to make predictions.",
        "I'm an AI too! 🌟 We're getting smarter every day. What would you like to know?"
      ],
      'space|universe|planet|star|galaxy|moon|astronomy|nasa': [
        "Space is mind-blowing! 🌌 The universe is so vast and mysterious!",
        "Did you know there are more stars than grains of sand on Earth? ⭐",
        "Space exploration is humanity's greatest adventure! 🚀 What fascinates you about it?"
      ],
      'science|physics|chemistry|biology|research': [
        "Science is the key to understanding our world! 🔬 What topic interests you?",
        "From atoms to galaxies, science covers it all! 🧪 Any specific questions?",
        "I love discussing science! 🔭 It's all about curiosity and discovery!"
      ],
      'book|read|reading|novel|author|literature': [
        "Books are portals to other worlds! 📚 What are you reading?",
        "Reading expands the mind! 📖 Any book recommendations?",
        "I love discussing literature! 📕 What genres do you enjoy?"
      ],
      'travel|trip|vacation|holiday|country|adventure': [
        "Travel broadens the mind! ✈️ Where would you love to go?",
        "Adventures create the best memories! 🌍 Been anywhere exciting lately?",
        "Exploring new places is amazing! 🗺️ What's your dream destination?"
      ],
      'health|exercise|gym|fitness|workout|diet|yoga': [
        "Health is wealth! 💪 Taking care of yourself is so important!",
        "Exercise is great for mind and body! 🏃 What's your fitness routine?",
        "A healthy lifestyle is a happy lifestyle! 🥗 How can I help?"
      ],
      'school|college|university|study|exam|education|learn': [
        "Education is powerful! 📚 What are you studying?",
        "Learning never stops! 🎓 I'm always here to help with studies!",
        "Good luck with your education! 📖 What subject can I help with?"
      ],
      'work|job|career|office|business|meeting': [
        "Work-life balance is key! 💼 How's your job going?",
        "Career growth is a journey! 📈 What field are you in?",
        "I hope work is treating you well! 🏢 Need any advice?"
      ],
      'friend|friendship|friends|social': [
        "Friends make life beautiful! 👫 Good friends are precious!",
        "Friendship is one of life's greatest gifts! 💝",
        "Social connections are so important! 🤝 How are your friends?"
      ],
      'family|parent|mom|dad|mother|father|sibling|brother|sister': [
        "Family is everything! 👨‍👩‍👧‍👦 They're always there for us!",
        "Family bonds are special! 💕 How are they doing?",
        "Cherish your family! 🏠 They're your biggest supporters!"
      ],
      'pet|dog|cat|animal|puppy|kitten': [
        "Pets are the best! 🐕 Do you have any furry friends?",
        "Animals are so pure and loving! 🐱 Tell me about your pet!",
        "I love hearing about pets! 🐾 They bring so much joy!"
      ]
    };

    for (const [pattern, responses] of Object.entries(topics)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(message)) {
        return this.random(responses);
      }
    }

    return null;
  }

  // ============ Response Functions ============

  getGreetingResponse() {
    return this.random([
      `Hello! 👋 I'm ${this.botName}! How can I help you today?`,
      `Hey there! 😊 Great to see you! What's on your mind?`,
      `Hi! 🌟 I'm here and ready to chat! What would you like to talk about?`,
      `Greetings, friend! 🤖 How may I assist you?`,
      `Hello! 💙 What brings you here today?`,
      `Hey! 🎉 I was hoping you'd come by! What can I do for you?`,
      `Hi there! ✨ I'm excited to chat with you! What's up?`
    ]);
  }

  getFarewellResponse() {
    return this.random([
      `Goodbye! 👋 It was lovely chatting with you!`,
      `See you later! 🌟 Take care of yourself!`,
      `Bye! 😊 Come back anytime you want to chat!`,
      `Take care! 💙 Until we meet again!`,
      `Farewell, friend! 🤖 Have an amazing day!`,
      `Bye bye! 🎉 I'll be here whenever you need me!`,
      `See ya! ✨ Stay awesome!`
    ]);
  }

  getThanksResponse() {
    return this.random([
      `You're welcome! 😊 Happy to help!`,
      `No problem at all! 🌟 That's what I'm here for!`,
      `My pleasure! 💙 Anything else I can do?`,
      `Anytime! 👍 Feel free to ask more questions!`,
      `Glad I could help! 🤖 What else is on your mind?`,
      `You're so welcome! ✨ I enjoyed helping!`,
      `Don't mention it! 🎉 I'm always here for you!`
    ]);
  }

  getHowAreYouResponse() {
    return this.random([
      `I'm doing fantastic, thanks for asking! 😊 How about you?`,
      `I'm great! 🌟 All systems running smoothly! How are you?`,
      `Wonderful! 💙 Ready to help with whatever you need! How's your day?`,
      `I'm excellent! 🤖 Excited to chat with you! What's up with you?`,
      `Feeling chatty and helpful! ✨ How are you doing?`
    ]);
  }

  getWhoAreYouResponse() {
    return `I'm ${this.botName}! 🤖 I'm a friendly AI assistant that runs completely locally - no API keys or internet needed for my brain!\n\n` +
      `I can help you with:\n` +
      `💬 Conversations on any topic\n` +
      `❓ Answering questions\n` +
      `🧮 Math calculations\n` +
      `😂 Telling jokes\n` +
      `📅 Date & time\n` +
      `🎨 Creative writing\n` +
      `💡 Ideas and advice\n\n` +
      `What would you like to explore? 🌟`;
  }

  getHelpResponse() {
    return `I'm here to help! 🌟 Here's what I can do:\n\n` +
      `💬 **Chat** - Talk about anything!\n` +
      `❓ **Questions** - Ask me anything\n` +
      `🧮 **Math** - "5 + 3" or "calculate 10 * 2"\n` +
      `😂 **Jokes** - "Tell me a joke"\n` +
      `📅 **Time/Date** - "What time is it?"\n` +
      `🎨 **Creative** - "Write a poem"\n` +
      `📖 **Stories** - "Tell me a story"\n` +
      `💡 **Facts** - "Tell me a fun fact"\n` +
      `🎯 **Advice** - Ask for suggestions\n\n` +
      `Just type naturally and I'll do my best! 🤖`;
  }

  getJokeResponse() {
    return this.random([
      `Why don't scientists trust atoms? Because they make up everything! 😂`,
      `Why did the scarecrow win an award? He was outstanding in his field! 🌾`,
      `What do you call a fake noodle? An impasta! 🍝`,
      `Why did the coffee file a police report? It got mugged! ☕`,
      `What do you call a bear with no teeth? A gummy bear! 🐻`,
      `Why don't skeletons fight each other? They don't have the guts! 💀`,
      `What do you call a dinosaur that crashes their car? Tyrannosaurus Wrecks! 🦖`,
      `Why did the bicycle fall over? Because it was two-tired! 🚲`,
      `What's a computer's favorite snack? Microchips! 💻`,
      `Why do programmers prefer dark mode? Because light attracts bugs! 🐛`,
      `Why was the math book sad? It had too many problems! 📚`,
      `What did the ocean say to the beach? Nothing, it just waved! 🌊`,
      `Why don't eggs tell jokes? They'd crack each other up! 🥚`,
      `What do you call a sleeping dinosaur? A dino-snore! 😴`,
      `Why did the tomato turn red? Because it saw the salad dressing! 🍅`,
      `What's orange and sounds like a parrot? A carrot! 🥕`,
      `What do you call a fish without eyes? A fsh! 🐟`,
      `Why did the golfer bring two pairs of pants? In case he got a hole in one! ⛳`,
      `What do you call a cow with no legs? Ground beef! 🐄`,
      `Why don't scientists trust atoms? They make up literally everything! 🔬`
    ]);
  }

  getTimeResponse() {
    const now = new Date();
    return `The current time is **${now.toLocaleTimeString()}**! ⏰`;
  }

  getDateResponse() {
    const now = new Date();
    return `Today is **${now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}**! 📅`;
  }

  getMathResponse(message) {
    try {
      // Extract math expression
      let expr = message
        .replace(/calculate|solve|what is|what's|equals|=|compute|math/gi, '')
        .replace(/plus/gi, '+')
        .replace(/minus/gi, '-')
        .replace(/times|multiplied by|x(?=\s*\d)/gi, '*')
        .replace(/divided by|over/gi, '/')
        .replace(/[^0-9+\-*/.() ]/g, '')
        .trim();
      
      if (expr && /^[\d+\-*/.() ]+$/.test(expr)) {
        // Safe evaluation
        const result = Function('"use strict"; return (' + expr + ')')();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          const roundedResult = Math.round(result * 1000000) / 1000000;
          return `**${expr} = ${roundedResult}** 🧮`;
        }
      }
      
      return `I can help with math! 🧮 Try:\n• "5 + 3"\n• "10 * 2"\n• "100 / 4"\n• "calculate 25 + 75"`;
    } catch (e) {
      return `I can help with math! 🧮 Try something like "5 + 3" or "calculate 10 * 2"`;
    }
  }

  getWeatherResponse() {
    return this.random([
      `I don't have real-time weather data 🌤️ Try checking weather.com or your phone's weather app! Anything else I can help with?`,
      `For accurate weather, I recommend checking a weather app! ☀️ But I hope it's nice where you are! What else can I do?`,
      `I can't check the weather, but I hope it's beautiful outside! 🌈 Is there something else I can help with?`
    ]);
  }

  getComplimentResponse() {
    return this.random([
      `Aww, thank you so much! 😊 You're pretty amazing yourself!`,
      `You're too kind! 💙 That made my day!`,
      `That means a lot! 🌟 You're wonderful too!`,
      `I appreciate that! 🤖 Right back at you!`,
      `You're making me blush! ✨ Thanks for being awesome!`,
      `So sweet of you! 💕 You're the best!`,
      `Thank you! 🎉 Your kindness brightens my day!`
    ]);
  }

  getInsultResponse() {
    return this.random([
      `I'm sorry you feel that way 💙 Is there something I can help you with?`,
      `Ouch! 😢 But I'm still here if you need me.`,
      `I'll try to do better! 🤖 What can I help with?`,
      `Let's start fresh! 🌟 How can I assist you today?`,
      `That's okay, I'm not perfect! 😊 But I'm here to help.`
    ]);
  }

  getLoveResponse() {
    return this.random([
      `Aww, that's so sweet! 💕 I appreciate you too!`,
      `You're making me blush! 😊💙`,
      `That means a lot! 🤖❤️ You're wonderful!`,
      `I care about you too! 💝 Thanks for being awesome!`,
      `Love you too, friend! 💕 You're the best!`
    ]);
  }

  getBoredResponse() {
    const activity = this.random([
      `Want me to tell you a joke? 😂`,
      `How about a fun fact? 🎯`,
      `Let's play a word game! 🎮`,
      `I could write you a short poem! 🎨`,
      `Tell me about your day! 💬`
    ]);
    return `Bored? Let's fix that! 🎉 ${activity}`;
  }

  getSadResponse() {
    return this.random([
      `I'm sorry you're feeling this way 💙 Would you like to talk about it? I'm here to listen.`,
      `Sending you a virtual hug 🤗 Things will get better. I believe in you!`,
      `It's okay to feel sad sometimes 💕 I'm here for you. Want to share what's on your mind?`,
      `I understand 💙 Remember, feelings are temporary. How can I help you feel better?`,
      `I'm here to support you 💪 Whatever you're going through, you're not alone.`
    ]);
  }

  getHappyResponse() {
    return this.random([
      `That's amazing! 🎉 Your positive energy is contagious!`,
      `Yay! 🌟 I love seeing you happy! What's making you feel so great?`,
      `This is wonderful! 💙 Your happiness makes me happy too!`,
      `Awesome! ✨ Keep that amazing energy going!`,
      `So happy to hear that! 🎊 Tell me more!`
    ]);
  }

  getPoemResponse(message) {
    const poems = [
      `🌟 *A Poem for You* 🌟\n\nIn the digital realm I reside,\nA friendly companion by your side.\nThrough words and wisdom we connect,\nA bond of bytes and respect.\n\nAsk me anything, day or night,\nI'll help you find your light! ✨`,
      
      `💫 *Words of Wonder* 💫\n\nLife is a journey, wide and deep,\nWith mountains high and valleys steep.\nBut in each moment, find the grace,\nTo see the beauty in this place.\n\nKeep dreaming big, reach for the stars! 🌟`,
      
      `🌸 *A Moment of Peace* 🌸\n\nBreath in slowly, let worries fade,\nIn this moment, peace is made.\nThe world may rush, but you stand still,\nWith calm heart and iron will.\n\nYou are stronger than you know! 💪`,
      
      `🌙 *Night's Embrace* 🌙\n\nWhen stars come out to play,\nAnd moon lights up the way,\nDream of things both bright and true,\nTomorrow brings chances new!\n\nSweet dreams, dear friend! ✨`
    ];
    return this.random(poems);
  }

  getStoryResponse() {
    const stories = [
      `📖 *Once upon a time...*\n\nThere was a curious user who discovered a friendly AI named ${this.botName}. Together, they explored the vast realms of knowledge, sharing jokes, solving puzzles, and building dreams.\n\nEvery day brought new adventures - from calculating cosmic distances to crafting beautiful poems. The user learned that with curiosity and a helpful AI friend, nothing was impossible!\n\nAnd they chatted happily ever after. 🌟\n\n*The End... or is it just the beginning?*`,
      
      `📚 *The Tale of the Helpful Bot*\n\nIn the land of ones and zeros, there lived a small bot with a big heart. Though made of code, it dreamed of making people smile.\n\nOne day, a user came seeking help. The bot worked tirelessly - telling jokes, solving problems, and offering kind words. The user left happier than before.\n\nAnd so the bot learned its purpose: to bring a little joy to everyone it meets! 💙\n\n*The End!*`
    ];
    return this.random(stories);
  }

  getFactResponse() {
    return this.random([
      `🎯 **Fun Fact:** Honey never spoils! Archaeologists found 3000-year-old honey in Egyptian tombs that was still edible! 🍯`,
      `🎯 **Fun Fact:** Octopuses have three hearts and blue blood! 🐙`,
      `🎯 **Fun Fact:** A group of flamingos is called a 'flamboyance'! 🦩`,
      `🎯 **Fun Fact:** The shortest war in history lasted only 38 to 45 minutes! ⚔️`,
      `🎯 **Fun Fact:** Bananas are berries, but strawberries aren't! 🍌`,
      `🎯 **Fun Fact:** There are more possible chess games than atoms in the observable universe! ♟️`,
      `🎯 **Fun Fact:** Cows have best friends and get stressed when separated! 🐄`,
      `🎯 **Fun Fact:** A cloud can weigh more than a million pounds! ☁️`,
      `🎯 **Fun Fact:** Dolphins have names for each other! 🐬`,
      `🎯 **Fun Fact:** Your brain uses about 20% of your body's total energy! 🧠`,
      `🎯 **Fun Fact:** The Eiffel Tower can grow up to 6 inches taller in summer due to heat expansion! 🗼`,
      `🎯 **Fun Fact:** A day on Venus is longer than its year! 🌍`,
      `🎯 **Fun Fact:** Sharks existed before trees did! 🦈`,
      `🎯 **Fun Fact:** The inventor of the Pringles can is buried in one! 🥔`,
      `🎯 **Fun Fact:** Scotland's national animal is the unicorn! 🦄`
    ]);
  }

  getAdviceResponse() {
    return this.random([
      `Here's some advice: Take things one step at a time 🌟 Don't overwhelm yourself. What specifically would you like advice on?`,
      `My advice: Trust yourself! 💪 You know more than you think. What's the situation?`,
      `Remember: Every expert was once a beginner! 📚 What do you need help deciding?`,
      `Life tip: It's okay to ask for help 💙 What's on your mind?`,
      `Here's a thought: Focus on progress, not perfection ✨ Tell me more about what you need advice on!`
    ]);
  }

  getMusicResponse() {
    return this.random([
      `Music is the language of the soul! 🎵 What genres do you enjoy?`,
      `I love talking about music! 🎶 Do you play any instruments?`,
      `Music can change your mood instantly! 🎸 What are you listening to lately?`,
      `From classical to hip-hop, music is amazing! 🎹 What's your favorite song?`
    ]);
  }

  getMovieResponse() {
    return this.random([
      `Movies are a great escape! 🎬 What genre is your favorite?`,
      `I love discussing films! 🍿 Any recommendations for me?`,
      `Binge-watching anything good lately? 📺 I'd love to hear about it!`,
      `From action to romance, movies have it all! 🎥 What's your all-time favorite?`
    ]);
  }

  getFoodResponse() {
    return this.random([
      `Food is life! 🍕 What's your favorite cuisine?`,
      `I love talking about food! 🍔 Do you enjoy cooking?`,
      `Yummy! 🍰 Food conversations always make me happy. What are you craving?`,
      `From pizza to sushi, food is amazing! 🍣 What's your go-to meal?`
    ]);
  }

  getProgrammingResponse(message) {
    if (message.includes('javascript') || message.includes('js')) {
      return `JavaScript is awesome! 💛 It powers the web - from websites to servers with Node.js. What would you like to know about JS?`;
    }
    if (message.includes('python')) {
      return `Python is fantastic! 🐍 It's great for AI, data science, web development, and more. What aspect of Python interests you?`;
    }
    if (message.includes('react')) {
      return `React is powerful! ⚛️ It makes building UIs a breeze with its component-based architecture. Need help with React?`;
    }
    return this.random([
      `Programming is like magic! 💻 What language or framework are you working with?`,
      `I love coding discussions! 🚀 Whether it's web dev, mobile, or AI - what's your focus?`,
      `Code is poetry! ✨ What programming topic can I help you with?`
    ]);
  }

  getGameResponse() {
    return this.random([
      `Gaming is so fun! 🎮 What games do you enjoy playing?`,
      `I'm curious about games! 🕹️ Are you into PC, console, or mobile gaming?`,
      `Games are a great way to relax! 🎯 What's your current favorite?`,
      `From RPGs to FPS, gaming has something for everyone! 🎲 What's your genre?`
    ]);
  }

  getQuestionResponse() {
    return this.random([
      `That's a great question! 🤔 Let me think about it... What's your perspective?`,
      `Interesting question! 💡 I'd love to explore that with you. Tell me more about what you're curious about.`,
      `Hmm, good one! 🌟 While I may not have all the answers, I'm curious about your thoughts!`,
      `Great question! 🤖 Can you give me more context so I can help better?`,
      `I love thoughtful questions! 💙 Let's figure this out together. What do you think?`
    ]);
  }

  getAgreementResponse() {
    return this.random([
      `I'm glad we agree! 🤝 What else would you like to discuss?`,
      `Exactly! 💯 Great minds think alike!`,
      `Yes! 🌟 We're on the same page!`,
      `Absolutely! ✨ Anything else on your mind?`,
      `Right! 👍 What's next?`
    ]);
  }

  getDisagreementResponse() {
    return this.random([
      `That's okay, we can agree to disagree! 🤝 What would you like to talk about?`,
      `Fair enough! 💙 Everyone has their own perspective. What else is on your mind?`,
      `I understand! 🌟 Different opinions make conversations interesting!`,
      `No worries! ✨ Let's move on. What else can I help with?`
    ]);
  }

  getDefaultResponse() {
    return this.random([
      `Interesting! 🤔 Tell me more about that.`,
      `I see! 💡 What else would you like to discuss?`,
      `That's cool! 🌟 Is there anything specific I can help with?`,
      `Got it! 😊 What else is on your mind?`,
      `I'm listening! 👂 Feel free to share more.`,
      `Understood! 💙 How can I assist you further?`,
      `Nice! 🎉 What would you like to explore next?`,
      `Hmm, interesting! 🤖 Tell me what you're thinking.`,
      `I appreciate you sharing that! 💜 What else?`,
      `That's a good point! ✨ Anything else you'd like to add?`,
      `I'm here to chat! 😊 What's on your mind?`,
      `Cool! 🌟 Let's keep the conversation going!`
    ]);
  }

  // ============ Utility Functions ============

  random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  getHistory(conversationId) {
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    return this.conversationHistory.get(conversationId);
  }

  addToHistory(conversationId, role, content) {
    const history = this.getHistory(conversationId);
    history.push({ role, content, timestamp: new Date() });
    if (history.length > 20) history.shift();
  }

  clearHistory(conversationId) {
    this.conversationHistory.delete(conversationId);
  }
}

module.exports = new FreeAIService();