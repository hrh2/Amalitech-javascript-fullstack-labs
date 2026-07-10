let btn = document.querySelector('#new-quote');
let quote = document.querySelector('.quote');
let person = document.querySelector('.person');

const quotes = [
  {
    quote: "The only way to do great work is to love what you do.",
    person: "Steve Jobs"
  },
  {
    quote: "In the middle of difficulty lies opportunity.",
    person: "Albert Einstein"
  },
  {
    quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    person: "Winston Churchill"
  },
  {
    quote: "The future belongs to those who believe in the beauty of their dreams.",
    person: "Eleanor Roosevelt"
  },
  {
    quote: "Strive not to be a success, but rather to be of value.",
    person: "Albert Einstein"
  },
  {
    quote: "You miss 100% of the shots you don't take.",
    person: "Wayne Gretzky"
  },
  {
    quote: "It always seems impossible until it's done.",
    person: "Nelson Mandela"
  },
  {
    quote: "The only limit to our realization of tomorrow will be our doubts of today.",
    person: "Franklin D. Roosevelt"
  },
  {
    quote: "Do what you can, with what you have, where you are.",
    person: "Theodore Roosevelt"
  },
  {
    quote: "Happiness is not something ready-made. It comes from your own actions.",
    person: "Dalai Lama"
  },
  {
    quote: "If you want to lift yourself up, lift up someone else.",
    person: "Booker T. Washington"
  },
  {
    quote: "You must be the change you wish to see in the world.",
    person: "Mahatma Gandhi"
  },
  {
    quote: "Whether you think you can or you think you can't, you're right.",
    person: "Henry Ford"
  },
  {
    quote: "Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.",
    person: "Martin Luther King Jr."
  },
  {
    quote: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
    person: "Ralph Waldo Emerson"
  }
];

btn.addEventListener('click', () => {
    let random = Math.floor(Math.random() * quotes.length);
    quote.innerText = quotes[random].quote;
    person.innerText = quotes[random].person;
})

