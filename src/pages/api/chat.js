import Groq from 'groq-sdk';

// Initialize Groq with the API key from environment variables
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { message } = req.body;
      const trimmedMessage = message.trim().toLowerCase();
      const basicGreetings = ["hi", "hello", "hey"];
      const sportsKeywords = ['sports', 'team', 'player', 'game', 'match', 'tournament', 'news', 'update'];

      // Check if the message is a basic greeting
      if (basicGreetings.includes(trimmedMessage)) {
        res.status(200).json({ sender: 'Bot', text: "Hello! How can I assist you with sports news today?" });
        return;
      }

      // Check if the message contains direct sports-related keywords
      const isSportsRelated = sportsKeywords.some(keyword => trimmedMessage.includes(keyword));

      // If no direct keywords, use Groq API to verify if the input is potentially sports-related
      let isPotentiallySportsRelated = false;
      if (!isSportsRelated) {
        const verificationResponse = await groq.chat.completions.create({
          messages: [{ role: 'user', content: `${message} Is it related to 'sports', 'team', 'player', 'game', 'match', 'tournament', 'news', 'update'? Reply with 'yes' or 'no'.` }],
          model: 'llama3-8b-8192',
        });
        const verificationText = verificationResponse.choices[0]?.message?.content.toLowerCase().trim() || "";
        isPotentiallySportsRelated = verificationText.includes("yes");
      }

      // Respond appropriately based on the checks
      if (isSportsRelated || isPotentiallySportsRelated) {
        // Call the Groq API for the initial response
        const initialResponse = await groq.chat.completions.create({
          messages: [{ role: 'user', content: `${message} SPORTS` }],
          model: 'llama3-8b-8192',
        });

        const botResponse = initialResponse.choices[0]?.message?.content || "I'm not sure how to respond to that.";
        res.status(200).json({ sender: 'Bot', text: botResponse });
      } else {
        res.status(200).json({ sender: 'Bot', text: "I'm only here to share sports news. Please ask me about sports teams, players, matches, or tournaments." });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
