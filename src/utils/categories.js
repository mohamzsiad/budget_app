export const CATEGORIES = [
  {
    name: 'Food & Dining',
    emoji: '🍔',
    subcategories: ['Groceries', 'Restaurants', 'Fast Food', 'Coffee & Drinks', 'Bars & Nightlife', 'Food Delivery'],
  },
  {
    name: 'Transportation',
    emoji: '🚗',
    subcategories: ['Fuel/Gas', 'Public Transit', 'Taxi/Uber/Lyft', 'Parking', 'Car Maintenance', 'Tolls', 'Car Insurance', 'Car Loan'],
  },
  {
    name: 'Housing',
    emoji: '🏠',
    subcategories: ['Rent/Mortgage', 'Utilities', 'Internet', 'Cable/TV', 'Home Maintenance', 'Home Insurance', 'Cleaning'],
  },
  {
    name: 'Health & Medical',
    emoji: '🏥',
    subcategories: ['Doctor/Hospital', 'Dentist', 'Pharmacy/Medicine', 'Health Insurance', 'Gym/Fitness', 'Mental Health', 'Vision/Optometry'],
  },
  {
    name: 'Education',
    emoji: '🎓',
    subcategories: ['Tuition', 'Books & Supplies', 'Online Courses', 'Tutoring', 'Student Loan', 'School Fees'],
  },
  {
    name: 'Shopping & Apparel',
    emoji: '👗',
    subcategories: ['Clothing', 'Shoes', 'Accessories', 'Electronics', 'Furniture', 'Home Goods', 'Online Shopping'],
  },
  {
    name: 'Entertainment & Leisure',
    emoji: '🎮',
    subcategories: ['Movies & Events', 'Streaming Services', 'Games', 'Hobbies', 'Sports', 'Books & Magazines'],
  },
  {
    name: 'Travel',
    emoji: '✈️',
    subcategories: ['Flights', 'Hotels', 'Vacation Packages', 'Travel Insurance', 'Visa Fees', 'Activities'],
  },
  {
    name: 'Family & Personal Care',
    emoji: '👶',
    subcategories: ['Childcare/Daycare', 'Baby Supplies', 'Haircut & Salon', 'Personal Hygiene', 'Pet Care'],
  },
  {
    name: 'Technology & Subscriptions',
    emoji: '💻',
    subcategories: ['Software Subscriptions', 'App Purchases', 'Cloud Storage', 'Domain/Hosting'],
  },
  {
    name: 'Communication',
    emoji: '📱',
    subcategories: ['Phone Bill', 'SIM/Data Plans'],
  },
  {
    name: 'Financial',
    emoji: '💰',
    subcategories: ['Taxes', 'Investments', 'Savings', 'Loan Repayments', 'Credit Card Payments', 'Bank Fees'],
  },
  {
    name: 'Gifts & Donations',
    emoji: '🎁',
    subcategories: ['Gifts', 'Charity', 'Religious Donations'],
  },
  {
    name: 'Business & Work',
    emoji: '💼',
    subcategories: ['Office Supplies', 'Work Travel', 'Professional Memberships', 'Tools & Equipment'],
  },
  {
    name: 'Other',
    emoji: '🌐',
    subcategories: ['Miscellaneous', 'Uncategorized'],
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((cat) => [cat.name, cat])
);
