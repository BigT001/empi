const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

// 1. Define Schemas Inline for direct Node execution
const EmailServiceSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  provider: { type: String, enum: ['simulated', 'imap_smtp'], default: 'simulated' },
  settings: mongoose.Schema.Types.Mixed,
  isActive: { type: Boolean, default: true },
  allowedRoles: { type: [String], default: [] },
  allowedAdmins: { type: [mongoose.Schema.Types.ObjectId], ref: 'Admin', default: [] },
}, { timestamps: true, collection: 'email_services' });

const MailRoomTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  customerName: { type: String, default: '' },
  customerEmail: { type: String, required: true, lowercase: true },
  status: { type: String, enum: ['open', 'pending', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  department: { type: String, required: true, lowercase: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  lastMessageAt: { type: Date, default: Date.now },
  tags: { type: [String], default: [] },
}, { timestamps: true, collection: 'mail_room_tickets' });

const MailRoomMessageSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailRoomTicket', required: true },
  direction: { type: String, enum: ['inbound', 'outbound'], required: true },
  senderEmail: { type: String, required: true, lowercase: true },
  senderName: { type: String, required: true },
  recipientEmail: { type: String, required: true, lowercase: true },
  content: { type: String, required: true },
}, { timestamps: true, collection: 'mail_room_messages' });

const EmailService = mongoose.model('EmailServiceSeed', EmailServiceSchema);
const MailRoomTicket = mongoose.model('MailRoomTicketSeed', MailRoomTicketSchema);
const MailRoomMessage = mongoose.model('MailRoomMessageSeed', MailRoomMessageSchema);

const defaultServices = [
  { email: 'info@empicostumes.com', name: 'Info' },
  { email: 'support@empicostumes.com', name: 'Support' },
  { email: 'pmoney@empicostumes.com', name: 'Pmoney' },
  { email: 'thecostumeshow@empicostumes.com', name: 'The Costume Show' },
  { email: 'bookings@empicostumes.com', name: 'Bookings' },
  { email: 'production@empicostumes.com', name: 'Production' },
  { email: 'rentals@empicostumes.com', name: 'Rentals' },
  { email: 'recruitment@empicostumes.com', name: 'Recruitment' },
];

const customerPool = [
  { name: 'Alex Johnson', email: 'alex.j@example.com' },
  { name: 'Maria Garcia', email: 'mgarcia@example.com' },
  { name: 'David Smith', email: 'dsmith199@example.com' },
  { name: 'Elena Petrova', email: 'elena.p@example.com' },
  { name: 'James Wilson', email: 'james.wilson@example.com' },
  { name: 'Aisha Keita', email: 'aisha.k@example.com' },
  { name: 'Yuki Tanaka', email: 'y.tanaka@example.com' },
  { name: 'Liam O\'Connor', email: 'liam.oc@example.com' },
  { name: 'Chloe Dubois', email: 'chloe.d@example.com' },
  { name: 'Marcus Aurelius', email: 'marcus.ceo@example.com' },
];

const mockTemplates = {
  'info@empicostumes.com': {
    subjects: [
      'General Store Opening Hours & Location query',
      'Do you offer shipping to North America?',
      'Wholesale ordering inquiries for drama schools',
      'Do you design custom props or only costumes?',
      'Sustainability and fabrics sourcing details',
      'Press kit request for Costume Magazine',
    ],
    contents: [
      'Hello, I am planning to visit your store this weekend. Could you confirm your opening hours and if there is parking nearby?',
      'Hi there, we are a theater company in Boston and would love to know if you can ship custom costumes to the US, and what the rates are.',
      'Dear Empi team, I am the head of drama at Oakridge Academy. We are looking to order 50 medieval tunics. Do you offer bulk discounts?',
      'Good morning. I am looking for a replica of a medieval broadsword for a photoshoot. Do you design prop weapons alongside your costume collections?',
      'Hello, could you let me know if your fabrics are sustainably sourced? We have strict eco-friendly rules for our upcoming production.',
      'Hi, I am writing a feature article on the best premium costume makers in the UK. Can you send over your latest press kit and high-res logo?',
    ]
  },
  'support@empicostumes.com': {
    subjects: [
      'Unable to log in to my customer portal',
      'Payment error: Card declined during checkout',
      'Promo code EMPI10 not applying',
      'Password reset link not received',
      'Empty shopping cart after adding 3 items',
      'Website error 500 when uploading measurements page',
    ],
    contents: [
      'Hi, every time I enter my credentials, I get redirected to the login page without any error message. Please help me access my account.',
      'Hello, I tried checking out three times with my Visa card but it keeps saying transaction failed. My bank says there is no issue on their end.',
      'Dear support, I received a newsletter with code EMPI10 for 10% off. However, when I enter it at checkout, it says code invalid.',
      'Hello, I clicked "Forgot Password" but I haven\'t received the reset link in my inbox or spam folders. Can you check my email status?',
      'Hi, I spend an hour picking custom fabrics and adding them to the cart, but when I click the cart icon it says it is empty. Help!',
      'Hi team, I am trying to upload my custom tailoring measurements pdf on the portal, but after clicking submit I get a generic white error screen.',
    ]
  },
  'pmoney@empicostumes.com': {
    subjects: [
      'Invoice payment confirmation - Order #EMPI-9082',
      'Request for bank transfer details (IBAN/BIC)',
      'Refund status for order cancelation #EMPI-8761',
      'VAT invoice copy request for company records',
      'Incorrect billing address on recent receipt',
      'Wire transfer confirmation document upload',
    ],
    contents: [
      'Hello Finance, we have just wired the final payment for our movie set order #EMPI-9082. Please find the bank slip receipt attached.',
      'Hi, I would prefer to pay my custom costume invoice via direct bank wire. Could you send me your bank details including IBAN and Swift BIC?',
      'Hello, my order was canceled 5 days ago but I haven\'t seen the refund in my account yet. Could you check if the refund transaction has cleared?',
      'Dear Accounts department, could you please issue a formal VAT invoice for our order? Our tax compliance team requires it for processing.',
      'Hi, my receipt has my old billing address. Could you update it to my new address and reissue the receipt for tax purposes?',
      'Good day, here is the confirmation document for the $4,500 wire transfer for our booking caution fee. Please verify receipt.',
    ]
  },
  'thecostumeshow@empicostumes.com': {
    subjects: [
      'Media accreditation request for The Costume Show',
      'Exhibitor booths and sponsorship query',
      'VIP Ticket booking assistance',
      'Podcast interview invitation with lead designer',
      'Promotional partnership for fashion school students',
    ],
    contents: [
      'Hi Show Coordinator, I write for the Costume Design Review. I would like to request a press pass for your upcoming annual Costume Show exhibition.',
      'Hello, we are interested in booking a premier exhibitor booth for the September show. Could you send the floor plan and sponsorship details?',
      'Dear Empi, I am trying to purchase 5 VIP front-row tickets for the gala show but the system says sold out. Are there any house tickets left?',
      'Hi, we host the "Behind the Seams" podcast and would love to interview your head designer about the inspiration behind this year\'s runway show.',
      'Hello! We would love to collaborate on offering discounted entry tickets to students at the London College of Fashion. Can we arrange this?',
    ]
  },
  'bookings@empicostumes.com': {
    subjects: [
      'Costume Booking request for Shakespeare Festival',
      'Bridal shower custom themed costumes booking',
      'Photoshoot rental booking - Vintage Edwardian gown',
      'TV Commercial costume booking - July 14th',
      'Corporate team-building theme costume booking',
      'Theater group booking - 15 Elizabethan outfits',
    ],
    contents: [
      'Hi, we are staging Hamlet this fall and need to book 12 Tudor-style costumes from October 1st to October 15th. Are these available?',
      'Hello! I am planning a Victorian-themed bridal shower. We need to book 8 corsets and hoop skirts for a weekend. What is your pricing?',
      'Dear bookings, I need to book the vintage green Edwardian gown (SKU-EDW-08) for a magazine shoot on Friday. Please confirm availability.',
      'Hi, we are filming a commercial in London and need 4 futuristic sci-fi suits booked. We need them delivered on set by July 14th.',
      'Hello, we are organizing a medieval banquet team building day for our 30 employees. Do you have enough armor and gowns to accommodate us?',
      'Dear Empi, our theater society wishes to book 15 high-quality Elizabethan outfits for a run of Macbeth. Can we schedule a fitting session?',
    ]
  },
  'production@empicostumes.com': {
    subjects: [
      'Fabric selection approval for Custom Order #706',
      'Production timeline update query - Film Set #09',
      'Tailoring measurements check for knight armor suit',
      'Design sketch adjustments - Fantasy Elf Queen',
      'Availability of Italian silk velvet fabric',
    ],
    contents: [
      'Hi Production, I approve of the French lace sample you sent. Please proceed with fabricating the bridal gown under order #706.',
      'Hello, can you give me an update on the sewing progress for the superhero capes? We are starting filming next week and need them ready.',
      'Dear Tailors, I wanted to double-check my shoulder measurement. I measured 48cm, but I think it should be 50cm for comfortable armor movement.',
      'Hi Design Team, I reviewed the sketch for the Elf Queen outfit. Could we make the cape longer and change the gold embroidery to silver?',
      'Hello, is the heavy Italian silk velvet in royal blue currently in stock? We want to specify it for the king\'s robe.',
    ]
  },
  'rentals@empicostumes.com': {
    subjects: [
      'Request to extend rental period - Invoice #902',
      'Return procedure for booked outfits via post',
      'Caution fee refund status for Order #EMPI-7651',
      'Costume returned with minor zipper damage',
      'Late return notification and fee inquiry',
    ],
    contents: [
      'Hi rentals, we need to keep the pirate costumes for an extra 3 days due to rain delays in our photoshoot. How do we pay for the extension?',
      'Hello, we are finishing our play tonight. Should we send the costumes back in the original boxes, and do you supply return shipping labels?',
      'Dear rentals team, I returned the Victorian coat last Monday. Can you let me know when my £150 caution fee refund will be credited back?',
      'Hi, during our event the zipper on the green gown got stuck and ripped slightly. I wanted to report it before sending it back.',
      'Hello, our event ran late, and we will return the outfits tomorrow morning instead of today. Will we be charged a late fee?',
    ]
  },
  'recruitment@empicostumes.com': {
    subjects: [
      'Application: Head of Tailoring Position - Arthur Pendragon',
      'Internship inquiry: Fashion & Costume design student',
      'Portfolio submission: Pattern Cutter Specialist',
      'Inquiry about junior seamstress job openings',
    ],
    contents: [
      'Dear Hiring Manager, I am writing to apply for the Head Tailor position. I have 12 years of experience in historical pattern cutting. CV attached.',
      'Hello Empi Costumes, I am in my second year at Central Saint Martins and would love to do a 3-month internship in your production workshop.',
      'Hi there, please find attached my portfolio showcasing historical costume pattern drafts. I would join your creative team.',
      'Good day, I am a recent graduate in garment design. Do you have any entry-level seamstress positions available in your atelier?',
    ]
  }
};

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected.');

    // Clear previous collections
    console.log('🗑️ Clearing existing mail room collections...');
    await EmailService.deleteMany({});
    await MailRoomTicket.deleteMany({});
    await MailRoomMessage.deleteMany({});
    console.log('✅ Collections cleared.');

    // Seed default services
    console.log('📧 Seeding default email services...');
    for (const serviceInfo of defaultServices) {
      const service = new EmailService({
        email: serviceInfo.email,
        name: serviceInfo.name,
        provider: 'simulated',
        isActive: true,
        allowedRoles: [],
        allowedAdmins: [],
      });
      await service.save();
    }
    console.log('✅ Seeding email services completed.');

    // Seed tickets matching prompt target counts
    // Total 120 messages
    const targetCounts = {
      'info@empicostumes.com': 12,
      'support@empicostumes.com': 20,
      'bookings@empicostumes.com': 35,
      'rentals@empicostumes.com': 15,
      'production@empicostumes.com': 10,
      'recruitment@empicostumes.com': 8,
      'thecostumeshow@empicostumes.com': 5,
      'pmoney@empicostumes.com': 15,
    };

    console.log('🎟️ Seeding support tickets & messages (Target: 120 total)...');
    let totalTickets = 0;
    let totalMessages = 0;

    for (const [email, count] of Object.entries(targetCounts)) {
      const template = mockTemplates[email];
      
      for (let i = 0; i < count; i++) {
        const customer = customerPool[i % customerPool.length];
        const subject = template.subjects[i % template.subjects.length];
        const content = template.contents[i % template.contents.length];

        const ticketNum = `EMPI-${email.split('@')[0].toUpperCase().substring(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`;
        
        const priorities = ['low', 'medium', 'high', 'urgent'];
        const statuses = ['open', 'pending', 'resolved', 'closed'];
        
        const priority = priorities[Math.floor(Math.random() * 4)];
        const statusVal = statuses[i % 4 === 0 ? 1 : (i % 5 === 0 ? 2 : 0)]; 

        // Offset lastMessageAt to distribute over history
        const lastMsgAt = new Date(Date.now() - (i * 12 * 60 * 60 * 1000));

        const ticket = new MailRoomTicket({
          ticketNumber: ticketNum,
          subject,
          customerName: customer.name,
          customerEmail: customer.email,
          status: statusVal,
          priority,
          department: email,
          assignedTo: null,
          lastMessageAt: lastMsgAt,
          tags: [email.split('@')[0], 'seeded'],
        });

        await ticket.save();
        totalTickets++;

        const message = new MailRoomMessage({
          ticketId: ticket._id,
          direction: 'inbound',
          senderEmail: customer.email,
          senderName: customer.name,
          recipientEmail: email,
          content,
          createdAt: lastMsgAt,
        });

        await message.save();
        totalMessages++;

        // Outbound reply simulation
        if (statusVal !== 'open') {
          const reply = new MailRoomMessage({
            ticketId: ticket._id,
            direction: 'outbound',
            senderEmail: email,
            senderName: 'Atelier Support Representative',
            recipientEmail: customer.email,
            content: `Dear ${customer.name},\n\nWe have received your email regarding "${subject}". Our department is looking into it and we will follow up with you shortly.\n\nWarm regards,\nEmpi Costumes Department`,
            createdAt: new Date(lastMsgAt.getTime() + 4 * 60 * 60 * 1000),
          });
          await reply.save();
          totalMessages++;
        }
      }
    }

    console.log(`🎉 Success! Seeded ${totalTickets} tickets with ${totalMessages} messages.`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
}

seed();
