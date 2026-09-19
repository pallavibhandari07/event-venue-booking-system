const User = require('../models/User');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');

const seedData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      // Database already seeded
      return;
    }

    console.log('🌱 Seeding default venues, users, and bookings...');

    // 1. Create Default Users
    const adminUser = await User.create({
      name: 'Dr. Sarah Mitchell',
      email: 'admin@campus.edu',
      password: 'admin123',
      role: 'admin',
      organization: 'Campus Facilities & Venue Management Office',
      phone: '+1 (555) 019-2834'
    });

    const organizerUser = await User.create({
      name: 'Alex Rivera',
      email: 'organizer@campus.edu',
      password: 'org123',
      role: 'organizer',
      organization: 'Tech & Innovation Club (Student Body)',
      phone: '+1 (555) 018-9921'
    });

    console.log('✓ Users created: Admin (admin@campus.edu) & Organizer (organizer@campus.edu)');

    // 2. Create Venues
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const venues = await Venue.create([
      {
        name: 'Grand Central Auditorium',
        description: 'Premier campus auditorium equipped with high-fidelity acoustics, dual laser projectors, theater lighting, and executive VIP seating.',
        location: 'Main Academic Wing - Level 1',
        capacity: 500,
        facilities: ['Projector', 'Audio System', 'Air Conditioning', 'Stage', 'WiFi', 'Live Streaming', 'Green Room'],
        hourlyRate: 2500,
        imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        maintenanceBlocks: [
          {
            date: nextWeekStr,
            startTime: '08:00',
            endTime: '14:00',
            reason: 'Audio/Visual system firmware upgrade and projector recalibration'
          }
        ]
      },
      {
        name: 'Apex Innovation & Tech Lab',
        description: 'Modern collaborative space tailored for hackathons, coding workshops, and interactive technical symposiums with high-speed networking.',
        location: 'Science & Engineering Complex - Room 302',
        capacity: 70,
        facilities: ['Projector', 'WiFi', 'Air Conditioning', 'Whiteboard', 'Video Conferencing'],
        hourlyRate: 1200,
        imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
        status: 'available'
      },
      {
        name: 'Executive Boardroom Suite',
        description: 'Intimate, sound-dampened meeting suite suitable for committee deliberations, administrative panels, and partner presentations.',
        location: 'Administration Tower - 6th Floor',
        capacity: 30,
        facilities: ['Video Conferencing', 'Air Conditioning', 'Audio System', 'WiFi'],
        hourlyRate: 800,
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        status: 'available'
      },
      {
        name: 'Open-Air Amphitheatre',
        description: 'Majestic open-air amphitheater with terraced seating, dynamic acoustics, and outdoor floodlighting, ideal for cultural festivals and convocation rallies.',
        location: 'West Campus Gardens',
        capacity: 350,
        facilities: ['Stage', 'Audio System', 'Green Room', 'Outdoor Lighting'],
        hourlyRate: 1800,
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
        status: 'available'
      },
      {
        name: 'Community Workshop Hall C',
        description: 'Spacious multi-purpose room with flexible modular tables, whiteboard walls, and natural ambient lighting for hands-on creative sessions.',
        location: 'Student Activity Center - Hall C',
        capacity: 90,
        facilities: ['Projector', 'Whiteboard', 'Air Conditioning', 'WiFi'],
        hourlyRate: 600,
        imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
        status: 'available'
      }
    ]);

    console.log(`✓ Venues created: ${venues.length} venues populated.`);

    // 3. Create Sample Bookings (Today's, Upcoming, Completed, Pending)
    await Booking.create([
      {
        venue: venues[0]._id, // Grand Central Auditorium
        organizer: organizerUser._id,
        eventName: 'Annual University Tech Symposium',
        eventDescription: 'Keynote speeches by industry leaders followed by panel Q&A session.',
        expectedAttendees: 450,
        date: todayStr,
        startTime: '10:00',
        endTime: '14:00',
        durationHours: 4,
        totalCost: 4 * 2500,
        status: 'approved',
        adminNotes: 'Facilities team notified for staging setup.'
      },
      {
        venue: venues[1]._id, // Apex Tech Lab
        organizer: organizerUser._id,
        eventName: 'AI/ML Hackathon Orientation',
        eventDescription: 'Team registration and introductory workshop for 48-hour challenge.',
        expectedAttendees: 60,
        date: tomorrowStr,
        startTime: '13:00',
        endTime: '17:00',
        durationHours: 4,
        totalCost: 4 * 1200,
        status: 'pending'
      },
      {
        venue: venues[2]._id, // Executive Boardroom
        organizer: organizerUser._id,
        eventName: 'Campus Senate Quarterly Review',
        eventDescription: 'Budget review and policy voting for upcoming semester.',
        expectedAttendees: 24,
        date: todayStr,
        startTime: '15:00',
        endTime: '17:00',
        durationHours: 2,
        totalCost: 2 * 800,
        status: 'approved',
        adminNotes: 'Refreshments confirmed.'
      },
      {
        venue: venues[4]._id, // Community Hall C
        organizer: organizerUser._id,
        eventName: 'Robotics Design Sprint',
        eventDescription: 'Hardware prototyping and chassis testing.',
        expectedAttendees: 55,
        date: '2026-09-10', // past date
        startTime: '09:00',
        endTime: '13:00',
        durationHours: 4,
        totalCost: 4 * 600,
        status: 'completed',
        adminNotes: 'Event successfully concluded.'
      }
    ]);

    console.log('✓ Initial Bookings created across statuses.');
    console.log('✨ Database seeding complete!\n');
  } catch (err) {
    console.error('Error during database seed:', err);
  }
};

module.exports = seedData;
