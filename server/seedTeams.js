const Team = require('./models/Team');

const teamsData = [
  { name: 'Argentina', flagEmoji: '🇦🇷', primaryColor: '#43A1D5', secondaryColor: '#FFFFFF' },
  { name: 'France', flagEmoji: '🇫🇷', primaryColor: '#002395', secondaryColor: '#ED2939' },
  { name: 'Brazil', flagEmoji: '🇧🇷', primaryColor: '#009C3B', secondaryColor: '#FFDF00' },
  { name: 'England', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', primaryColor: '#FFFFFF', secondaryColor: '#CE1124' },
  { name: 'Portugal', flagEmoji: '🇵🇹', primaryColor: '#FF0000', secondaryColor: '#006600' },
  { name: 'Spain', flagEmoji: '🇪🇸', primaryColor: '#AA151B', secondaryColor: '#F1BF00' },
  { name: 'Germany', flagEmoji: '🇩🇪', primaryColor: '#000000', secondaryColor: '#FFCE00' },
  { name: 'Italy', flagEmoji: '🇮🇹', primaryColor: '#008C45', secondaryColor: '#CD212A' },
  { name: 'Netherlands', flagEmoji: '🇳🇱', primaryColor: '#AE1C28', secondaryColor: '#21468B' },
  { name: 'USA', flagEmoji: '🇺🇸', primaryColor: '#B22234', secondaryColor: '#3C3B6E' },
  { name: 'Mexico', flagEmoji: '🇲🇽', primaryColor: '#006847', secondaryColor: '#CE1126' },
  { name: 'Canada', flagEmoji: '🇨🇦', primaryColor: '#FF0000', secondaryColor: '#FFFFFF' },
  { name: 'Japan', flagEmoji: '🇯🇵', primaryColor: '#BC002D', secondaryColor: '#FFFFFF' },
  { name: 'South Korea', flagEmoji: '🇰🇷', primaryColor: '#CD2E3A', secondaryColor: '#0047A0' },
  { name: 'Morocco', flagEmoji: '🇲🇦', primaryColor: '#C1272D', secondaryColor: '#006233' },
  { name: 'Senegal', flagEmoji: '🇸🇳', primaryColor: '#00853F', secondaryColor: '#FDEF42' },
  { name: 'Croatia', flagEmoji: '🇭🇷', primaryColor: '#FF0000', secondaryColor: '#FFFFFF' },
  { name: 'Uruguay', flagEmoji: '🇺🇾', primaryColor: '#0038A8', secondaryColor: '#FFFFFF' },
  { name: 'Belgium', flagEmoji: '🇧🇪', primaryColor: '#000000', secondaryColor: '#FDDA24' },
  { name: 'Switzerland', flagEmoji: '🇨🇭', primaryColor: '#FF0000', secondaryColor: '#FFFFFF' },
  { name: 'Colombia', flagEmoji: '🇨🇴', primaryColor: '#FCD116', secondaryColor: '#003893' },
  { name: 'Ecuador', flagEmoji: '🇪🇨', primaryColor: '#FFD100', secondaryColor: '#001489' },
  { name: 'Peru', flagEmoji: '🇵🇪', primaryColor: '#D91023', secondaryColor: '#FFFFFF' },
  { name: 'Chile', flagEmoji: '🇨🇱', primaryColor: '#D52B1E', secondaryColor: '#0039A6' },
  { name: 'Australia', flagEmoji: '🇦🇺', primaryColor: '#00008B', secondaryColor: '#FFCD00' },
  { name: 'Saudi Arabia', flagEmoji: '🇸🇦', primaryColor: '#006C35', secondaryColor: '#FFFFFF' },
  { name: 'Iran', flagEmoji: '🇮🇷', primaryColor: '#239F40', secondaryColor: '#DA0000' },
  { name: 'Ghana', flagEmoji: '🇬🇭', primaryColor: '#CE1126', secondaryColor: '#FCD116' },
  { name: 'Cameroon', flagEmoji: '🇨🇲', primaryColor: '#007A5E', secondaryColor: '#CE1126' },
  { name: 'Nigeria', flagEmoji: '🇳🇬', primaryColor: '#008751', secondaryColor: '#FFFFFF' },
  { name: 'Egypt', flagEmoji: '🇪🇬', primaryColor: '#CE1126', secondaryColor: '#000000' },
  { name: 'Algeria', flagEmoji: '🇩🇿', primaryColor: '#006233', secondaryColor: '#D21034' },
  { name: 'Wales', flagEmoji: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', primaryColor: '#D30731', secondaryColor: '#00AB39' },
  { name: 'Poland', flagEmoji: '🇵🇱', primaryColor: '#DC143C', secondaryColor: '#FFFFFF' },
  { name: 'Serbia', flagEmoji: '🇷🇸', primaryColor: '#C6363C', secondaryColor: '#0C4076' },
  { name: 'Denmark', flagEmoji: '🇩🇰', primaryColor: '#C60C30', secondaryColor: '#FFFFFF' },
  { name: 'Sweden', flagEmoji: '🇸🇪', primaryColor: '#004B87', secondaryColor: '#FFCD00' },
  { name: 'Norway', flagEmoji: '🇳🇴', primaryColor: '#BA0C2F', secondaryColor: '#00205B' },
  { name: 'Turkey', flagEmoji: '🇹🇷', primaryColor: '#E30A17', secondaryColor: '#FFFFFF' },
  { name: 'Ukraine', flagEmoji: '🇺🇦', primaryColor: '#0057B7', secondaryColor: '#FFDD00' },
  { name: 'Costa Rica', flagEmoji: '🇨🇷', primaryColor: '#CE1126', secondaryColor: '#002B7F' },
  { name: 'Panama', flagEmoji: '🇵🇦', primaryColor: '#C8102E', secondaryColor: '#00205B' },
  { name: 'Jamaica', flagEmoji: '🇯🇲', primaryColor: '#009B3A', secondaryColor: '#FED100' },
  { name: 'Honduras', flagEmoji: '🇭🇳', primaryColor: '#00BCE4', secondaryColor: '#FFFFFF' },
  { name: 'Ivory Coast', flagEmoji: '🇨🇮', primaryColor: '#FF8200', secondaryColor: '#009E60' },
  { name: 'Mali', flagEmoji: '🇲🇱', primaryColor: '#14B53A', secondaryColor: '#FCD116' },
  { name: 'Tunisia', flagEmoji: '🇹🇳', primaryColor: '#E70013', secondaryColor: '#FFFFFF' },
  { name: 'Qatar', flagEmoji: '🇶🇦', primaryColor: '#8A1538', secondaryColor: '#FFFFFF' }
];

const seedTeams = async () => {
  try {
    const count = await Team.countDocuments();
    if (count === 0) {
      console.log('Seeding 48 teams...');
      await Team.insertMany(teamsData);
      console.log('Teams seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding teams:', err);
  }
};

module.exports = seedTeams;
