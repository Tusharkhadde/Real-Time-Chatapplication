import { Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { Button } from '@components/ui/button';
import { 
  MessageCircle, 
  Users, 
  Shield, 
  Zap, 
  ArrowRight,
  Github,
  Twitter,
  Mail,
  CheckCircle,
  Sparkles
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: 'Real-time Messaging',
      description: 'Instant message delivery with WebSocket technology for seamless conversations.'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Group Chats',
      description: 'Create groups, add members, and collaborate with your team effortlessly.'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure & Private',
      description: 'Your conversations are protected with industry-standard security measures.'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Lightning Fast',
      description: 'Optimized for speed with modern technologies for the best experience.'
    }
  ];

  const highlights = [
    'Voice messages & file sharing',
    'Read receipts & typing indicators',
    'Emoji reactions & replies',
    'Dark mode support',
    'Mobile responsive design',
    'AI chatbot assistant'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary rounded-xl group-hover:scale-110 transition-transform">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ChatApp</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/chat">
                  Open Chat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">
                    Get Started
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Now with AI-powered features</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Connect with anyone,
            <br />
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              anywhere, anytime
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Experience seamless real-time messaging with a modern, beautiful interface. 
            Stay connected with friends, family, and colleagues.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/chat">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Go to Chat
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link to="/register">
                    Start Chatting Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <Link to="/login">
                    I have an account
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Users</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">1M+</div>
              <div className="text-sm text-muted-foreground mt-1">Messages Sent</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground mt-1">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to stay connected
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Packed with features to make your messaging experience seamless and enjoyable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-card rounded-2xl border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-3xl p-8 md:p-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Powerful features for modern communication
              </h2>
              <p className="text-muted-foreground mb-8">
                From voice messages to AI assistance, ChatApp has everything you need 
                for effective and enjoyable conversations.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {highlights.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              {/* Mock phone/chat preview */}
              <div className="bg-background rounded-3xl border shadow-2xl p-4 max-w-sm mx-auto">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-10 h-10 bg-primary/20 rounded-full" />
                  <div>
                    <div className="font-medium">John Doe</div>
                    <div className="text-xs text-green-500">Online</div>
                  </div>
                </div>
                <div className="py-4 space-y-3">
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md max-w-[80%]">
                      <p className="text-sm">Hey! How are you? 👋</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-br-md max-w-[80%]">
                      <p className="text-sm">I'm doing great! Thanks for asking 😊</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
                      <p className="text-sm">That's awesome! 🎉</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who are already enjoying ChatApp. 
            It's free to sign up and takes less than a minute.
          </p>
          <Button size="lg" asChild>
            <Link to="/register">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-xl">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold">ChatApp</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="mailto:hello@chatapp.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-8 pt-8 border-t">
            © {new Date().getFullYear()} ChatApp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;